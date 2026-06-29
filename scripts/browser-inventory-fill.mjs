/**
 * Fill inventory demo data via browser UI (no DB seed).
 * Usage: BASE_URL=http://151.243.146.218:3000 node scripts/browser-inventory-fill.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://151.243.146.218:3000';
const EMAIL = process.env.HOSPITAL_EMAIL || 'admin@hospital.com';
const PASS = process.env.HOSPITAL_PASS || 'Medinex@123';

const ITEMS = [
  { name: 'Paracetamol 500mg', generic: 'Paracetamol', category: 'Medicine', unit: 'strip', price: 25, mrp: 35, min: 20 },
  { name: 'Amoxicillin 250mg', generic: 'Amoxicillin', category: 'Medicine', unit: 'strip', price: 45, mrp: 65, min: 15 },
  { name: 'Surgical Gloves (M)', generic: 'Nitrile Gloves', category: 'Consumables', unit: 'box', price: 180, mrp: 250, min: 10 },
  { name: 'Normal Saline 500ml', generic: 'Sodium Chloride', category: 'Medicine', unit: 'bottle', price: 55, mrp: 75, min: 30 },
  { name: 'Bandage Roll 10cm', generic: 'Cotton Bandage', category: 'Consumables', unit: 'pcs', price: 15, mrp: 25, min: 25 },
];

const SUPPLIERS = [
  { name: 'MediSupply India', phone: '9876543210', city: 'Mumbai', gst: '27AABCU9603R1ZM' },
  { name: 'Global Pharma Distributors', phone: '9123456780', city: 'Delhi', gst: '07AABCG1234A1Z5' },
];

const SUBDEPTS = [
  { name: 'Main Pharmacy', type: 'Pharmacy' },
  { name: 'Emergency OPD', type: 'OPD (Outpatient Department)' },
];

async function fillReact(page, selector, value) {
  await page.locator(selector).click();
  await page.evaluate(({ sel, val }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { sel: selector, val: value });
}

async function login(page) {
  console.log('→ Login as hospital admin...');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#login-email', { timeout: 15000 });
  await fillReact(page, '#login-email', EMAIL);
  await fillReact(page, '#login-pw', PASS);
  await page.locator('button.mn-auth-btn, button[type="submit"]').first().click();
  await page.waitForURL('**/hospitaladmin/**', { timeout: 35000 });
  console.log('   OK');
}

async function goInventory(page) {
  await page.goto(`${BASE}/hospitaladmin/dashboard?tab=inventory`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
}

async function clickInvTab(page, label) {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click();
  await page.waitForTimeout(800);
}

async function dismissDialogs(page) {
  page.on('dialog', async (d) => {
    console.log('   [dialog]', d.message());
    await d.accept();
  });
}

async function addSubDeptIfNeeded(page) {
  console.log('→ Sub-departments (configure)...');
  await page.goto(`${BASE}/hospitaladmin/configure?tab=subdepts`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const body = await page.textContent('body');
  if (body?.includes('No sub-departments found')) {
    for (const sd of SUBDEPTS) {
      console.log(`   Adding sub-dept: ${sd.name}`);
      await page.getByRole('button', { name: /Add Sub-Department/i }).click();
      await page.waitForSelector('.sd-modal-title', { timeout: 8000 });

      // Sub-Department Type dropdown (second SearchableSelect in modal)
      const typeSelect = page.locator('.sd-modal .sd-field').filter({ hasText: 'Sub-Department Type' }).locator('[style*="cursor: pointer"]').first();
      await typeSelect.click();
      await page.locator('.sd-modal').getByText(sd.type, { exact: false }).first().click();

      await page.locator('.sd-modal input[placeholder*="Dental"]').fill(sd.name);
      await page.locator('.sd-modal button[type="submit"]').click();
      await page.waitForTimeout(2500);
      const stillOpen = await page.locator('.sd-modal-title').isVisible().catch(() => false);
      if (stillOpen) {
        const err = await page.locator('.sd-toast-error, .sd-toast.sd-toast-error').textContent().catch(() => '');
        console.warn(`   Sub-dept may have failed: ${err || 'modal still open'}`);
        await page.locator('.sd-modal .sd-icon-btn').first().click().catch(() => {});
      } else {
        console.log(`   OK: ${sd.name}`);
      }
    }
  } else {
    console.log('   Sub-departments already exist — skipping create');
  }
}

async function addItemViaUI(page, item) {
  const existing = await page.locator('table.hd-tbl tbody tr').filter({ hasText: item.name }).count();
  if (existing > 0) {
    console.log(`   Skip (exists): ${item.name}`);
    return;
  }
  console.log(`   Add item: ${item.name}`);
  await clickInvTab(page, 'Items');
  await page.getByRole('button', { name: /Add Item/i }).click();
  await page.waitForSelector('text=Add New Item', { timeout: 8000 });

  const modal = page.locator('form').filter({ has: page.locator('input[name="name"]') }).last();
  await modal.locator('input[name="name"]').fill(item.name);
  await modal.locator('input[name="genericName"]').fill(item.generic);
  await modal.locator('select[name="category"]').selectOption(item.category);
  await modal.locator('select[name="unit"]').selectOption(item.unit);
  await modal.locator('input[name="purchasePrice"]').fill(String(item.price));
  await modal.locator('input[name="mrp"]').fill(String(item.mrp));
  await modal.locator('input[name="minStock"]').fill(String(item.min));
  await modal.getByRole('button', { name: /^Add Item$/i }).click();
  await page.waitForTimeout(2000);
  const stillThere = await page.locator('text=Add New Item').isVisible().catch(() => false);
  if (stillThere) console.warn(`   Item modal still open for ${item.name}`);
  else console.log(`   OK: ${item.name}`);
}

async function addSupplierViaUI(page, sup) {
  await clickInvTab(page, 'Suppliers');
  const existing = await page.locator('table.hd-tbl tbody tr').filter({ hasText: sup.name }).count();
  if (existing > 0) {
    console.log(`   Skip (exists): ${sup.name}`);
    return;
  }
  console.log(`   Add supplier: ${sup.name}`);
  await page.getByRole('button', { name: /Add Supplier/i }).first().click();
  await page.waitForSelector('text=Add Supplier', { timeout: 8000 });
  const form = page.locator('form').filter({ has: page.locator('input[name="name"]') }).last();
  await form.locator('input[name="name"]').fill(sup.name);
  await form.locator('input[name="phone"]').fill(sup.phone);
  await form.getByRole('button', { name: /^Add Supplier$/i }).click();
  await page.waitForTimeout(2000);
  console.log(`   OK: ${sup.name}`);
}

async function createPurchaseViaUI(page) {
  console.log('→ New Purchase (restock)...');
  await clickInvTab(page, 'Purchases');
  await page.getByRole('button', { name: /New Purchase/i }).click();
  await page.waitForSelector('text=Restock / Purchase Order', { timeout: 10000 });

  const modal = page.locator('.hd-modal').filter({ hasText: 'Restock / Purchase Order' });
  const searchBox = modal.locator('input[placeholder*="Search items"]');
  const supplierSelect = modal.locator('select').first();
  await supplierSelect.selectOption({ index: 1 }).catch(() => {});
  await page.waitForTimeout(500);

  // Select all items currently in picker (single pass)
  const selectAllCb = modal.locator('text=Select all').locator('..').locator('input[type="checkbox"]');
  if (await selectAllCb.isVisible().catch(() => false)) {
    await selectAllCb.check();
  } else {
    for (const item of ITEMS) {
      await searchBox.fill(item.name.split(' ')[0]);
      await page.waitForTimeout(350);
      const row = modal.locator('div[style*="cursor: pointer"]').filter({ hasText: item.name }).first();
      if (await row.isVisible().catch(() => false)) {
        await row.locator('input[type="checkbox"]').check().catch(() => row.click());
      }
      await searchBox.fill('');
    }
  }

  const addSelected = modal.getByRole('button', { name: /Add .* Selected/i });
  if (await addSelected.isVisible().catch(() => false)) {
    await addSelected.click();
    await page.waitForTimeout(600);
  }

  const rows = modal.locator('table.hd-tbl tbody tr');
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    await rows.nth(i).locator('td').nth(2).locator('input[type="number"]').fill(String(50 + i * 10));
  }

  await modal.getByRole('button', { name: /Pay Now/i }).click();
  await page.waitForTimeout(300);
  await modal.getByRole('button', { name: /Record Purchase/i }).click();
  await page.waitForSelector('text=Purchase Recorded', { timeout: 20000 });
  const doneBtn = modal.getByRole('button', { name: /^Done$/i });
  if (await doneBtn.isVisible().catch(() => false)) await doneBtn.click();
  console.log(`   OK: purchase recorded (${rowCount} line items)`);
}

async function deptTransferViaUI(page) {
  console.log('→ Dept Transfer...');
  await goInventory(page);
  await clickInvTab(page, 'Dept Transfers');
  await page.getByRole('button', { name: /Transfer Stock|Transfer Now/i }).first().click();
  await page.waitForSelector('text=Transfer Stock to Department', { timeout: 10000 });

  const modal = page.locator('.hd-modal').filter({ hasText: 'Transfer Stock to Department' });
  await page.waitForTimeout(2000);

  // Open destination department dropdown and pick dept
  await modal.locator('text=— Select Department —').click();
  await page.waitForTimeout(500);
  const picked =
    (await modal.getByText('Main Pharmacy', { exact: true }).click({ timeout: 3000 }).then(() => true).catch(() => false)) ||
    (await modal.getByText('Emergency OPD', { exact: true }).click({ timeout: 3000 }).then(() => true).catch(() => false));
  if (!picked) throw new Error('Could not select a sub-department from dropdown');
  await page.waitForTimeout(1000);

  // Wait until item picker is enabled (not "Select a destination department first")
  await modal.locator('text=Select a destination department first').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});

  const selectAll = modal.getByRole('button', { name: /Select All/i });
  if (await selectAll.isVisible().catch(() => false)) {
    await selectAll.click();
    await page.waitForTimeout(300);
  } else {
    const firstItem = modal.locator('div[style*="cursor: pointer"]').filter({ hasText: /Paracetamol|Amoxicillin|Surgical|Saline|Bandage/i }).first();
    if (await firstItem.isVisible().catch(() => false)) await firstItem.click();
  }

  const addToTransfer = modal.getByRole('button', { name: /Add .* to Transfer/i });
  await addToTransfer.waitFor({ state: 'visible', timeout: 8000 });
  await addToTransfer.click();
  await page.waitForTimeout(800);

  const confirmBtn = modal.getByRole('button', { name: /Confirm & Transfer/i });
  for (let i = 0; i < 20; i++) {
    if (await confirmBtn.isEnabled().catch(() => false)) break;
    await page.waitForTimeout(300);
  }
  if (!(await confirmBtn.isEnabled())) {
    throw new Error('Confirm & Transfer still disabled — dept or items missing');
  }
  await confirmBtn.click();
  await page.waitForSelector('text=Stock Transferred Successfully', { timeout: 20000 });
  console.log('   OK: dept transfer complete');
  await page.waitForTimeout(2000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  dismissDialogs(page);

  try {
    await login(page);
    if (!process.env.TRANSFER_ONLY) {
      await addSubDeptIfNeeded(page);
      await goInventory(page);

      if (!process.env.PURCHASE_ONLY) {
        console.log('→ Inventory items...');
        for (const item of ITEMS) await addItemViaUI(page, item);

        console.log('→ Suppliers...');
        for (const sup of SUPPLIERS) await addSupplierViaUI(page, sup);
      }

      await createPurchaseViaUI(page);
    }
    if (!process.env.PURCHASE_ONLY) await deptTransferViaUI(page);

    // Final counts
    await goInventory(page);
    await page.waitForTimeout(2000);
    const summary = await page.textContent('body');
    console.log('\n=== Done (browser UI) ===');
    console.log('Items mentioned:', ITEMS.map((i) => i.name).join(', '));
    console.log('Suppliers:', SUPPLIERS.map((s) => s.name).join(', '));
    if (summary?.includes('Purchase Recorded') || summary?.includes('Purchases')) {
      console.log('Purchases tab visible on dashboard');
    }
  } catch (e) {
    console.error('\nFAILED:', e.message);
    await page.screenshot({ path: '/tmp/inventory-fill-error.png', fullPage: true }).catch(() => {});
    console.error('Screenshot: /tmp/inventory-fill-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
