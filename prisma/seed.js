require("dotenv/config");
const { PrismaClient, UserRole, UserStatus, FlatStatus, PaymentStatus } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  ),
});

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      approvedAt: now,
    },
    create: {
      email: "admin@example.com",
      password: await hashPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      approvedAt: now,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {
      role: UserRole.OWNER,
      status: UserStatus.APPROVED,
      approvedAt: now,
    },
    create: {
      email: "owner@example.com",
      password: await hashPassword("owner123"),
      firstName: "Owner",
      lastName: "User",
      role: UserRole.OWNER,
      status: UserStatus.APPROVED,
      approvedAt: now,
    },
  });

  let building = await prisma.building.findFirst({
    where: { name: "Green View", ownerId: owner.id },
  });

  if (!building) {
    building = await prisma.building.create({
      data: {
        name: "Green View",
        address: "12 Main Road",
        area: "Dhanmondi",
        totalFlats: 1,
        ownerId: owner.id,
      },
    });
  }

  const flat = await prisma.flat.upsert({
    where: {
      buildingId_flatNumber: {
        buildingId: building.id,
        flatNumber: "A1",
      },
    },
    update: {
      baseRent: 15000,
      floor: 1,
    },
    create: {
      flatNumber: "A1",
      floor: 1,
      baseRent: 15000,
      status: FlatStatus.VACANT,
      buildingId: building.id,
    },
  });

  let tenant = await prisma.tenant.findFirst({
    where: { name: "Test Tenant", phone: "01700000000" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Test Tenant",
        phone: "01700000000",
        whatsapp: "01700000000",
        nidNumber: "1234567890",
        moveInDate: now,
        currentFlatId: flat.id,
      },
    });
  }

  await prisma.flat.update({
    where: { id: flat.id },
    data: {
      status: FlatStatus.OCCUPIED,
      currentTenantId: tenant.id,
    },
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { currentFlatId: flat.id, moveInDate: now },
  });

  const historyExists = await prisma.tenantHistory.findFirst({
    where: { tenantId: tenant.id, flatId: flat.id },
  });

  if (!historyExists) {
    await prisma.tenantHistory.create({
      data: {
        tenantId: tenant.id,
        flatId: flat.id,
        moveInDate: now,
        rentAmount: flat.baseRent,
      },
    });
  }

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const rentRecord = await prisma.rentRecord.upsert({
    where: {
      flatId_month: {
        flatId: flat.id,
        month: monthStr,
      },
    },
    update: {
      tenantId: tenant.id,
      baseRent: 15000,
      extraCharges: 500,
      serviceCharges: 1000,
      total: 16500,
      paymentStatus: PaymentStatus.PAID,
    },
    create: {
      flatId: flat.id,
      tenantId: tenant.id,
      buildingId: building.id,
      month: monthStr,
      baseRent: 15000,
      extraCharges: 500,
      serviceCharges: 1000,
      total: 16500,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  const paymentExists = await prisma.payment.findFirst({
    where: { rentRecordId: rentRecord.id },
  });

  if (!paymentExists) {
    await prisma.payment.create({
      data: {
        rentRecordId: rentRecord.id,
        flatId: flat.id,
        buildingId: building.id,
        amount: 16500,
        method: "cash",
        reference: "seed-payment",
        createdById: admin.id,
      },
    });
  }

  const chargeExists = await prisma.charge.findFirst({
    where: { name: "Service Charge", buildingId: building.id },
  });

  if (!chargeExists) {
    await prisma.charge.create({
      data: {
        name: "Service Charge",
        description: "Monthly service fee",
        amount: 1000,
        buildingId: building.id,
      },
    });
  }

  console.log("Seed completed:");
  console.log("- Admin: admin@example.com / admin123");
  console.log("- Owner: owner@example.com / owner123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
