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
    { name: 'sa-logs-audit', url: 'http://localhost:5173/super-admin/logs' },
    { name: 'sa-logs-error', url: 'http://localhost:5173/super-admin/logs' },
    { name: 'sa-logs-security', url: 'http://localhost:5173/super-admin/logs' },
    { name: 'settings-logs-audit', url: 'http://localhost:5173/settings/logs' },
    { name: 'settings-logs-security', url: 'http://localhost:5173/settings/logs' },
  ];

  for (const t of targets) {
    console.log(`-> ${t.name}: ${t.url}`);
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 15000 }).catch((e) => console.log('  goto warn:', e.message));
    await page.waitForTimeout(2500);
    // tab geçişleri için buton tıklamaları
    if (t.name === 'sa-logs-error') {
      const btn = await page.$('button:has-text("Hatalar")');
      if (btn) await btn.click();
      await page.waitForTimeout(1500);
    } else if (t.name === 'sa-logs-security') {
      const btn = await page.$('button:has-text("Güvenlik")');
      if (btn) await btn.click();
      await page.waitForTimeout(1500);
    } else if (t.name === 'settings-logs-security') {
      const btn = await page.$('button:has-text("Güvenlik")');
      if (btn) await btn.click();
      await page.waitForTimeout(1500);
    }
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
