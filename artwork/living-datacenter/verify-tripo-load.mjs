import { chromium } from "playwright";
const base = process.argv[2] || "http://127.0.0.1:3100";


const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const glbReq = { got: 0, ok: false };
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
page.on("request", (r) => { if (r.url().includes("server_rack_v03")) glbReq.got++; });
page.on("response", (r) => { if (r.url().includes("server_rack_v03")) glbReq.ok = r.ok(); });
await page.goto(base, { waitUntil: "domcontentloaded" });
try {
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 30000 });
} catch { console.log("canvas never mounted"); }
// S1 = hero, scroll small to ensure boot scene active
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(4000);
const alive = await page.evaluate(() => !!document.querySelector('[data-testid="datacenter-canvas"]'));
await page.screenshot({ path: "refcheck/tripo-v03-s1.png" });
console.log("canvas alive:", alive);
console.log("GLB requests:", glbReq.got, "| ok:", glbReq.ok);
console.log("console errors:", errors.length);
errors.slice(0, 8).forEach((e) => console.log("  -", e));
await browser.close();
