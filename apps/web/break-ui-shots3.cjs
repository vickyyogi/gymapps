// Dev-only verification: overflow + console errors + screenshots after fixes.
const { chromium } = require("playwright-core");
const path = require("path");

const OUT = path.join(__dirname, "shots");
const BASE = "http://localhost:3000";
const STATES = ["demo", "worst", "empty", "one", "huge"];
const WIDTHS = [320, 1280];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 1600 } });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 240));
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 240)));

  for (const data of STATES) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width === 320 ? 1600 : 1000 });
      await page.goto(`${BASE}/en/dev/break-ui?data=${data}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      console.log(`${data}@${width} overflow=${overflow}`);
      await page.screenshot({ path: path.join(OUT, `v3-${data}-${width}.png`), fullPage: true });
    }
  }

  for (const dark of [true]) {
    await page.setViewportSize({ width: 320, height: 1600 });
    await page.goto(`${BASE}/en/dev/break-ui?data=worst&dark=1`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    console.log(`worst-dark@320 overflow=${overflow}`);
    await page.screenshot({ path: path.join(OUT, "v3-worst-dark-320.png"), fullPage: true });
  }

  console.log("console errors:", errors.length);
  for (const e of errors.slice(0, 12)) console.log(" -", e);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
