const { chromium } = require("playwright");
const fs = require("fs");
fs.mkdirSync(".audit", { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  let errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const result = [];
  const shopsRes = await p.request.get("http://localhost:3100/api/directory");
  const shops = await shopsRes.json();
  const shop = Array.isArray(shops) ? shops[0] : null;
  const paths = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/pricing",
    "/privacy",
    "/terms",
    "/directory",
    "/tv",
    "/offline",
    "/api-docs",
    "/customer-app",
    "/customer-app/my-repairs",
    "/shops",
    "/suspended",
    "/track",
    "/track/audit-invalid",
    "/print/audit-invalid",
    "/thermal/audit-invalid",
    "/verify/audit-invalid",
  ];
  if (shop)
    paths.push(
      "/directory/" + shop.id,
      "/book/" + shop.id,
      "/checkin/" + shop.id,
      "/widget/" + shop.id,
    );
  for (const url of paths) {
    errors = [];
    const response = await p.goto("http://localhost:3100" + url, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await p.screenshot({
      path: ".audit/audit-last-page.png",
      animations: "disabled",
    });
    result.push({
      path: url.replace(shop?.id || "__none__", "[shopId]"),
      status: response.status(),
      overflow: await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      pageErrors: [...errors],
      content: await p
        .locator("body")
        .innerText()
        .then((s) => s.replace(/\s+/g, " ").length),
    });
  }
  const protectedFiles = fs
    .readdirSync("src/app", { recursive: true })
    .filter(
      (f) =>
        f.endsWith("page.tsx") &&
        (f.startsWith("dashboard") || f.startsWith("admin")),
    );
  let redirects = 0;
  for (const f of protectedFiles) {
    const url =
      "/" +
      f
        .replaceAll("\\", "/")
        .replace("/page.tsx", "")
        .replace(/\[[^\]]+\]/g, "audit-invalid");
    const r = await p.request.get("http://localhost:3100" + url, {
      maxRedirects: 0,
    });
    if (r.status() === 307 && r.headers().location.includes("/login"))
      redirects++;
    else result.push({ path: url, unexpectedProtectedStatus: r.status() });
  }
  const apis = [];
  for (const url of [
    "/api/me",
    "/api/tv/data",
    "/api/track",
    "/api/appointments/slots?shopId=x&date=2026-02-31",
  ]) {
    const r = await p.request.get("http://localhost:3100" + url, {
      headers: { cookie: "token=expired.invalid.cookie" },
      maxRedirects: 0,
    });
    apis.push({
      path: url,
      status: r.status(),
      json: r.headers()["content-type"]?.includes("application/json"),
    });
  }
  fs.writeFileSync(
    ".audit/audit-public-results.json",
    JSON.stringify(
      {
        pages: result,
        protectedPages: protectedFiles.length,
        loginRedirects: redirects,
        apis,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        pages: result.length,
        failures: result.filter(
          (r) =>
            r.pageErrors?.length || r.overflow || r.unexpectedProtectedStatus,
        ),
        protectedPages: protectedFiles.length,
        loginRedirects: redirects,
        apis,
      },
      null,
      2,
    ),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
