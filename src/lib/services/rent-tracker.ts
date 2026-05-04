import { prisma } from "@/lib/prisma";

/**
 * Automatically generates missing rent records for all active tenants.
 * This should run on server start or via a cron job.
 */
export async function generateMonthlyRentRecords() {
  console.log("Starting automatic rent generation...");
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // "YYYY-MM"

  try {
    // 1. Get all active tenants with their flats
    const tenants = await prisma.tenant.findMany({
      where: {
        moveInDate: { lte: now },
        moveOutDate: null,
        currentFlatId: { not: null },
      },
      include: {
        currentFlat: true,
      },
    });

    console.log(`Found ${tenants.length} active tenants.`);

    for (const tenant of tenants) {
      if (!tenant.currentFlatId || !tenant.currentFlat) continue;

      // Calculate months since move-in
      const moveInDate = new Date(tenant.moveInDate!);
      const monthsToProcess = getMonthsBetween(moveInDate, now);

      for (const month of monthsToProcess) {
        // Check if record exists for this tenant and month
        const existing = await prisma.rentRecord.findUnique({
          where: {
            tenantId_month: {
              tenantId: tenant.id,
              month,
            },
          },
        });

        if (!existing) {
          console.log(`Generating rent for tenant ${tenant.name} - ${month}`);
          const baseRent = tenant.currentFlat.baseRent;
          // You could add logic here to fetch recurring charges
          const extraCharges = 0; 
          const serviceCharges = 0;
          const totalAmount = baseRent + extraCharges + serviceCharges;

          await prisma.rentRecord.create({
            data: {
              tenantId: tenant.id,
              flatId: tenant.currentFlatId,
              buildingId: tenant.currentFlat.buildingId,
              month,
              baseRent,
              extraCharges,
              serviceCharges,
              totalAmount,
              dueAmount: totalAmount, // Initially, everything is due
              paymentStatus: "UNPAID",
            },
          });
        }
      }
    }
    console.log("Rent generation completed.");
  } catch (error) {
    console.error("Error in generateMonthlyRentRecords:", error);
  }
}

/**
 * Calculates payment balances and updates the RentRecord
 */
export async function updateRentRecordBalances(rentRecordId: string) {
  const payments = await prisma.payment.findMany({
    where: { rentRecordId },
  });

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const record = await prisma.rentRecord.findUnique({ where: { id: rentRecordId } });
  
  if (!record) return;

  const totalAmount = record.baseRent + record.extraCharges + record.serviceCharges;
  const dueAmount = totalAmount - paidAmount;
  
  let paymentStatus: "PAID" | "UNPAID" | "PARTIAL" = "UNPAID";
  if (dueAmount <= 0) paymentStatus = "PAID";
  else if (paidAmount > 0) paymentStatus = "PARTIAL";

  await prisma.rentRecord.update({
    where: { id: rentRecordId },
    data: {
      totalAmount,
      paidAmount,
      dueAmount: dueAmount < 0 ? 0 : dueAmount,
      paymentStatus,
    },
  });
}

/**
 * Helper to get all months between two dates in YYYY-MM format
 */
function getMonthsBetween(start: Date, end: Date): string[] {
  const months = [];
  let currY = start.getFullYear();
  let currM = start.getMonth(); // 0-indexed
  
  const endY = end.getFullYear();
  const endM = end.getMonth();

  while (currY < endY || (currY === endY && currM <= endM)) {
    const monthStr = `${currY}-${String(currM + 1).padStart(2, '0')}`;
    months.push(monthStr);
    
    currM++;
    if (currM > 11) {
      currM = 0;
      currY++;
    }
  }
  return months;
}

/**
 * One-time fix for existing records
 */
export async function fixExistingRecords() {
    const records = await prisma.rentRecord.findMany({
        include: { payments: true }
    });

    for (const record of records) {
        const totalAmount = record.baseRent + record.extraCharges + record.serviceCharges;
        const paidAmount = record.payments.reduce((sum, p) => sum + p.amount, 0);
        const dueAmount = Math.max(0, totalAmount - paidAmount);
        
        let paymentStatus: "PAID" | "UNPAID" | "PARTIAL" = "UNPAID";
        if (dueAmount <= 0) paymentStatus = "PAID";
        else if (paidAmount > 0) paymentStatus = "PARTIAL";

        await prisma.rentRecord.update({
            where: { id: record.id },
            data: {
                totalAmount,
                paidAmount,
                dueAmount,
                paymentStatus
            }
        });
    }
}
