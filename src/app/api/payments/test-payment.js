const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const payment = await prisma.payment.create({
      data: {
        rentRecordId: 'cmoiy6drd0002hyrzbt1le0ts',
        flatId: 'cmoixlj6f000glsrzk18bunq7',
        buildingId: 'cmoixkgbe000elsrzapdo0whz',
        amount: 24000,
        method: 'Cash',
        reference: 'Test',
        createdById: 'cmoisqyy40000dhrzewbtx4qd',
      },
    });
    console.log('Payment created:', payment);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
