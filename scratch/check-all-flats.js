import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const buildings = await prisma.building.findMany({
    include: { 
      flats: true,
      owner: true
    }
  });
  
  console.log(JSON.stringify(buildings.map(b => ({
    name: b.name,
    owner: b.owner.email,
    flats: b.flats.map(f => ({ number: f.flatNumber, status: f.status }))
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
