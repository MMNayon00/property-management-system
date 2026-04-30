import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const buildings = await prisma.building.findMany({
    include: { 
      flats: {
        where: { status: "VACANT" }
      },
      owner: true,
      manager: true
    }
  });
  
  console.log(JSON.stringify(buildings.map(b => ({
    name: b.name,
    owner: b.owner.email,
    manager: b.manager?.email,
    vacantFlats: b.flats.map(f => f.flatNumber)
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
