import { chromium } from "playwright";

const BASE = "https://fixflow-ruddy.vercel.app";

const pages = [
  { name: "01-landing", url: "/" },
  { name: "02-login", url: "/login" },
  { name: "03-register", url: "/register" },
  { name: "04-customer-app", url: "/customer-app" },
  { name: "05-customer-repairs", url: "/customer-app/my-repairs" },
  { name: "06-directory", url: "/directory" },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const p of pages) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", r => { if (r.status() >= 500) errors.push(`HTTP ${r.status()} on ${r.url()}`); });

    try {
      await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `scripts/${p.name}.png`, fullPage: false });
      const title = await page.title();
      console.log(`✓ ${p.name} — "${title}" ${errors.length ? "⚠ ERRORS: " + errors.join("; ") : ""}`);
    } catch (e) {
      console.log(`✗ ${p.name} — FAILED: ${e.message}`);
    }
    await page.close();
  }

  await browser.close();
})();
