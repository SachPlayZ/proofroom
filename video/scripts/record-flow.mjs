import { mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const url = process.env.PROOFROOM_URL ?? 'http://127.0.0.1:4174/';
const width = 1920;
const height = 1080;
const outputPath = resolve(process.cwd(), 'public/proofroom-flow.webm');
const tempDir = resolve(process.cwd(), 'public/.recording');

mkdirSync(dirname(outputPath), { recursive: true });
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  recordVideo: { dir: tempDir, size: { width, height } },
});
const page = await context.newPage();

await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  const style = document.createElement('style');
  style.textContent = `
    #proofroom-demo-cursor { position: fixed; z-index: 99999; width: 19px; height: 19px; border: 2px solid #fff; border-radius: 50%; background: #2852d7; box-shadow: 0 2px 0 rgba(0,0,0,.25), 0 0 0 4px rgba(40,82,215,.2); pointer-events: none; translate: -50% -50%; transition: left .42s cubic-bezier(.16,1,.3,1), top .42s cubic-bezier(.16,1,.3,1), scale .12s ease; }
    #proofroom-demo-cursor.is-down { scale: .72; }
    .proofroom-click-ripple { position: fixed; z-index: 99998; width: 26px; height: 26px; border: 2px solid #2852d7; border-radius: 50%; translate: -50% -50%; pointer-events: none; animation: proofroom-ripple .48s ease-out forwards; }
    @keyframes proofroom-ripple { from { opacity: .75; scale: .7; } to { opacity: 0; scale: 2.2; } }
  `;
  document.head.appendChild(style);
  const cursor = document.createElement('div');
  cursor.id = 'proofroom-demo-cursor';
  cursor.style.left = '1200px';
  cursor.style.top = '780px';
  document.body.appendChild(cursor);
  window.__proofroomMoveCursor = (x, y) => {
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
  };
  window.__proofroomClick = (x, y) => {
    cursor.classList.add('is-down');
    setTimeout(() => cursor.classList.remove('is-down'), 130);
    const ripple = document.createElement('div');
    ripple.className = 'proofroom-click-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };
});

const wait = (ms) => page.waitForTimeout(ms);
const moveTo = async (locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Could not locate interaction target: ${await locator.innerText().catch(() => 'unknown')}`);
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(({ x: nextX, y: nextY }) => window.__proofroomMoveCursor(nextX, nextY), { x, y });
  await page.mouse.move(x, y);
  await wait(500);
  return { x, y };
};
const click = async (locator) => {
  const point = await moveTo(locator);
  await page.evaluate(({ x, y }) => window.__proofroomClick(x, y), point);
  await locator.click();
  await wait(120);
};

const sellerProof = page.getByRole('button', { name: 'Prove seller fit' });
const buyerTab = page.getByRole('button', { name: 'Buyer', exact: true });
const sellerTab = page.getByRole('button', { name: 'Seller', exact: true });
const verifierTab = page.getByRole('button', { name: 'Public verifier', exact: true });

await wait(2600);
await moveTo(sellerProof);
await wait(900);
await click(sellerProof);
await wait(3900);

await click(buyerTab);
await wait(1500);
await moveTo(page.locator('.criteria-card'));
await wait(2100);
const fundsButton = page.getByRole('button', { name: 'Prove funds threshold' });
await click(fundsButton);
await wait(3900);

await click(sellerTab);
await wait(1700);
const grantButton = page.getByRole('button', { name: 'Grant access' });
await moveTo(grantButton);
await wait(1600);
await click(grantButton);
await wait(3300);

await click(buyerTab);
await wait(1800);
const unlockButton = page.getByRole('button', { name: 'Unlock locally' });
await moveTo(unlockButton);
await wait(1300);
await click(unlockButton);
await wait(4600);
await moveTo(page.locator('.dossier-card'));
await wait(1900);

await click(verifierTab);
await wait(3800);
const copyButton = page.getByRole('button', { name: 'Copy public receipt' });
await click(copyButton);
await wait(2600);

await page.evaluate(() => document.querySelector('.main-content')?.scrollTo({ top: 850, behavior: 'smooth' }));
await wait(4800);
await moveTo(page.locator('.activity-table'));
await wait(3500);
await page.evaluate(() => document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' }));
await wait(2800);
await moveTo(verifierTab);
await wait(1600);

await context.close();
await browser.close();
const videoPath = await page.video().path();
copyFileSync(videoPath, outputPath);
rmSync(tempDir, { recursive: true, force: true });
console.log(`Recorded real ProofRoom flow to ${outputPath}`);
