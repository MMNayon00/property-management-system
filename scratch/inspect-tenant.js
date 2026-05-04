require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    console.log("Checking last 5 tenants and their rent records...");
    const tenants = await prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            rentRecords: {
                orderBy: { month: 'asc' }
            }
        }
    });

    for (const t of tenants) {
        console.log(`\nTenant: ${t.name}`);
        console.log(`Move-In Date: ${t.moveInDate}`);
        console.log(`Rent Records: ${t.rentRecords.map(r => r.month).join(', ')}`);
    }
}

check().finally(() => process.exit());
