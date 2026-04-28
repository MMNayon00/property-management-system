const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const flatId = "cmoivxiwh0008lsrz2y75j66w"; // Flat 201 (dhaka)

    const tenant = await prisma.tenant.create({
      data: {
        name: "Test Tenant",
        phone: "01700000000",
        whatsapp: "01700000000",
        nidNumber: "1234567890",
        moveInDate: new Date(),
        currentFlatId: flatId,
      },
    });

    const flat = await prisma.flat.findUnique({ where: { id: flatId } });
    if (flat) {
      await prisma.tenantHistory.create({
        data: {
          tenantId: tenant.id,
          flatId,
          moveInDate: new Date(),
          rentAmount: flat.baseRent,
        },
      });

      await prisma.flat.update({
        where: { id: flatId },
        data: { status: "OCCUPIED", currentTenantId: tenant.id },
      });
    }
    console.log("Success! Tenant ID:", tenant.id);
  } catch (e) {
    console.error("Error!", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
