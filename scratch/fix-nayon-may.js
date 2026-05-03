require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fix() {
    console.log("Creating May record for Nayon...");
    try {
        await prisma.rentRecord.create({
            data: {
                tenantId: 'cmopabgnx0002ldrzl26cvzdx',
                flatId: 'cmopav1wa0000y2rz284ax9qv',
                buildingId: 'cmolsos2e00006yrz7fkx5y91',
                month: '2026-05',
                baseRent: 25000,
                extraCharges: 0,
                serviceCharges: 3000,
                totalAmount: 28000,
                dueAmount: 28000,
                paymentStatus: 'UNPAID'
            }
        });
        console.log("May record created successfully.");
    } catch (e) {
        console.log("May record might already exist or error:", e.message);
    }
}

fix().finally(() => process.exit());
