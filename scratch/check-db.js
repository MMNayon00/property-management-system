require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    console.log("Checking Tenant table columns...");
    const tenant = await prisma.tenant.findFirst();
    if (tenant) {
        console.log("Found tenant record. Columns:", Object.keys(tenant));
    } else {
        console.log("No tenant records found to check columns.");
    }
}

check().finally(() => process.exit());
