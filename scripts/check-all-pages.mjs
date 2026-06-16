import { chromium } from "playwright";
import { writeFileSync } from "fs";

const BASE = "https://fixflow-ruddy.vercel.app";
const EMAIL = "nlaassali1@gmail.com";
const PASSWORD = process.env.TEST_PASSWORD || "admin123";

const publicPages = [
  { name: "landing", url: "/" },
  { name: "login", url: "/login" },
  { name: "register", url: "/register" },
  { name: "customer-app", url: "/customer-app" },
  { name: "customer-repairs", url: "/customer-app/my-repairs" },
  { name: "directory", url: "/directory" },
  { name: "forgot-password", url: "/forgot-password" },
];

const authPages = [
  { name: "dashboard-home", url: "/dashboard" },
  { name: "dashboard-workorders-new", url: "/dashboard/workorders/new" },
  { name: "dashboard-spareparts", url: "/dashboard/spareparts" },
  { name: "dashboard-customers", url: "/dashboard/customers" },
  { name: "dashboard-analytics", url: "/dashboard/analytics" },
  { name: "dashboard-engineers", url: "/dashboard/engineers" },
  { name: "dashboard-settings", url: "/dashboard/settings" },
  { name: "dashboard-academy", url: "/dashboard/academy" },
  { name: "dashboard-appointments", url: "/dashboard/appointments" },
  { name: "dashboard-expenses", url: "/dashboard/expenses" },
  { name: "dashboard-reports", url: "/dashboard/reports" },
  { name: "dashboard-warranties", url: "/dashboard/warranties" },
  { name: "dashboard-messages", url: "/dashboard/messages" },
  { name: "dashboard-suppliers", url: "/dashboard/suppliers" },
  { name: "dashboard-templates", url: "/dashboard/templates" },
  { name: "dashboard-certification", url: "/dashboard/certification" },
];

const results = [];

function fmt(name, status, errors, url) {
  const icon = status === "ok" ? "✓" : "✗";
  const errStr = errors.length ? ` ⚠ ${errors.slice(0, 2).join(" | ")}` : "";
  return `${icon} ${name.padEnd(30)} ${status.toUpperCase().padEnd(8)} ${url}${errStr}`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── Public pages ──────────────────────────────────────────
  console.log("\n── Public pages ──────────────────────────────────────");
  const pubCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const p of publicPages) {
    const page = await pubCtx.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(`JS: ${e.message.slice(0, 80)}`));
    page.on("response", r => { if (r.status() >= 500) errors.push(`HTTP ${r.status()}`); });
    try {
      const res = await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `scripts/page-${p.name}.png` });
      const status = res?.status() >= 400 ? "error" : "ok";
      const line = fmt(p.name, status, errors, p.url);
      console.log(line);
      results.push(line);
    } catch (e) {
      const line = fmt(p.name, "fail", [`${e.message.slice(0, 80)}`], p.url);
      console.log(line);
      results.push(line);
    }
    await page.close();
  }
  await pubCtx.close();

  // ── Authenticated pages ───────────────────────────────────
  console.log("\n── Authenticated pages (logging in first) ────────────");
  const authCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const loginPage = await authCtx.newPage();

  // Log in via API to get cookie, then inject into context
  try {
    const apiRes = await loginPage.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
      headers: { "Content-Type": "application/json" },
    });
    if (!apiRes.ok()) throw new Error(`API login returned ${apiRes.status()}`);
    const setCookie = apiRes.headers()["set-cookie"];
    if (!setCookie) throw new Error("No set-cookie header in login response");
    // Parse token from set-cookie and add to context
    const tokenMatch = setCookie.match(/token=([^;]+)/);
    if (!tokenMatch) throw new Error("Could not parse token from set-cookie");
    await authCtx.addCookies([{
      name: "token",
      value: tokenMatch[1],
      domain: "fixflow-ruddy.vercel.app",
      path: "/",
      httpOnly: true,
      secure: true,
    }]);
    console.log(`✓ Login successful (API)`);
  } catch (e) {
    console.log(`✗ Login failed: ${e.message.slice(0, 100)}`);
    await browser.close();
    return;
  }
  await loginPage.close();

  for (const p of authPages) {
    const page = await authCtx.newPage();
    const errors = [];
    page.on("pageerror", e => {
      // Ignore known non-critical errors
      const msg = e.message;
      if (msg.includes("ResizeObserver") || msg.includes("Non-Error promise")) return;
      errors.push(`JS: ${msg.slice(0, 80)}`);
    });
    page.on("response", r => { if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url().split("?")[0].split("/").slice(-2).join("/")}`); });
    try {
      const res = await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(1500);
      const finalUrl = page.url();
      // Redirected to login = not authed
      if (finalUrl.includes("/login")) {
        const line = fmt(p.name, "unauth", [], p.url);
        console.log(line);
        results.push(line);
      } else {
        await page.screenshot({ path: `scripts/page-${p.name}.png` });
        const status = res?.status() >= 400 ? "error" : "ok";
        const line = fmt(p.name, status, errors, finalUrl);
        console.log(line);
        results.push(line);
      }
    } catch (e) {
      const line = fmt(p.name, "fail", [e.message.slice(0, 80)], p.url);
      console.log(line);
      results.push(line);
    }
    await page.close();
  }

  await authCtx.close();
  await browser.close();

  writeFileSync("scripts/check-results.txt", results.join("\n"));
  console.log("\n── Done. Screenshots in scripts/ ─────────────────────");
})();
