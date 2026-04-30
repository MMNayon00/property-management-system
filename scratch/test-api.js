import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "mostofa@gmail.com" } });
  if (!user) { console.log("User not found"); return; }
  
  const { role, id } = user;
  const where = { ownerId: id, flats: { some: { status: "VACANT" } } };
  
  const buildings = await prisma.building.findMany({
    where,
    include: {
      flats: {
        where: { status: "VACANT" },
      },
    },
  });
  
  console.log(`Buildings for ${user.email} (ID: ${id}, Role: ${role}):`);
  console.log(JSON.stringify(buildings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
