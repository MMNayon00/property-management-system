require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    const tenants = await prisma.tenant.findMany({
        select: { id: true, userId: true, name: true }
    });
    console.log(JSON.stringify(tenants, null, 2));
}

check().finally(() => process.exit());
