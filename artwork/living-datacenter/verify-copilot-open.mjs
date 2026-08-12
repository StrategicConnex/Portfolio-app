import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("scaudit")) errs.push(m.text().slice(0, 90)); });
await page.goto("http://127.0.0.1:3100", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const btn = page.locator('button[aria-label="Ask AI"]');
console.log("launcher visible:", await btn.isVisible());
await btn.click();
await page.waitForTimeout(800);
const panel = page.locator('div:has-text("Copiloto de Ciberseguridad")').last();
const box = await panel.boundingBox();
const pos = await panel.evaluate((el) => getComputedStyle(el).position);
console.log("panel abierto:", await panel.isVisible(), "| position:", pos, "| rect:", box ? `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}` : "n/a", "| en viewport:", box ? box.y >= 0 && box.y + box.height <= 900 && box.x >= 0 : false);
// cerrar
const closeBtn = page.locator('button[aria-label="Cerrar"], button[aria-label="Close"]').first();
if (await closeBtn.count()) { await closeBtn.click(); await page.waitForTimeout(600); }
console.log("launcher de vuelta tras cerrar:", await page.locator('button[aria-label="Ask AI"]').isVisible());
console.log("errores consola (no-telemetry):", errs.slice(0, 4));
await browser.close();
