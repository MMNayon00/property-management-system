require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
    console.log("Starting cleanup of incorrect rent records...");
    
    const tenants = await prisma.tenant.findMany({
        where: { currentFlatId: { not: null } }
    });

    for (const t of tenants) {
        if (!t.moveInDate) continue;
        
        const moveInMonth = `${t.moveInDate.getFullYear()}-${String(t.moveInDate.getMonth() + 1).padStart(2, '0')}`;
        
        console.log(`Checking Tenant: ${t.name} (Moved in: ${moveInMonth})`);
        
        const deleted = await prisma.rentRecord.deleteMany({
            where: {
                tenantId: t.id,
                month: { lt: moveInMonth }
            }
        });
        
        if (deleted.count > 0) {
            console.log(`  - Deleted ${deleted.count} incorrect records before ${moveInMonth}`);
        }
    }
    console.log("Cleanup finished.");
}

cleanup().finally(() => process.exit());
