import { chromium } from "playwright";
import { writeFileSync } from "fs";

const CHROME_PROFILE = "C:\\Users\\nlaas\\AppData\\Local\\Google\\Chrome\\User Data";

(async () => {
  const browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    headless: false,
    channel: "chrome",
    args: ["--no-first-run", "--no-default-browser-check"],
    viewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  // Navigate to the fixflow project deployments page
  await page.goto("https://vercel.com/dashboard", { waitUntil: "networkidle", timeout: 30000 });

  // Take screenshot to see current state
  await page.screenshot({ path: "scripts/vercel-01-dashboard.png", fullPage: false });
  console.log("Screenshot 1: dashboard");

  // Look for fixflow project
  const projectLink = page.locator('a[href*="fixflow"]').first();
  if (await projectLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await projectLink.click();
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "scripts/vercel-02-project.png" });
    console.log("Screenshot 2: project page — URL:", page.url());
  } else {
    console.log("Project link not found, trying direct URL");
    await page.goto("https://vercel.com/nlaas/fixflow", { waitUntil: "networkidle", timeout: 20000 });
    await page.screenshot({ path: "scripts/vercel-02-project.png" });
  }

  // Find latest deployment link
  await page.waitForTimeout(2000);
  const deployLink = page.locator('a[href*="/deployments/"]').first();
  if (await deployLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await deployLink.click();
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "scripts/vercel-03-deployment.png" });
    console.log("Screenshot 3: deployment — URL:", page.url());
  }

  // Look for build logs section
  await page.waitForTimeout(2000);
  const buildLogBtn = page.locator('text=Building, text=Build Logs, button:has-text("Logs")').first();
  if (await buildLogBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await buildLogBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: "scripts/vercel-04-logs.png", fullPage: true });
  console.log("Screenshot 4: logs page");

  // Grab all text from the page
  const pageText = await page.locator("body").innerText();
  writeFileSync("scripts/vercel-page-text.txt", pageText);
  console.log("Page text saved to scripts/vercel-page-text.txt");

  await browser.close();
})();
