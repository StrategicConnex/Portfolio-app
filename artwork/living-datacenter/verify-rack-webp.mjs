import { chromium } from "playwright";
const base = "http://127.0.0.1:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const ev = [];
page.on("request", (r) => { const u = r.url(); if (u.includes("server_rack_v03")) ev.push("REQ " + r.method() + " " + u.split("/").pop()); });
page.on("response", (r) => { const u = r.url(); if (u.includes("server_rack_v03")) ev.push("  -> " + r.status() + " " + u.split("/").pop()); });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 110)); });
page.on("pageerror", (e) => errs.push("PAGEERROR " + String(e).slice(0, 110)));
await page.goto(base, { waitUntil: "domcontentloaded" });
try { await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 30000 }); } catch {}
// S1 = hero, sin scroll (top of page)
await page.waitForTimeout(6000);
console.log("canvas:", await page.evaluate(() => !!document.querySelector('[data-testid="datacenter-canvas"]')));
console.log("=== server_rack_v03 events ===");
ev.forEach((e) => console.log(" ", e));
console.log("=== console errors ===");
[...new Set(errs)].slice(0, 6).forEach((e) => console.log("  -", e));
await page.screenshot({ path: "artwork/living-datacenter/refcheck/rack-webp-s1.png" });
await browser.close();
