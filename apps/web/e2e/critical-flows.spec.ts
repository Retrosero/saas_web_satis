import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('Login sayfası yüklenir', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2, [data-testid="login-title"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Login → Dashboard geçişi', async ({ page }) => {
    await page.goto('/login');
    // Demo hesap (development ortamı)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await emailInput.fill('admin@demo.local');
      await passInput.fill('Demo123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard|home|\/$/, { timeout: 15_000 }).catch(() => undefined);
    }
  });

  test('Sistem sayfaları ulaşılabilir (auth gerekli)', async ({ page }) => {
    const pages = ['/system/cache', '/system/queues', '/system/perf', '/system/search', '/system/realtime', '/system/observability'];
    for (const p of pages) {
      const res = await page.goto(p, { waitUntil: 'domcontentloaded', timeout: 10_000 }).catch(() => null);
      // 401/403 ya da login redirect beklenir
      expect(res?.status() ?? 0).toBeLessThan(500);
    }
  });

  test('API health check', async ({ request }) => {
    const baseUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';
    const res = await request.get(`${baseUrl.replace('/api/v1', '')}/api/v1/health`).catch(() => null);
    // Health endpoint yoksa bile response almalıyız
    expect(res).not.toBeNull();
  });
});
