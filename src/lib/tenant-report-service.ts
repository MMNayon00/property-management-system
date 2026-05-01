// Service for tenant rent reports
// Handles data fetching, calculations, and report generation

import { prisma } from "@/lib/prisma";

// Bangla month names
const BANGLA_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export interface TenantReportData {
  tenant: {
    id: string;
    name: string;
    phone: string | null;
    moveInDate: Date | null;
  };
  building: {
    id: string;
    name: string;
  };
  flat: {
    id: string;
    flatNumber: string;
  };
  months: TenantReportMonth[];
  summary: TenantReportSummary;
}

export interface TenantReportMonth {
  month: string; // "YYYY-MM"
  monthName: string; // "জানুয়ারি ২০২৬"
  baseRent: number;
  extraCharges: number;
  serviceCharges: number;
  total: number;
  paid: number;
  due: number;
  status: "পরিশোধিত" | "বাকি" | "আংশিক";
}

export interface TenantReportSummary {
  totalMonths: number;
  totalRent: number;
  totalPaid: number;
  totalDue: number;
}

/**
 * Generate month range from start date to end date
 */
function generateMonthRange(fromMonth: string, toMonth: string): string[] {
  const months: string[] = [];
  const [fromYear, fromMon] = fromMonth.split('-').map(Number);
  const [toYear, toMon] = toMonth.split('-').map(Number);

  let currentYear = fromYear;
  let currentMonth = fromMon;

  while (currentYear < toYear || (currentYear === toYear && currentMonth <= toMon)) {
    months.push(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return months;
}

/**
 * Format month string to Bangla
 */
function formatMonthToBangla(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const banglaYear = String(year).replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0x6C0 - 0x30));
  return `${BANGLA_MONTHS[month - 1]} ${banglaYear}`;
}

/**
 * Get payment status in Bangla
 */
function getPaymentStatus(total: number, paid: number): "পরিশোধিত" | "বাকি" | "আংশিক" {
  if (paid === 0) return "বাকি";
  if (paid >= total) return "পরিশোধিত";
  return "আংশিক";
}

/**
 * Fetch tenant report data
 */
export async function getTenantReportData(
  tenantId: string,
  fromMonth?: string,
  toMonth?: string
): Promise<TenantReportData | null> {
  // Get tenant with building and flat info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      currentFlat: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!tenant || !tenant.currentFlat) {
    return null;
  }

  // Determine date range
  let startMonth: string;
  let endMonth: string;

  if (fromMonth && toMonth) {
    // Custom range
    startMonth = fromMonth;
    endMonth = toMonth;
  } else {
    // Auto range from move-in date to current month
    const moveInDate = tenant.moveInDate || new Date();
    const currentDate = new Date();

    startMonth = `${moveInDate.getFullYear()}-${String(moveInDate.getMonth() + 1).padStart(2, '0')}`;
    endMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  }

  // Generate all months in range
  const monthRange = generateMonthRange(startMonth, endMonth);

  // Fetch rent records for the tenant in the date range
  const rentRecords = await prisma.rentRecord.findMany({
    where: {
      tenantId: tenantId,
      month: {
        in: monthRange,
      },
    },
    include: {
      payments: true,
    },
    orderBy: {
      month: 'asc',
    },
  });

  // Create month data map for quick lookup
  const rentRecordMap = new Map<string, typeof rentRecords[0]>();
  rentRecords.forEach(record => {
    rentRecordMap.set(record.month, record);
  });

  // Build monthly data
  const months: TenantReportMonth[] = [];
  let totalRent = 0;
  let totalPaid = 0;

  for (const monthStr of monthRange) {
    const record = rentRecordMap.get(monthStr);

    if (record) {
      // Calculate paid amount
      const paidAmount = record.payments.reduce((sum, payment) => sum + payment.amount, 0);

      const monthData: TenantReportMonth = {
        month: monthStr,
        monthName: formatMonthToBangla(monthStr),
        baseRent: record.baseRent,
        extraCharges: record.extraCharges,
        serviceCharges: record.serviceCharges,
        total: record.total,
        paid: paidAmount,
        due: record.total - paidAmount,
        status: getPaymentStatus(record.total, paidAmount),
      };

      months.push(monthData);
      totalRent += record.total;
      totalPaid += paidAmount;
    } else {
      // No rent record for this month (gap in data)
      const monthData: TenantReportMonth = {
        month: monthStr,
        monthName: formatMonthToBangla(monthStr),
        baseRent: 0,
        extraCharges: 0,
        serviceCharges: 0,
        total: 0,
        paid: 0,
        due: 0,
        status: "বাকি",
      };
      months.push(monthData);
    }
  }

  const summary: TenantReportSummary = {
    totalMonths: months.length,
    totalRent,
    totalPaid,
    totalDue: totalRent - totalPaid,
  };

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      moveInDate: tenant.moveInDate,
    },
    building: {
      id: tenant.currentFlat.building.id,
      name: tenant.currentFlat.building.name,
    },
    flat: {
      id: tenant.currentFlat.id,
      flatNumber: tenant.currentFlat.flatNumber,
    },
    months,
    summary,
  };
}

/**
 * Get buildings accessible to the current user
 */
export async function getUserBuildings(userId: string, userRole: string) {
  const where: any = {};

  if (userRole === "OWNER") {
    where.ownerId = userId;
  } else if (userRole === "MANAGER") {
    where.managerId = userId;
  }
  // Admin can see all buildings

  return await prisma.building.findMany({
    where,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get flats for a building
 */
export async function getBuildingFlats(buildingId: string) {
  return await prisma.flat.findMany({
    where: { buildingId },
    select: {
      id: true,
      flatNumber: true,
    },
    orderBy: {
      flatNumber: 'asc',
    },
  });
}

/**
 * Get tenants for a flat
 */
export async function getFlatTenants(flatId: string) {
  return await prisma.tenant.findMany({
    where: { currentFlatId: flatId },
    select: {
      id: true,
      name: true,
      phone: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}