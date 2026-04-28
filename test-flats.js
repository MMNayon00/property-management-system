const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const flats = await prisma.flat.findMany();
  console.log(JSON.stringify(flats, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
