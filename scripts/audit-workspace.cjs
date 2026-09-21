// Local production preview only. Every API response is intercepted sample data.
// No real shop records, subscriptions, messages, or provider calls are touched.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const jwt = require("jsonwebtoken");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());
const base = "http://localhost:3100";
const shop = { id: "workspace-audit-shop", name: "Sample Workshop", onboardingComplete: true, currency: "MAD", certification: "GOLD", status: "ACTIVE", plan: "PRO", trialEndsAt: null };
const admin = { id: "workspace-audit-user", name: "Sample Owner", email: "sample@example.test", role: "ADMIN", shopId: shop.id, shopStatus: "ACTIVE", isSuperAdmin: false, shop };
const optionalRoutes = ["academy", "certification", "branches", "contracts", "engineers/commissions", "pos", "shifts"].map(path => `/dashboard/${path}`);

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const width of [320, 390, 1440]) {
      let identity = admin;
      const errors = [], aiCalls = [];
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", serviceWorkers: "block" });
      await context.addCookies([{ name: "token", value: jwt.sign({ id: admin.id, role: admin.role, shopId: shop.id, shopStatus: "ACTIVE" }, process.env.JWT_SECRET, { expiresIn: "1h" }), url: base }]);
      await context.addInitScript(() => {
        if (!localStorage.getItem("lang")) localStorage.setItem("lang", "en");
        localStorage.setItem("fixflow_tour_v1_workspace-audit-user", "1");
        localStorage.setItem("fixflow_tour_v1_workspace-audit-other", "1");
      });
      await context.route("**/api/**", async route => {
        const url = new URL(route.request().url());
        let data = [];
        if (url.pathname === "/api/me") data = identity;
        else if (url.pathname === "/api/me/shop-status") data = { suspended: false, trialExpired: false };
        else if (url.pathname === `/api/shops/${shop.id}`) data = shop;
        else if (url.pathname.endsWith("/settings")) data = {};
        else if (url.pathname === "/api/billing") data = { currentPlan: "PRO", status: "ACTIVE", stripeEnabled: false };
        else if (url.pathname.includes("/unread")) data = { count: 0, unreadMessages: 0, pendingAppts: 0, lowStockCount: 0 };
        else if (url.pathname === "/api/workorders/stats") data = { total: 0, received: 0, diagnosing: 0, repairing: 0, done: 0, delivered: 0, cancelled: 0, revenue: 0, collected: 0 };
        else if (url.pathname.startsWith("/api/ai/")) {
          aiCalls.push(url.pathname);
          data = { briefing: "Sample briefing for workspace visibility verification." };
        } else if (url.pathname === "/api/push/vapid-key") data = { publicKey: null };
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
      });
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      async function ready(path) {
        await page.goto(base + path);
        await page.getByRole("navigation", { name: "Workspace navigation" }).waitFor();
        await page.waitForTimeout(250);
      }
      async function fits() {
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `overflow at ${width}px on ${page.url()}`);
      }
      const nav = page.getByRole("navigation", { name: "Workspace navigation" });
      await ready("/dashboard");
      assert.deepEqual(await nav.locator("a").evaluateAll(links => links.map(link => link.getAttribute("href"))), ["/dashboard", "/dashboard/customers", "/dashboard/spareparts", "/dashboard/appointments", "/dashboard/reports", "/dashboard/settings"]);
      assert.equal(aiCalls.length, 0, "hidden briefing must not call AI");
      await fits();
      if (width === 1440) await page.screenshot({ path: ".audit/workspace-dashboard.png", fullPage: true });

      await ready("/dashboard/settings#workspace");
      await page.getByRole("heading", { name: "Optional tools" }).waitFor();
      assert.equal(await page.locator("#workspace-settings input:checked").count(), 0);
      await fits();
      await page.screenshot({ path: `.audit/workspace-settings-${width}.png`, fullPage: true });
      await page.getByRole("button", { name: "Show all optional tools", exact: true }).click();
      assert.equal(await page.locator("#workspace-settings input:checked").count(), 9);
      for (const href of optionalRoutes) assert.equal(await nav.locator(`a[href="${href}"]`).count(), 1, href);
      await page.reload();
      await page.getByRole("heading", { name: "Optional tools" }).waitFor();
      assert.equal(await page.locator("#workspace-settings input:checked").count(), 9, "restoration persists after reload");
      await ready("/dashboard");
      await page.getByText("Sample briefing for workspace visibility verification.", { exact: true }).waitFor();
      assert.equal(aiCalls.length, 1);

      await ready("/dashboard/settings#workspace");
      await page.getByRole("button", { name: "Use simple workspace", exact: true }).click();
      assert.equal(await page.locator("#workspace-settings input:checked").count(), 0);
      for (const href of optionalRoutes) assert.equal(await nav.locator(`a[href="${href}"]`).count(), 0);
      await ready("/dashboard");
      assert.equal(aiCalls.length, 1, "reset disables background AI again");
      await page.keyboard.press("Control+k");
      await page.getByPlaceholder("Search pages, work orders, customers...").fill("Academy");
      await page.getByText("No results for", { exact: false }).waitFor();
      await page.keyboard.press("Escape");
      await ready("/dashboard/academy");
      assert.ok(page.url().endsWith("/dashboard/academy"), "old direct URLs remain available");

      await ready("/dashboard/settings#workspace");
      await page.getByRole("button", { name: "Show all optional tools", exact: true }).click();
      identity = { ...admin, id: "workspace-audit-other", role: "ENGINEER" };
      await page.reload();
      await page.getByRole("heading", { name: "Optional tools" }).waitFor();
      assert.equal(await page.locator("#workspace-settings input:checked").count(), 0, "preferences isolated between accounts");
      assert.equal(await nav.locator('a[href="/dashboard/reports"]').count(), 0);
      await fits();
      if (width < 1024) {
        await page.getByRole("button", { name: "Open navigation" }).click();
        await page.screenshot({ path: `.audit/workspace-mobile-menu-${width}.png` });
      }
      if (width === 390) {
        for (const [language, label] of [["fr", "Réparations"], ["ar", "الإصلاحات"]]) {
          await page.evaluate(language => localStorage.setItem("lang", language), language);
          await page.reload();
          await nav.locator('a[href="/dashboard"]').filter({ hasText: label }).waitFor();
          await fits();
        }
      }
      assert.deepEqual(errors, [], "browser exceptions");
      results.push({ width, simplifiedNavigation: true, restoreAll: true, persisted: true, reset: true, noHiddenAIRequests: true, directLinksPreserved: true, accountIsolation: true, overflow: false, browserErrors: errors });
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    await context.route("**/api/**", route => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
    const page = await context.newPage();
    for (const path of ["/", "/pricing"]) {
      await page.goto(base + path);
      await page.waitForTimeout(300);
      assert.equal(await page.getByText("Enterprise", { exact: true }).count(), 0);
      assert.equal(await page.getByText("Starter", { exact: true }).count(), 0);
      assert.equal(await page.locator('a[href="/directory"]').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      results.push({ route: path, simplifiedPlans: true, directoryPromotionHidden: true });
    }
    await context.close();
    fs.writeFileSync(".audit/workspace-results.json", JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
