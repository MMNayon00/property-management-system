require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspect() {
    console.log("Inspecting Flat 507...");
    const flat = await prisma.flat.findFirst({
        where: { flatNumber: '507' },
        include: { currentTenant: true }
    });

    if (!flat) {
        console.log("Flat 507 not found!");
        return;
    }

    console.log("Flat Details:", JSON.stringify(flat, null, 2));

    if (flat.currentTenant) {
        const records = await prisma.rentRecord.findMany({
            where: { tenantId: flat.currentTenantId },
            orderBy: { month: 'asc' }
        });
        console.log("Rent Records for Tenant:", JSON.stringify(records, null, 2));
    } else {
        console.log("No current tenant in Flat 507");
    }
}

inspect().finally(() => process.exit());
