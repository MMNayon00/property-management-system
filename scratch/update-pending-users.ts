import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.user.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'APPROVED' },
  });
  console.log(`Updated ${result.count} users from PENDING to APPROVED.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
