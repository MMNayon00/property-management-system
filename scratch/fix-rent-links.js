const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixUnlinkedRentRecords() {
  console.log('Starting rent record linkage fix...');
  
  const unlinkedRecords = await prisma.rentRecord.findMany({
    where: { tenantId: null },
    include: { flat: true }
  });

  console.log(`Found ${unlinkedRecords.length} unlinked records.`);

  for (const record of unlinkedRecords) {
    if (record.flat && record.flat.currentTenantId) {
      await prisma.rentRecord.update({
        where: { id: record.id },
        data: { tenantId: record.flat.currentTenantId }
      });
      console.log(`Linked record ${record.month} for flat ${record.flat.flatNumber} to tenant ${record.flat.currentTenantId}`);
    }
  }

  console.log('Fix completed.');
}

fixUnlinkedRentRecords()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
