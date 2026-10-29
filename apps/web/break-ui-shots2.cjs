// Dev-only screenshot driver (round 2): taller viewport so the fixed toggle
// does not cover the metric row in full-page shots.
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "shots");
const BASE = process.env.BREAK_UI_BASE || "http://localhost:3000";

const SHOTS = [
  { name: "v2-worst-320", data: "worst", width: 320, height: 1600 },
  { name: "v2-worst-160-zoom200", data: "worst", width: 160, height: 1400 },
  { name: "v2-empty-320", data: "empty", width: 320, height: 1600 },
  { name: "v2-one-320", data: "one", width: 320, height: 1600 },
  { name: "v2-huge-320", data: "huge", width: 320, height: 1600 },
  { name: "v2-empty-1280", data: "empty", width: 1280, height: 900 }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 1600 } });
  page.on("console", (m) => {
    if (m.type() === "error") console.log("[console]", m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

  for (const shot of SHOTS) {
    await page.setViewportSize({ width: shot.width, height: shot.height });
    const url = `${BASE}/en/dev/break-ui?data=${shot.data}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const file = path.join(OUT, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    console.log("saved", file, "horizontalOverflowPx=", overflow);
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
