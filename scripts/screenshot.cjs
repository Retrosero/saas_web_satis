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
    { name: 'login', url: 'http://localhost:5173/login' },
    { name: 'dashboard', url: 'http://localhost:5173/dashboard' },
    { name: 'tenants', url: 'http://localhost:5173/super-admin/tenants' },
    { name: 'mobile-login', url: 'http://localhost:5173/login', mobile: true },
  ];

  for (const t of targets) {
    if (t.mobile) {
      await page.setViewportSize({ width: 390, height: 844 });
    } else {
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    console.log(`-> ${t.name}: ${t.url}`);
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 15000 }).catch((e) => console.log('  goto warn:', e.message));
    await page.waitForTimeout(2000); // animations, fonts
    const out = path.resolve('/workspace/screenshots', `${t.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  saved: ${out}`);
  }

  await browser.close();
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
