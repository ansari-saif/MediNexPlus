const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const SEED_EMAIL = process.env.SEED_HOSPITAL_EMAIL || "admin@hospital.com";
const SEED_PASSWORD = process.env.SEED_HOSPITAL_PASSWORD || "Medinex@123";
const SEED_HOSPITAL_NAME = process.env.SEED_HOSPITAL_NAME || "Demo Hospital";
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Hospital Admin";
const SEED_MOBILE = process.env.SEED_HOSPITAL_MOBILE || "+919876543210";

const PARENT_DEPARTMENTS = [
  { name: "Clinical Services", code: "CLIN", type: "CLINICAL", email: "clinical@hospital.com", password: "Clinical@123", userName: "Clinical Head" },
  { name: "Administrative", code: "ADMIN", type: "ADMINISTRATIVE", email: "administrative@hospital.com", password: "Administrative@123", userName: "Administrative Head" },
  { name: "Support Services", code: "SUPP", type: "SUPPORT", email: "support@hospital.com", password: "Support@123", userName: "Support Head" },
  { name: "Diagnostics", code: "DIAG", type: "DIAGNOSTIC", email: "diagnostic@hospital.com", password: "Diagnostic@123", userName: "Diagnostics Head" },
  { name: "General Operations", code: "OPS", type: "CUSTOM", email: "parentdept@hospital.com", password: "Medinex@123", userName: "Operations Head" },
];

const SUB_DEPARTMENTS = [
  { name: "Pharmacy", type: "PHARMACY", parentType: "SUPPORT" },
  { name: "Ambulance", type: "AMBULANCE", parentType: "SUPPORT" },
  { name: "Housekeeping", type: "HOUSEKEEPING", parentType: "SUPPORT" },
  { name: "Pathology Lab", type: "PATHOLOGY", parentType: "DIAGNOSTIC" },
  { name: "Blood Bank", type: "BLOOD_BANK", parentType: "DIAGNOSTIC" },
];

async function ensureUser(prisma, { hospitalId, name, email, password, role }) {
  const hashed = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed, role, isActive: true, name, hospitalId },
    });
  }
  return prisma.user.create({
    data: { hospitalId, name, email, password: hashed, role, isActive: true },
  });
}

async function ensureHospital(prisma) {
  let hospital = await prisma.hospital.findFirst({ where: { email: SEED_EMAIL } });
  if (!hospital) {
    const admin = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
    if (admin) hospital = await prisma.hospital.findUnique({ where: { id: admin.hospitalId } });
  }

  if (!hospital) {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setFullYear(trialEnd.getFullYear() + 1);
    hospital = await prisma.hospital.create({
      data: {
        name: SEED_HOSPITAL_NAME,
        email: SEED_EMAIL,
        mobile: SEED_MOBILE,
        isVerified: true,
        trialStartDate: now,
        trialEndDate: trialEnd,
        subscriptionStatus: "TRIAL",
      },
    });
    console.log("[seed] Created demo hospital.");
  }

  await ensureUser(prisma, {
    hospitalId: hospital.id,
    name: SEED_ADMIN_NAME,
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    role: "HOSPITAL_ADMIN",
  });

  const settings = await prisma.hospitalSettings.findUnique({ where: { hospitalId: hospital.id } });
  if (!settings) {
    await prisma.hospitalSettings.create({
      data: {
        hospitalId: hospital.id,
        hospitalName: SEED_HOSPITAL_NAME,
        email: SEED_EMAIL,
        phone: SEED_MOBILE,
      },
    });
  }

  return hospital;
}

async function ensureDepartments(prisma, hospitalId) {
  const existing = await prisma.department.findMany({
    where: { hospitalId },
    select: { id: true, type: true, code: true },
  });
  const byType = new Map(existing.map((d) => [d.type, d.id]));
  const codes = new Set(existing.map((d) => d.code));

  for (const parent of PARENT_DEPARTMENTS) {
    if (byType.has(parent.type) || codes.has(parent.code)) continue;
    const created = await prisma.department.create({
      data: {
        hospitalId,
        name: parent.name,
        code: parent.code,
        type: parent.type,
        allowAppointments: false,
        isIPD: false,
        isActive: true,
      },
    });
    byType.set(parent.type, created.id);
    codes.add(parent.code);
  }

  const existingSubs = await prisma.subDepartment.findMany({
    where: { hospitalId },
    select: { type: true },
  });
  const haveTypes = new Set(existingSubs.map((s) => s.type));

  for (const sub of SUB_DEPARTMENTS) {
    if (haveTypes.has(sub.type)) continue;
    await prisma.subDepartment.create({
      data: {
        hospitalId,
        name: sub.name,
        type: sub.type,
        departmentId: byType.get(sub.parentType) ?? null,
        isActive: true,
        color: "#0E898F",
      },
    });
    haveTypes.add(sub.type);
  }

  return byType;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const hospital = await ensureHospital(prisma);
    const deptByType = await ensureDepartments(prisma, hospital.id);

    for (const parent of PARENT_DEPARTMENTS) {
      const user = await ensureUser(prisma, {
        hospitalId: hospital.id,
        name: parent.userName,
        email: parent.email,
        password: parent.password,
        role: "DEPT_HEAD",
      });
      const deptId = deptByType.get(parent.type);
      if (deptId) {
        await prisma.department.update({
          where: { id: deptId },
          data: { hodUserId: user.id, loginEmail: parent.email, credentialsSent: true },
        });
      }
    }

    const doctorUser = await ensureUser(prisma, {
      hospitalId: hospital.id,
      name: "Demo Doctor",
      email: "doctor@hospital.com",
      password: "Doctor@123",
      role: "DOCTOR",
    });
    const existingDoctor = await prisma.doctor.findFirst({
      where: { hospitalId: hospital.id, email: "doctor@hospital.com" },
    });
    if (!existingDoctor) {
      await prisma.doctor.create({
        data: {
          hospitalId: hospital.id,
          userId: doctorUser.id,
          name: "Demo Doctor",
          email: "doctor@hospital.com",
          phone: "9876543211",
          specialization: "General Medicine",
          consultationFee: 500,
          isActive: true,
          isAvailable: true,
        },
      });
    } else if (!existingDoctor.userId) {
      await prisma.doctor.update({
        where: { id: existingDoctor.id },
        data: { userId: doctorUser.id },
      });
    }

    const staffHash = await bcrypt.hash("Staff@123", 10);
    const staffUser = await ensureUser(prisma, {
      hospitalId: hospital.id,
      name: "Demo Staff",
      email: "staff@hospital.com",
      password: "Staff@123",
      role: "STAFF",
    });
    const existingStaff = await prisma.staff.findFirst({
      where: { hospitalId: hospital.id, email: "staff@hospital.com" },
    });
    if (!existingStaff) {
      await prisma.staff.create({
        data: {
          hospitalId: hospital.id,
          userId: staffUser.id,
          name: "Demo Staff",
          email: "staff@hospital.com",
          phone: "9876543212",
          role: "NURSE",
          password: staffHash,
          mustChangePassword: false,
          credentialsSent: true,
          isActive: true,
        },
      });
    } else {
      await prisma.staff.update({
        where: { id: existingStaff.id },
        data: { userId: staffUser.id, password: staffHash, mustChangePassword: false, credentialsSent: true, isActive: true },
      });
    }

    const recHash = await bcrypt.hash("Receptionist@123", 10);
    const recUser = await ensureUser(prisma, {
      hospitalId: hospital.id,
      name: "Demo Receptionist",
      email: "receptionist@hospital.com",
      password: "Receptionist@123",
      role: "RECEPTIONIST",
    });
    const existingRec = await prisma.staff.findFirst({
      where: { hospitalId: hospital.id, email: "receptionist@hospital.com" },
    });
    if (!existingRec) {
      await prisma.staff.create({
        data: {
          hospitalId: hospital.id,
          userId: recUser.id,
          name: "Demo Receptionist",
          email: "receptionist@hospital.com",
          phone: "9876543213",
          role: "RECEPTIONIST",
          password: recHash,
          mustChangePassword: false,
          credentialsSent: true,
          isActive: true,
        },
      });
    } else {
      await prisma.staff.update({
        where: { id: existingRec.id },
        data: { userId: recUser.id, password: recHash, mustChangePassword: false, credentialsSent: true, isActive: true, role: "RECEPTIONIST" },
      });
    }

    const financeUser = await ensureUser(prisma, {
      hospitalId: hospital.id,
      name: "Demo Finance Head",
      email: "finance@hospital.com",
      password: "Finance@123",
      role: "FINANCE_HEAD",
    });
    const financeDept = await prisma.financeDepartment.findUnique({ where: { hospitalId: hospital.id } });
    if (!financeDept) {
      await prisma.financeDepartment.create({
        data: {
          hospitalId: hospital.id,
          name: "Finance Department",
          hodName: "Demo Finance Head",
          hodEmail: "finance@hospital.com",
          loginEmail: "finance@hospital.com",
          userId: financeUser.id,
          credentialsSent: true,
          isActive: true,
        },
      });
    } else {
      await prisma.financeDepartment.update({
        where: { hospitalId: hospital.id },
        data: {
          hodEmail: "finance@hospital.com",
          loginEmail: "finance@hospital.com",
          userId: financeUser.id,
          credentialsSent: true,
          isActive: true,
        },
      });
    }

    const subUser = await ensureUser(prisma, {
      hospitalId: hospital.id,
      name: "Pharmacy Head",
      email: "subdept@hospital.com",
      password: "SubDept@123",
      role: "SUB_DEPT_HEAD",
    });
    const pharmacy = await prisma.subDepartment.findFirst({
      where: { hospitalId: hospital.id, type: "PHARMACY" },
    });
    if (pharmacy) {
      await prisma.subDepartment.update({
        where: { id: pharmacy.id },
        data: {
          userId: subUser.id,
          hodName: "Pharmacy Head",
          hodEmail: "subdept@hospital.com",
          loginEmail: "subdept@hospital.com",
          credentialsSent: true,
          isActive: true,
        },
      });
    }

    console.log("[seed] Demo hospital + portal users ready.");
    console.log(`  hospital admin   ${SEED_EMAIL} / ${SEED_PASSWORD}`);
    console.log("  doctor           doctor@hospital.com / Doctor@123");
    console.log("  staff            staff@hospital.com / Staff@123");
    console.log("  receptionist     receptionist@hospital.com / Receptionist@123");
    console.log("  finance          finance@hospital.com / Finance@123");
    console.log("  parentdept       parentdept@hospital.com / Medinex@123");
    console.log("  clinical         clinical@hospital.com / Clinical@123");
    console.log("  diagnostic       diagnostic@hospital.com / Diagnostic@123");
    console.log("  administrative   administrative@hospital.com / Administrative@123");
    console.log("  support          support@hospital.com / Support@123");
    console.log("  subdept          subdept@hospital.com / SubDept@123");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
