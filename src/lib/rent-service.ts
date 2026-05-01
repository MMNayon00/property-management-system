import { prisma } from "./prisma";

/**
 * Automatically generates rent records for a specific month.
 * If no month is provided, it defaults to the current month in "YYYY-MM" format.
 */
export async function generateMonthlyRentRecords(targetMonth?: string) {
  // Default to current month if not provided
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthStr = targetMonth || `${year}-${month}`;

  console.log(`[RentService] Starting rent generation for ${currentMonthStr}...`);

  // Find all flats that are currently occupied
  const occupiedFlats = await prisma.flat.findMany({
    where: {
      status: 'OCCUPIED',
      currentTenantId: { not: null },
    },
    include: {
      building: true,
      currentTenant: true,
    },
  });

  const stats = {
    totalFlats: occupiedFlats.length,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  for (const flat of occupiedFlats) {
    try {
      // 1. Check if a rent record already exists for this flat and month
      const existingRecord = await prisma.rentRecord.findUnique({
        where: {
          flatId_month: {
            flatId: flat.id,
            month: currentMonthStr,
          },
        },
      });

      if (existingRecord) {
        stats.skipped++;
        continue;
      }

      // 2. Get the most recent rent record for this flat to copy charges
      // We look for the latest month alphabetically/chronologically before currentMonthStr
      const lastRecord = await prisma.rentRecord.findFirst({
        where: {
          flatId: flat.id,
          month: { lt: currentMonthStr }
        },
        orderBy: {
          month: 'desc'
        }
      });

      // 3. Determine rent and charges
      // baseRent comes from the Flat model (Rule 4: Store new rent config in Flat model)
      const baseRent = flat.baseRent;
      
      // Copy extra and service charges from last month if available
      const extraCharges = lastRecord?.extraCharges || 0;
      const serviceCharges = lastRecord?.serviceCharges || 0;
      const totalAmount = baseRent + extraCharges + serviceCharges;

      // 4. Create the new rent record
      await prisma.rentRecord.create({
        data: {
          flatId: flat.id,
          buildingId: flat.buildingId,
          tenantId: flat.currentTenantId,
          month: currentMonthStr,
          baseRent,
          extraCharges,
          serviceCharges,
          total: totalAmount,
          paymentStatus: 'UNPAID',
        },
      });

      stats.created++;
    } catch (error) {
      console.error(`[RentService] Failed to generate rent for Flat ${flat.flatNumber}:`, error);
      stats.failed++;
    }
  }

  console.log(`[RentService] Finished. Created: ${stats.created}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`);
  return stats;
}

/**
 * Automatically updates payment statuses for rent records based on payments made.
 * This ensures that rent records reflect the correct payment status.
 */
export async function updatePaymentStatuses() {
  console.log(`[RentService] Starting payment status updates...`);

  // Find all rent records that are not marked as PAID
  const unpaidRecords = await prisma.rentRecord.findMany({
    where: {
      paymentStatus: {
        in: ['UNPAID', 'PARTIAL']
      }
    },
    include: {
      payments: true
    }
  });

  let updated = 0;
  let errors = 0;

  for (const record of unpaidRecords) {
    try {
      const totalPaid = record.payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      let newStatus = 'UNPAID';
      if (totalPaid >= record.total) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      if (newStatus !== record.paymentStatus) {
        await prisma.rentRecord.update({
          where: { id: record.id },
          data: { paymentStatus: newStatus as any }
        });
        updated++;
      }
    } catch (error) {
      console.error(`[RentService] Failed to update payment status for record ${record.id}:`, error);
      errors++;
    }
  }

  console.log(`[RentService] Payment status updates completed. Updated: ${updated}, Errors: ${errors}`);
  return { updated, errors };
}
