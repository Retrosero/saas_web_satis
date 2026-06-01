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
    { name: 'settings-overview', url: 'http://localhost:5173/settings' },
    { name: 'settings-subscription', url: 'http://localhost:5173/settings/subscription' },
    { name: 'settings-modules', url: 'http://localhost:5173/settings/modules' },
    { name: 'settings-users', url: 'http://localhost:5173/settings/users' },
    { name: 'settings-roles', url: 'http://localhost:5173/settings/roles' },
  ];

  for (const t of targets) {
    console.log(`-> ${t.name}: ${t.url}`);
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 15000 }).catch((e) => console.log('  goto warn:', e.message));
    await page.waitForTimeout(2500);
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
