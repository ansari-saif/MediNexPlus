/**
 * Fill Configure Hospital demo data via browser UI (no DB seed).
 * Usage: BASE_URL=http://151.243.146.218:3000 node scripts/browser-configure-fill.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://151.243.146.218:3000';
const EMAIL = process.env.HOSPITAL_EMAIL || 'admin@hospital.com';
const PASS = process.env.HOSPITAL_PASS || 'Medinex@123';

const DEPARTMENTS = [
  { name: 'General Medicine', code: 'GENMED', type: 'Clinical', desc: 'Primary care and general OPD services' },
  { name: 'Diagnostics Center', code: 'DIAG', type: 'Diagnosis / Pathology', desc: 'Lab, radiology and diagnostic services' },
  { name: 'Support Services', code: 'SUPPRT', type: 'Support / Service', desc: 'Pharmacy, ambulance and housekeeping' },
];

const SUBDEPTS = [
  { name: 'General OPD Clinic', type: 'OPD (Outpatient Department)', parentHint: 'General Medicine' },
  { name: 'Pathology Laboratory', type: 'Pathology Lab', parentHint: null },
  { name: 'Blood Bank Unit', type: 'Blood Bank', parentHint: null },
];

const SERVICES = [
  { name: 'General Consultation Package', code: 'GEN-CONS-1', price: 500, sessions: 1, duration: 30 },
  { name: 'Full Body Health Checkup', code: 'HEALTH-CHK', price: 3500, sessions: 1, duration: 120 },
  { name: 'Dental Care Package (3 Sessions)', code: 'DENTAL-3', price: 8000, sessions: 3, duration: 45 },
];

const DOCTORS = [
  { name: 'Dr. Rahul Mehta', email: 'rahul.mehta@hospital.com', phone: '9876500001', spec: 'General Physician', qual: 'MBBS, MD', fee: 500, deptHint: 'General Medicine' },
  { name: 'Dr. Priya Nair', email: 'priya.nair@hospital.com', phone: '9876500002', spec: 'Cardiology', qual: 'MBBS, DM Cardiology', fee: 800, deptHint: 'General Medicine' },
  { name: 'Dr. Amit Sharma', email: 'amit.sharma@hospital.com', phone: '9876500003', spec: 'Orthopedics', qual: 'MBBS, MS Ortho', fee: 700, deptHint: 'General Medicine' },
];

const STAFF = [
  { name: 'Priya Receptionist', email: 'reception@hospital.com', phone: '9876510001', role: 'RECEPTIONIST', salary: 25000, deptHint: 'General Medicine' },
  { name: 'Sunita Nurse', email: 'nurse.sunita@hospital.com', phone: '9876510002', role: 'NURSE', salary: 32000, deptHint: 'General Medicine' },
  { name: 'Raj Lab Technician', email: 'lab.raj@hospital.com', phone: '9876510003', role: 'LAB_TECHNICIAN', salary: 28000, deptHint: 'Diagnostics Center' },
];

const WARDS = [
  { name: 'General Ward A', type: 'GENERAL', floor: 'Ground Floor', room: '101', beds: ['G-101-A', 'G-101-B'] },
  { name: 'ICU Block', type: 'ICU', floor: '1st Floor', room: 'ICU-1', beds: ['ICU-01', 'ICU-02'] },
  { name: 'Private Ward', type: 'PRIVATE', floor: '2nd Floor', room: 'P-201', beds: ['P-201-A'] },
];

const TREATMENT_PLANS = [
  { name: 'Annual Health Monitoring Plan', sessions: 4, cost: 12000, serviceHint: 'Health Checkup', doctorHint: 'Rahul' },
  { name: 'Dental Treatment Course', sessions: 3, cost: 8000, serviceHint: 'Dental', doctorHint: 'Amit' },
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
  console.log('→ Login...');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#login-email', { timeout: 15000 });
  await fillReact(page, '#login-email', EMAIL);
  await fillReact(page, '#login-pw', PASS);
  await page.locator('button.mn-auth-btn').click();
  await page.waitForURL('**/hospitaladmin/**', { timeout: 35000 });
  console.log('   OK');
}

async function goTab(page, tab) {
  await page.goto(`${BASE}/hospitaladmin/configure?tab=${tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
}

async function existsOnPage(page, text) {
  return (await page.locator('body').textContent())?.includes(text);
}

async function selectSearchableOption(page, scope, optionText) {
  const box = scope.locator('[style*="cursor: pointer"]').filter({ hasText: /Select|—/ }).first();
  if (await box.isVisible().catch(() => false)) {
    await box.click();
    await page.waitForTimeout(350);
  }
  await scope.getByText(optionText, { exact: false }).first().click({ timeout: 5000 });
}

async function addDepartments(page) {
  console.log('→ Departments...');
  await goTab(page, 'departments');
  for (const d of DEPARTMENTS) {
    if (await existsOnPage(page, d.name)) {
      console.log(`   Skip: ${d.name}`);
      continue;
    }
    console.log(`   Add: ${d.name}`);
    await page.getByRole('button', { name: /Add Department/i }).click();
    await page.waitForSelector('text=Add Department', { timeout: 8000 });
    const modal = page.locator('.dept-modal-body').last();
    await modal.locator('input[placeholder*="General OPD"]').fill(d.name);
    await modal.locator('input[placeholder*="GENOPD"]').fill(d.code);
    await modal.locator('textarea[placeholder*="Brief description"]').fill(d.desc);
    if (d.type) {
      const typeField = page.locator('.dept-field').filter({ hasText: 'Type' }).locator('[style*="cursor: pointer"]').first();
      await typeField.click();
      await page.waitForTimeout(300);
      await page.getByText(d.type, { exact: false }).first().click();
    }
    await page.getByRole('button', { name: /Create Department/i }).click();
    await page.waitForTimeout(2500);
    console.log(`   OK: ${d.name}`);
  }
}

async function addSubDepts(page) {
  console.log('→ Sub-Depts / Procedures...');
  await goTab(page, 'subdepts');
  for (const sd of SUBDEPTS) {
    if (await existsOnPage(page, sd.name)) {
      console.log(`   Skip: ${sd.name}`);
      continue;
    }
    console.log(`   Add: ${sd.name}`);
    await page.getByRole('button', { name: /Add Sub-Department/i }).click();
    await page.waitForSelector('.sd-modal-title', { timeout: 8000 });
    const modal = page.locator('.sd-modal').last();

    // Parent department (optional)
    if (sd.parentHint) {
      const parentBox = modal.locator('.sd-field').filter({ hasText: 'Parent Department' }).locator('[style*="cursor: pointer"]').first();
      if (await parentBox.isVisible().catch(() => false)) {
        await parentBox.click();
        await page.waitForTimeout(300);
        await modal.getByText(sd.parentHint, { exact: false }).first().click().catch(() => {});
        await page.waitForTimeout(400);
      }
    }

    const typeBox = modal.locator('.sd-field').filter({ hasText: 'Sub-Department Type' }).locator('[style*="cursor: pointer"]').first();
    await typeBox.click();
    await page.waitForTimeout(400);
    const typeOption = modal.locator('div').filter({ hasText: new RegExp(`^${sd.type.replace(/[()]/g, '\\$&')}$`, 'i') }).last();
    if (await typeOption.isVisible().catch(() => false)) {
      await typeOption.click();
    } else {
      await modal.getByText(sd.type, { exact: false }).first().click();
    }

    await modal.locator('input[placeholder*="Dental"]').fill(sd.name);
    await modal.locator('button[type="submit"]').click();
    await page.waitForTimeout(2500);
    console.log(`   OK: ${sd.name}`);
  }
}

async function selectByLabelText(locator, labelText) {
  await locator.evaluate((sel, wanted) => {
    const opt = Array.from(sel.options).find((o) => o.textContent?.includes(wanted));
    if (!opt) throw new Error(`Option not found: ${wanted}`);
    sel.value = opt.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }, labelText);
}

async function addServices(page) {
  console.log('→ Services & Packages...');
  for (const s of SERVICES) {
    await goTab(page, 'services');
    if (await page.locator('.sp-tbl tbody tr').filter({ hasText: s.name }).count() > 0) {
      console.log(`   Skip: ${s.name}`);
      continue;
    }
    console.log(`   Add: ${s.name}`);
    await page.getByRole('button', { name: /Add Service\/Package/i }).click();
    await page.waitForSelector('text=Add Service/Package', { timeout: 8000 });
    const modal = page.locator('.sp-modal').last();
    await modal.locator('input[placeholder*="PRP Hair"]').fill(s.name);
    await modal.locator('input[placeholder*="PRP-HAIR"]').fill(s.code);
    await selectByLabelText(modal.locator('label').filter({ hasText: /^Department$/ }).locator('..').locator('select'), 'General Medicine');
    await page.waitForTimeout(600);
    const subSel = modal.locator('label').filter({ hasText: 'Sub-Department' }).locator('..').locator('select');
    await subSel.locator('option').nth(1).waitFor({ timeout: 8000 }).catch(() => {});
    await selectByLabelText(subSel, 'General OPD').catch(() => selectByLabelText(subSel, 'Emergency OPD'));
    await modal.locator('label').filter({ hasText: 'Number of Sessions' }).locator('..').locator('input').fill(String(s.sessions));
    await modal.locator('label').filter({ hasText: 'Total Package Price' }).locator('..').locator('input').fill(String(s.price));
    await modal.locator('label').filter({ hasText: 'Duration' }).locator('..').locator('input').fill(String(s.duration));
    await modal.getByRole('button', { name: /^Create$/i }).click();
    await page.waitForTimeout(2000);
    const err = await modal.locator('text=/Foreign key|Error|failed/i').textContent().catch(() => '');
    if (err) {
      await page.locator('.sp-modal .sp-icon-btn').click().catch(() => {});
      throw new Error(`Service ${s.name}: ${err}`);
    }
    await page.locator('.sp-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => page.keyboard.press('Escape'));
    console.log(`   OK: ${s.name}`);
  }
}

async function addDoctors(page) {
  console.log('→ Doctors Setup...');
  await goTab(page, 'doctors');
  for (const doc of DOCTORS) {
    if (await existsOnPage(page, doc.name)) {
      console.log(`   Skip: ${doc.name}`);
      continue;
    }
    console.log(`   Add: ${doc.name}`);
    await page.getByRole('button', { name: /Add Doctor/i }).click();
    await page.waitForSelector('text=Add New Doctor', { timeout: 8000 });
    await page.locator('input[placeholder="Dr. John Smith"]').fill(doc.name);
    await page.locator('input[placeholder="doctor@hospital.com"]').fill(doc.email);
    await page.locator('input[placeholder="+91 9876543210"]').fill(doc.phone);
    await page.locator('input[placeholder*="Cardiology"]').fill(doc.spec);
    await page.locator('input[placeholder*="MBBS"]').fill(doc.qual);
    const deptSelect = page.locator('select.dp-select').filter({ has: page.locator('option', { hasText: 'Select Department' }) }).first();
    await selectByLabelText(deptSelect, doc.deptHint || 'General Medicine');
    await page.locator('input[placeholder="500"]').fill(String(doc.fee));
    await page.getByRole('button', { name: /^Add Doctor$/i }).click();
    await page.waitForSelector('text=No doctors found', { state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const onForm = await page.locator('text=Add New Doctor').isVisible().catch(() => false);
    if (onForm) await page.getByRole('button', { name: /Back to Doctors/i }).click().catch(() => {});
    await page.waitForTimeout(1000);
    console.log(`   OK: ${doc.name}`);
  }
}

async function addStaff(page) {
  console.log('→ Staff Setup...');
  await goTab(page, 'staff');
  for (const st of STAFF) {
    if (await existsOnPage(page, st.name)) {
      console.log(`   Skip: ${st.name}`);
      continue;
    }
    console.log(`   Add: ${st.name}`);
    await page.getByRole('button', { name: /Add Staff/i }).click();
    await page.waitForSelector('text=Add New Staff Member', { timeout: 8000 });
    await page.locator('input[placeholder="e.g. Priya Sharma"]').fill(st.name);
    await page.locator('input[placeholder="staff@hospital.com"]').fill(st.email);
    await page.locator('input[placeholder="+91 98765 43210"]').fill(st.phone);
    await page.locator('select.sp-select').first().selectOption(st.role);
    const deptSelect = page.locator('select.sp-select').nth(1);
    await selectByLabelText(deptSelect, st.deptHint || 'General Medicine');
    await page.locator('input[placeholder="e.g. 35000"]').fill(String(st.salary));
    await page.getByRole('button', { name: /Create Staff Member/i }).click();
    await page.waitForTimeout(3000);
    const onForm = await page.locator('text=Add New Staff Member').isVisible().catch(() => false);
    if (onForm) {
      const errText = await page.locator('text=/failed|error|Unknown argument|already exists/i').first().textContent().catch(() => 'form still open');
      throw new Error(`Staff create failed for ${st.name}: ${errText}`);
    }
    await goTab(page, 'staff');
    if (await page.locator('body').textContent().then(t => !t?.includes(st.name))) {
      throw new Error(`Staff ${st.name} not visible in list after save`);
    }
    console.log(`   OK: ${st.name}`);
  }
}

async function addTreatmentPlans(page) {
  console.log('→ Treatment Plans...');
  await goTab(page, 'treatments');
  for (const tp of TREATMENT_PLANS) {
    if (await page.locator('.tp-tbl tbody tr, table tbody tr').filter({ hasText: tp.name }).count() > 0) {
      console.log(`   Skip: ${tp.name}`);
      continue;
    }
    console.log(`   Add: ${tp.name}`);
    await page.getByRole('button', { name: /Add Plan/i }).click();
    await page.waitForSelector('text=Add Treatment Plan', { timeout: 8000 });
    const modal = page.locator('.tp-modal').last();
    await modal.locator('input[placeholder*="Root Canal"]').fill(tp.name);
    await modal.locator('label').filter({ hasText: 'Total Sessions' }).locator('..').locator('input').fill(String(tp.sessions));
    await modal.locator('label').filter({ hasText: 'Total Cost' }).locator('..').locator('input').fill(String(tp.cost));
    const today = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    await modal.locator('input[type="date"]').nth(0).fill(today);
    await modal.locator('input[type="date"]').nth(1).fill(end);
    await modal.getByRole('button', { name: /Create Plan/i }).click();
    await page.waitForTimeout(2500);
    const err = await modal.locator('.tp-form-error').textContent().catch(() => '');
    if (err) throw new Error(`Treatment plan ${tp.name}: ${err}`);
    await page.locator('.tp-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => page.keyboard.press('Escape'));
    console.log(`   OK: ${tp.name}`);
  }
}

async function addWardBedSetup(page) {
  console.log('→ Ward & Bed Setup...');
  await goTab(page, 'wards');
  for (const w of WARDS) {
    await goTab(page, 'wards');
    const wardExists = await page.locator('.wb-ward-name', { hasText: w.name }).count() > 0;
    if (!wardExists) {
      console.log(`   Ward: ${w.name}`);
      await page.getByRole('button', { name: /Add Ward|Create First Ward/i }).first().click();
      await page.waitForSelector('text=Add New Ward', { timeout: 8000 });
      const wardModal = page.locator('.wb-modal').filter({ hasText: 'Add New Ward' });
      await wardModal.locator('input[placeholder*="ICU Block"]').fill(w.name);
      await wardModal.locator('select.wb-select').first().selectOption(w.type).catch(() => {});
      await wardModal.locator('input[placeholder*="Ground"]').fill(w.floor);
      await wardModal.getByRole('button', { name: /Create Ward/i }).click();
      await page.waitForTimeout(2500);
    } else {
      console.log(`   Ward exists: ${w.name}`);
    }

    await page.locator('.wb-ward-name', { hasText: w.name }).first().click();
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    const roomCard = page.locator('.wb-room-no', { hasText: w.room }).first();
    const roomExists = (await roomCard.count()) > 0;
    if (!roomExists) {
      await page.getByRole('button', { name: /Add Room|Add First Room/i }).first().click();
      await page.waitForSelector('text=Add New Room', { timeout: 8000 });
      const roomModal = page.locator('.wb-modal').filter({ hasText: 'Add New Room' });
      await roomModal.locator('input[placeholder*="R-101"]').fill(w.room);
      await roomModal.getByRole('button', { name: /Create Room/i }).click();
      await page.locator('.wb-overlay').waitFor({ state: 'hidden', timeout: 10000 });
      await page.waitForTimeout(800);
    }

    await page.locator('.wb-room-no', { hasText: w.room }).first().click();
    await page.waitForTimeout(1500);

    for (const bedNo of w.beds) {
      if ((await page.locator('body').textContent())?.includes(bedNo)) {
        continue;
      }
      await page.getByRole('button', { name: /^Add Bed$/i }).first().click();
      await page.waitForSelector('text=Add Bed', { timeout: 8000 });
      const bedModal = page.locator('.wb-modal').filter({ hasText: 'Add Bed' }).last();
      await bedModal.locator('input[placeholder*="B-01"]').fill(bedNo);
      await bedModal.locator('input[type="number"]').last().fill('1500');
      await bedModal.getByRole('button', { name: /^Add Bed$/i }).click();
      await page.waitForTimeout(2000);
    }

    await page.getByRole('button', { name: /Wards/i }).first().click();
    await page.waitForTimeout(1500);
    console.log(`   OK: ${w.name} (${w.beds.length} beds)`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('dialog', async (d) => { console.log('   [dialog]', d.message()); await d.accept(); });

  try {
    await login(page);
    if (process.env.FROM_STAFF_ONLY) {
      await addStaff(page);
    } else if (!process.env.FROM_TREATMENTS) {
      await addDepartments(page);
      await addSubDepts(page);
      await addServices(page);
      await addDoctors(page);
      await addStaff(page);
    }
    if (!process.env.FROM_WARDS && !process.env.FROM_STAFF_ONLY) await addTreatmentPlans(page);
    if (!process.env.FROM_STAFF_ONLY) await addWardBedSetup(page);
    console.log('\n=== Configure Hospital complete (browser UI) ===');
  } catch (e) {
    console.error('\nFAILED:', e.message);
    await page.screenshot({ path: '/tmp/configure-fill-error.png', fullPage: true }).catch(() => {});
    console.error('Screenshot: /tmp/configure-fill-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
