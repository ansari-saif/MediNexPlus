const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const SEED_EMAIL = process.env.SEED_HOSPITAL_EMAIL || "admin@hospital.com";
const SEED_PASSWORD = process.env.SEED_HOSPITAL_PASSWORD || "Medinex@123";
const SEED_HOSPITAL_NAME = process.env.SEED_HOSPITAL_NAME || "Demo Hospital";
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Hospital Admin";
const SEED_MOBILE = process.env.SEED_HOSPITAL_MOBILE || "+919876543210";

async function main() {
  const prisma = new PrismaClient();

  try {
    const hospitalCount = await prisma.hospital.count();
    if (hospitalCount > 0) {
      console.log("[seed] Database already has hospitals — skipping.");
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
    if (existingUser) {
      console.log("[seed] Seed admin user already exists — skipping.");
      return;
    }

    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setFullYear(trialEnd.getFullYear() + 1);

    const hospital = await prisma.hospital.create({
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

    await prisma.user.create({
      data: {
        hospitalId: hospital.id,
        name: SEED_ADMIN_NAME,
        email: SEED_EMAIL,
        password: hashedPassword,
        role: "HOSPITAL_ADMIN",
      },
    });

    await prisma.hospitalSettings.create({
      data: {
        hospitalId: hospital.id,
        hospitalName: SEED_HOSPITAL_NAME,
        email: SEED_EMAIL,
        phone: SEED_MOBILE,
      },
    });

    console.log("[seed] Demo hospital created.");
    console.log(`[seed] Login: ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
