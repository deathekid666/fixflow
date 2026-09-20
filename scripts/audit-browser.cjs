const fs = require("fs");
fs.mkdirSync(".audit", { recursive: true });
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const results = [];
  for (const width of [320, 390, 768, 1440]) {
    const p = await b.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:3100", {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    await p
      .getByRole("heading", { name: "Great repairs. Without the chaos." })
      .waitFor();
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    await p.getByText("What is FixFlow?", { exact: true }).click();
    const faq =
      (await p.locator("details").first().getAttribute("open")) !== null;
    const group =
      width < 700
        ? p.locator(".ff-preview-tabs")
        : p.locator(".ff-app-sidebar");
    await group.getByRole("button", { name: "Updates", exact: true }).click();
    await p
      .getByRole("heading", { name: "Your device is ready for pickup." })
      .waitFor();
    await group.getByRole("button", { name: "Repairs", exact: true }).click();
    if (width < 700) {
      await p.getByRole("button", { name: "Open menu" }).click();
      await p
        .locator("#mobile-navigation")
        .getByRole("link", { name: "Pricing", exact: true })
        .click();
      if (await p.locator("#mobile-navigation").count())
        throw Error("Menu did not close");
    }
    await p.evaluate(() => scrollTo(0, 0));
    await p.screenshot({
      path: `.audit/landing-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    results.push({ width, overflow, faq, errors });
    await p.close();
  }
  fs.writeFileSync(
    ".audit/audit-landing-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
  await b.close();
  if (results.some((r) => r.overflow || r.errors.length || !r.faq))
    throw Error("Landing verification failed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
