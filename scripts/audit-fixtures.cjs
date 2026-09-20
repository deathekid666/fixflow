const { chromium } = require("playwright");
const fs = require("fs");
const assert = require("assert/strict");
fs.mkdirSync(".audit", { recursive: true });
(async () => {
  const b = await chromium.launch();
  const output = [];
  const shop = {
    id: "audit-shop",
    name: "Sample Repair Workshop",
    logoUrl: null,
    phone: null,
    address: "123 Test Street",
    city: "Test City",
    country: "Test",
    certification: null,
    lat: null,
    lng: null,
    googleMapsUrl: null,
    availability: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      isOpen: true,
    })),
    closures: [],
    completedRepairs: 12,
    avgRating: 4.8,
    ratingCount: 3,
    reviews: [],
  };
  const order = {
    id: "audit-repair",
    orderNumber: "audit-reference",
    deviceBrand: "Apple",
    deviceModel: "iPhone 14",
    customerName: "Sample Customer",
    status: "DONE",
    receivedAt: "2026-09-19T09:00:00Z",
    doneAt: "2026-09-19T12:00:00Z",
    deliveredAt: null,
    faultDescription: "Screen replacement",
    repairType: "Screen",
    assignee: { name: "Technician" },
    shop,
    logs: [],
    rating: null,
    attachments: [],
  };
  for (const width of [320, 390, 768]) {
    const context = await b.newContext({
      viewport: { width, height: 844 },
      reducedMotion: "reduce",
    });
    await context.route("**/api/**", async (r) => {
      const url = new URL(r.request().url()),
        method = r.request().method();
      let data,
        status = 200;
      if (url.pathname === "/api/me") {
        data = { error: "Unauthorized" };
        status = 401;
      } else if (url.pathname.startsWith("/api/public/shops/")) data = shop;
      else if (url.pathname === "/api/directory") data = [shop];
      else if (url.pathname.startsWith("/api/directory/")) data = shop;
      else if (url.pathname === "/api/track") data = order;
      else if (url.pathname.endsWith("/messages")) {
        data = method === "GET" ? [] : { error: "Simulated message rejection" };
        if (method !== "GET") status = 503;
      } else if (url.pathname === "/api/appointments/slots")
        data = {
          closed: false,
          slots: [{ time: "10:00", available: true, remaining: 2 }],
        };
      else if (url.pathname === "/api/appointments") {
        data = { error: "This slot was just booked. Choose another." };
        status = 409;
      } else if (url.pathname === "/api/public/checkin") {
        await r.abort("failed");
        return;
      } else if (url.pathname === "/api/tv/data")
        data = {
          shop,
          activeOrders: [
            {
              ...order,
              status: "REPAIRING",
              createdAt: order.receivedAt,
              slaDeadline: null,
              faultLevel: "LOW",
              assignedTo: null,
            },
          ],
          readyOrders: [{ ...order, updatedAt: order.doneAt }],
          totalActive: 1,
          totalReady: 1,
          stats: { receivedToday: 1, completedToday: 1, revenueToday: 100 },
          appointments: [],
          engineerWorkload: [],
          lowStock: [],
          activityLogs: [],
          generatedAt: new Date().toISOString(),
        };
      else data = [];
      await r.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    });
    const p = await context.newPage();
    let errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    for (const url of [
      "/directory",
      "/directory/audit-shop",
      "/book/audit-shop",
      "/checkin/audit-shop",
      "/widget/audit-shop",
      "/track/audit-reference",
      "/tv?token=audit-fixture",
    ]) {
      errors = [];
      await p.goto("http://localhost:3100" + url, {
        waitUntil: "networkidle",
        timeout: 90000,
      });
      const overflow = await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      output.push({ width, path: url, overflow, errors: [...errors] });
      fs.writeFileSync(
        ".audit/audit-fixture-results.json",
        JSON.stringify(output, null, 2),
      );
      if (width === 390)
        await p.screenshot({
          path: ".audit/mobile-" + url.split("/")[1].split("?")[0] + ".png",
          animations: "disabled",
        });
      if (url.startsWith("/tv")) {
        const boxes = await p
          .locator(".tv-column")
          .evaluateAll((nodes) =>
            nodes.map((n) => ({
              x: n.getBoundingClientRect().x,
              y: n.getBoundingClientRect().y,
              width: n.getBoundingClientRect().width,
            })),
          );
        assert.equal(boxes.length, 3);
        assert.ok(
          boxes[1].y > boxes[0].y && boxes[2].y > boxes[1].y,
          "Mobile TV columns must stack",
        );
        assert.ok(
          boxes.every((box) => box.width <= width),
          "TV columns fit viewport",
        );
      }
      if (url.startsWith("/track/")) {
        await p
          .getByRole("textbox", { name: "Message to the shop" })
          .fill("Can I collect it today?");
        await p.getByRole("button", { name: "Send message" }).click();
        await p.getByText("Message not sent. Please try again.").waitFor();
        assert.equal(
          await p
            .getByRole("textbox", { name: "Message to the shop" })
            .inputValue(),
          "Can I collect it today?",
        );
      }
      if (url.startsWith("/checkin/")) {
        await p.getByPlaceholder("Your name").fill("Sample");
        await p.getByPlaceholder("+212 6xx xxx xxx").fill("123456789");
        await p.getByRole("button", { name: "Check In ✓" }).click();
        await p
          .getByText("Unable to check in right now. Please try again.")
          .waitFor();
        assert.equal(
          await p.getByRole("button", { name: "Check In ✓" }).isEnabled(),
          true,
        );
      }
      if (url.startsWith("/book/")) {
        await p
          .getByRole("button")
          .filter({ hasText: /^\d{1,2}$/ })
          .first()
          .click();
        await p.getByRole("button", { name: /10:00/ }).click();
        await p.getByPlaceholder("Your name").fill("Sample");
        await p.getByPlaceholder("+212 6xx xxx xxx").fill("123456789");
        await p.getByPlaceholder("Apple, Samsung…").fill("Apple");
        await p.getByPlaceholder("iPhone 15…").fill("iPhone 14");
        await p.locator("textarea").fill("Screen broken");
        await p.locator("button[type=submit]").click();
        await p
          .getByText("This slot was just booked. Choose another.")
          .waitFor();
        assert.equal(await p.locator("button[type=submit]").isEnabled(), true);
      }
    }
    if (width === 390) {
      for (const [status, message] of [
        ["RECEIVED", "We've received your device"],
        ["DIAGNOSING", "Our technician is diagnosing"],
        ["REPAIRING", "Your device is currently being repaired"],
        ["DONE", "Your device is ready"],
        ["DELIVERED", "Your device has been delivered"],
        ["CANCELLED", "This repair order has been cancelled"],
      ]) {
        order.status = status;
        await p.goto("http://localhost:3100/track/audit-reference", {
          waitUntil: "networkidle",
        });
        assert.ok(
          (await p.locator("body").innerText()).includes(message),
          status,
        );
      }
      order.status = "DONE";
    }
    await context.close();
  }
  fs.writeFileSync(
    ".audit/audit-fixture-results.json",
    JSON.stringify(output, null, 2),
  );
  console.log(JSON.stringify(output, null, 2));
  await b.close();
  if (output.some((r) => r.overflow || r.errors.length))
    throw Error("Mobile fixture verification failed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
