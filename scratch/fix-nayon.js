require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fix() {
    console.log("Fixing Nayon's data for Flat 507...");
    
    // 1. Clear moveOutDate
    await prisma.tenant.update({
        where: { id: 'cmopabgnx0002ldrzl26cvzdx' },
        data: { moveOutDate: null }
    });
    console.log("Cleared moveOutDate.");

    // 2. Fix April flatId
    await prisma.rentRecord.update({
        where: { id: 'cmopac8yk0004ldrzvja0zyl2' },
        data: { flatId: 'cmopav1wa0000y2rz284ax9qv' }
    });
    console.log("Fixed April flatId.");
}

fix().finally(() => process.exit());
