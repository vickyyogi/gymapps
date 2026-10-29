const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 1600 } });
  for (const data of ["worst", "one", "huge"]) {
    await page.goto(`http://localhost:3000/en/dev/break-ui?data=${data}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const offenders = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return [...document.querySelectorAll("body *")]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), cls: el.className?.toString().slice(0, 60), right: Math.round(r.right), w: Math.round(r.width), text: (el.textContent || "").trim().slice(0, 50) };
        })
        .filter((x) => x.right > w + 1)
        .slice(0, 15);
    });
    console.log("==", data, "clientWidth=320");
    for (const o of offenders) console.log(JSON.stringify(o));
  }
  await browser.close();
})();
