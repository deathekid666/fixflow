const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const jwt = require("jsonwebtoken");
function load(file, mocks = {}) {
  const filename = path.resolve(file),
    mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = (id) =>
    Object.prototype.hasOwnProperty.call(mocks, id) ? mocks[id] : require(id);
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
  return mod.exports;
}
const { withApiError } = load("src/lib/apiError.ts");
const user = {
  id: "test-user",
  role: "ADMIN",
  shopId: "shop-a",
  isSuperAdmin: false,
};
function route(file, prisma, identity = user) {
  return load(file, {
    "@/lib/prisma": { prisma },
    "@/lib/requireAuth": { requireAuth: () => identity },
    "@/lib/apiError": { withApiError },
    "@/lib/notifications": {
      getShopAdminIds: async () => [],
      createNotification: async () => {},
    },
    "@/lib/pushNotify": { pushToUser: async () => {} },
    "@vercel/blob": { put: async () => {}, del: async () => {} },
  });
}
const context = { params: Promise.resolve({ id: "repair-a" }) };
test("JSON errors are 400; unexpected errors remain JSON 500", async () => {
  const req = new Request("https://test/api/demo?secret=not-for-logs", {
    method: "POST",
    body: "{",
  });
  assert.equal(
    (
      await withApiError(async (r) => {
        await r.json();
        return Response.json({});
      })(req)
    ).status,
    400,
  );
  assert.equal(
    (
      await withApiError(async () => {
        throw new Error("private");
      })(req)
    ).status,
    500,
  );
});
test("middleware session verifies signature, expiry and algorithm", async () => {
  const { verifySession } = load("src/lib/verifySession.ts");
  const token = jwt.sign({ id: "user", role: "ADMIN" }, "local-test-secret", {
    expiresIn: 60,
  });
  assert.equal((await verifySession(token, "local-test-secret")).id, "user");
  await assert.rejects(verifySession(token, "different-secret"));
  await assert.rejects(
    verifySession(
      jwt.sign({ id: "user" }, "local-test-secret", { expiresIn: -1 }),
      "local-test-secret",
    ),
  );
  await assert.rejects(
    verifySession(
      jwt.sign({ id: "user" }, "local-test-secret", {
        algorithm: "HS384",
        expiresIn: 60,
      }),
      "local-test-secret",
    ),
  );
});
test("attachment reads and deletes deny cross-shop access before touching files", async () => {
  for (const method of ["GET", "POST", "DELETE"]) {
    let filter;
    const api = route("src/app/api/workorders/[id]/attachments/route.ts", {
      workOrder: {
        findFirst: async (args) => {
          filter = args.where;
          return null;
        },
      },
    });
    const response = await api[method](
      new Request("https://test/api/workorders/repair-a/attachments", {
        method,
      }),
      context,
    );
    assert.equal(response.status, 404);
    assert.equal(filter.shopId, "shop-a");
    assert.equal(filter.deletedAt, null);
  }
});
test("shopless accounts cannot read attachments or ratings", async () => {
  for (const [file, method] of [
    ["src/app/api/workorders/[id]/attachments/route.ts", "GET"],
    ["src/app/api/ratings/route.ts", "GET"],
  ]) {
    const api = route(file, {}, { ...user, shopId: null });
    assert.equal(
      (await api[method](new Request("https://test/api/test"), context)).status,
      403,
    );
  }
});
test("shop admins only query their own ratings", async () => {
  let where;
  const api = route("src/app/api/ratings/route.ts", {
    satisfactionRating: {
      findMany: async (args) => {
        where = args.where;
        return [];
      },
    },
  });
  assert.equal(
    (await api.GET(new Request("https://test/api/ratings"))).status,
    200,
  );
  assert.equal(where.workOrder.shopId, "shop-a");
});
test("tracking uses exact full reference and excludes deleted orders", async () => {
  let query;
  const api = route(
    "src/app/api/track/route.ts",
    {
      workOrder: {
        findFirst: async (args) => {
          query = args;
          return null;
        },
      },
    },
    null,
  );
  assert.equal(
    (
      await api.GET(
        new Request("https://test/api/track?orderNumber=WO-2026-1234-abcd"),
      )
    ).status,
    404,
  );
  assert.deepEqual(query.where, {
    orderNumber: "wo-2026-1234-abcd",
    deletedAt: null,
  });
  assert.ok(query.select.logs.where);
});
test("customer chat requires the matching repair reference", async () => {
  const api = route(
    "src/app/api/workorders/[id]/messages/route.ts",
    {
      workOrder: {
        findFirst: async () => ({
          id: "repair-a",
          shopId: "shop-a",
          orderNumber: "private-reference",
        }),
      },
    },
    null,
  );
  assert.equal(
    (await api.GET(new Request("https://test/api/messages"), context)).status,
    403,
  );
  assert.equal(
    (
      await api.POST(
        new Request("https://test/api/messages", {
          method: "POST",
          body: JSON.stringify({ message: 123 }),
        }),
        context,
      )
    ).status,
    400,
  );
});
test("invalid calendar dates fail before database access", async () => {
  const api = route("src/app/api/appointments/slots/route.ts", {}, null);
  assert.equal(
    (
      await api.GET(
        new Request(
          "https://test/api/appointments/slots?shopId=a&date=2026-02-31",
        ),
      )
    ).status,
    400,
  );
});
test("booking rejects unavailable and full slots inside a serializable transaction", async () => {
  for (const full of [false, true]) {
    const tx = {
      shopAvailability: {
        findMany: async () => [
          {
            dayOfWeek: 1,
            isOpen: full,
            openTime: "09:00",
            closeTime: "18:00",
            slotDurationMinutes: 60,
            maxConcurrent: 1,
          },
        ],
      },
      shopClosure: { findFirst: async () => null },
      appointment: {
        findMany: async () => [
          { scheduledAt: new Date("2030-01-07T10:00:00Z"), duration: 60 },
        ],
        create: async () => {
          throw Error("must not create");
        },
      },
    };
    const api = route("src/app/api/appointments/route.ts", {
      $transaction: async (fn, options) => {
        assert.equal(options.isolationLevel, "Serializable");
        return fn(tx);
      },
    });
    const response = await api.POST(
      new Request("https://test/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          customerName: "Test",
          customerPhone: "123",
          deviceBrand: "Test",
          deviceModel: "Phone",
          faultDescription: "Screen",
          scheduledAt: "2030-01-07T10:00:00Z",
        }),
      }),
    );
    assert.equal(response.status, 409);
  }
});
test("booking rejects non-string input and fractional duration", async () => {
  const api = route("src/app/api/appointments/route.ts", {});
  const body = {
    customerName: "Test",
    customerPhone: "123",
    deviceBrand: "Test",
    deviceModel: "Phone",
    faultDescription: "Screen",
    scheduledAt: "2030-01-07T10:00:00Z",
  };
  for (const change of [{ customerName: {} }, { duration: "1.5" }])
    assert.equal(
      (
        await api.POST(
          new Request("https://test/api/appointments", {
            method: "POST",
            body: JSON.stringify({ ...body, ...change }),
          }),
        )
      ).status,
      400,
    );
});

test("all nine AI endpoints return a clear unavailable status without credentials", async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const files = fs
      .readdirSync("src/app/api/ai", { recursive: true })
      .filter((f) => f.endsWith("route.ts"))
      .map((f) => "src/app/api/ai/" + f)
      .concat([
        "src/app/api/workorders/[id]/ai-assist/route.ts",
        "src/app/api/workorders/[id]/price-suggestion/route.ts",
      ]);
    assert.equal(files.length, 9);
    for (const file of files) {
      const api = route(file, {});
      assert.equal(
        (
          await api.POST(
            new Request("https://test/api/ai", { method: "POST", body: "{}" }),
            context,
          )
        ).status,
        503,
        file,
      );
    }
  } finally {
    if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previous;
  }
});
test("booking uses the configured slot duration when none is supplied", async () => {
  let saved;
  const tx = {
    shopAvailability: {
      findMany: async () => [
        {
          dayOfWeek: 1,
          isOpen: true,
          openTime: "09:00",
          closeTime: "18:00",
          slotDurationMinutes: 30,
          maxConcurrent: 2,
        },
      ],
    },
    shopClosure: { findFirst: async () => null },
    appointment: {
      findMany: async () => [],
      create: async ({ data }) => {
        saved = data;
        return { id: "new", ...data };
      },
    },
  };
  const api = route("src/app/api/appointments/route.ts", {
    $transaction: async (fn) => fn(tx),
  });
  const response = await api.POST(
    new Request("https://test/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Test",
        customerPhone: "123",
        deviceBrand: "Test",
        deviceModel: "Phone",
        faultDescription: "Screen",
        scheduledAt: "2030-01-07T10:00:00Z",
      }),
    }),
  );
  assert.equal(response.status, 201);
  assert.equal(saved.duration, 30);
});
test("partial shop schedules keep unconfigured days closed", async () => {
  const api = route(
    "src/app/api/public/shops/[shopId]/route.ts",
    {
      shop: { findUnique: async () => ({ id: "a", name: "Test" }) },
      shopAvailability: {
        findMany: async () => [{ dayOfWeek: 1, isOpen: true }],
      },
      shopClosure: { findMany: async () => [] },
    },
    null,
  );
  const response = await api.GET(
    new Request("https://test/api/public/shops/a"),
    { params: Promise.resolve({ shopId: "a" }) },
  );
  const data = await response.json();
  assert.equal(data.availability.length, 7);
  assert.equal(data.availability[1].isOpen, true);
  assert.equal(data.availability[2].isOpen, false);
});
test("bcrypt upgrade retains password hash verification", async () => {
  const bcrypt = require("bcrypt");
  const hash = await bcrypt.hash("test-only-password", 4);
  assert.equal(await bcrypt.compare("test-only-password", hash), true);
  assert.equal(await bcrypt.compare("wrong", hash), false);
});
