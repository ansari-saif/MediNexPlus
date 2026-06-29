import { chromium } from 'playwright';

(async () => {
  const base = process.env.BASE_URL || 'http://151.243.146.218:3000';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  console.log('1. Superadmin login page...');
  await page.goto(`${base}/superadmin/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="mail" i]', 'admin@medinex.com');
  const pwInputs = page.locator('input[type="password"]');
  await pwInputs.nth(0).fill('Medinex@123');
  await pwInputs.nth(1).fill('medinex-dev-key-2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/superadmin/dashboard**', { timeout: 15000 });
  console.log('   OK: redirected to dashboard');

  console.log('2. Superadmin dashboard loads data...');
  await page.waitForTimeout(3000);
  const body = await page.textContent('body');
  if (/PrismaClientInitializationError|could not locate the Query Engine/i.test(body || '')) {
    throw new Error('Dashboard shows Prisma engine error');
  }
  console.log('   OK: no Prisma errors on dashboard');

  console.log('3. Hospital admin login...');
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@hospital.com');
  await page.fill('input[type="password"]', 'Medinex@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/hospitaladmin/**', { timeout: 20000 });
  console.log('   OK: hospital admin dashboard');

  console.log('4. Check dashboard API...');
  const meRes = await page.request.get(`${base}/api/auth/me`);
  const meJson = await meRes.json();
  if (!meJson.success) throw new Error('/api/auth/me failed after login');

  if (errors.length) {
    console.warn('Console errors (non-fatal):', errors.slice(0, 5));
  }

  console.log('\n=== Browser E2E passed ===');
  await browser.close();
})().catch(async (e) => {
  console.error('Browser E2E FAILED:', e.message);
  process.exit(1);
});
