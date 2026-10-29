// Dev-only screenshot driver for the break-ui harness. Uses the system Edge
// (playwright-core has no bundled browsers here).
const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "shots");
const BASE = process.env.BREAK_UI_BASE || "http://localhost:3000";

const SHOTS = [
  { name: "login+dash-demo-320", data: "demo", width: 320 },
  { name: "login+dash-worst-320", data: "worst", width: 320 },
  { name: "login+dash-worst-640", data: "worst", width: 640 },
  { name: "login+dash-worst-1280", data: "worst", width: 1280 },
  { name: "login+dash-demo-1280", data: "demo", width: 1280 },
  { name: "login+dash-empty-320", data: "empty", width: 320 },
  { name: "login+dash-one-320", data: "one", width: 320 },
  { name: "login+dash-huge-320", data: "huge", width: 320 },
  { name: "login+dash-worst-dark-320", data: "worst", width: 320, dark: true },
  { name: "login+dash-worst-dark-1280", data: "worst", width: 1280, dark: true }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
  page.on("console", (m) => {
    if (m.type() === "error") console.log("[console]", m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

  for (const shot of SHOTS) {
    await page.setViewportSize({ width: shot.width, height: 900 });
    const url = `${BASE}/en/dev/break-ui?data=${shot.data}${shot.dark ? "&dark=1" : ""}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const file = path.join(OUT, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("saved", file);
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
