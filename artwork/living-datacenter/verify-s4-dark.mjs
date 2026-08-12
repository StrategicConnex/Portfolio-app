import { chromium } from "playwright";
const base = "http://127.0.0.1:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 100)); });
await page.goto(base, { waitUntil: "domcontentloaded" });
try { await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 30000 }); } catch {}
await page.evaluate(() => { const el = document.querySelector('#audithub') || document.querySelector('#scaudit'); if (el) el.scrollIntoView(); });
await page.waitForTimeout(6000);
await page.screenshot({ path: "artwork/living-datacenter/refcheck/s4-dark-v2.png" });
console.log("errors 3D:", errs.filter(e => !e.includes("scaudit")).length);
await browser.close();
