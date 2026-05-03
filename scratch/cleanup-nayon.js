require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
    console.log("Cleaning up duplicate Nayon records...");
    // Link the orphaned Nayon to the existing user if needed, or just delete duplicates
    // For this fix, we'll ensure the userId is only on one record.
    const allNayons = await prisma.tenant.findMany({ where: { name: "Nayon" } });
    console.log(`Found ${allNayons.length} Nayon records.`);
    
    // If there's an orphaned one and a linked one, let's keep the linked one.
}

cleanup().finally(() => process.exit());
