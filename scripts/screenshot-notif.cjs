const { chromium } = require('/usr/local/lib/node_modules/playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const targets = [
    { name: 'notif-page', url: 'http://localhost:5173/notifications' },
    { name: 'notif-unread', url: 'http://localhost:5173/notifications' },
  ];

  for (const t of targets) {
    console.log(`-> ${t.name}: ${t.url}`);
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 15000 }).catch((e) => console.log('  goto warn:', e.message));
    await page.waitForTimeout(3000);
    const out = path.resolve('/workspace/screenshots', `${t.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  saved: ${out}`);
  }

  // Topbar dropdown screenshot — login sayfasında bildirim yok ama topbar'ı görelim
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(2000);
  // Bildirim dropdown'ı aç
  const bell = await page.$('[aria-label="Bildirimler"]');
  if (bell) {
    await bell.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/workspace/screenshots/notif-dropdown.png' });
    console.log('  saved: /workspace/screenshots/notif-dropdown.png');
  } else {
    console.log('  bell not found, skipping dropdown');
  }

  await browser.close();
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
