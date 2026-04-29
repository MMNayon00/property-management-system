// Reports API: Generate monthly reports and analytics
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const type = req.nextUrl.searchParams.get("type"); // "monthly" or "tenant"
    const buildingId = req.nextUrl.searchParams.get("buildingId");
    const tenantId = req.nextUrl.searchParams.get("tenantId");
    
    // Month as string "YYYY-MM"
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStr = req.nextUrl.searchParams.get("month") || currentMonthStr;

    if (type === "monthly" && buildingId) {
      // Monthly building report
      const rentRecords = await prisma.rentRecord.findMany({
        where: {
          buildingId,
          month: monthStr,
        },
        include: {
          flat: true,
          payments: true,
        },
      });

      const totalCollection = rentRecords.reduce((sum, record) => {
        const paid = record.payments.reduce((p, payment) => p + payment.amount, 0);
        return sum + paid;
      }, 0);

      const totalDue = rentRecords.reduce((sum, record) => {
        const paid = record.payments.reduce((p, payment) => p + payment.amount, 0);
        return sum + Math.max(0, record.total - paid);
      }, 0);

      return NextResponse.json({
        type: "monthly",
        buildingId,
        month: monthStr,
        records: rentRecords,
        totalCollection,
        totalDue,
        collectionRate: totalCollection / (totalCollection + totalDue) || 0,
      });
    } else if (type === "tenant" && tenantId) {
      // Tenant lifetime report
      const payments = await prisma.payment.findMany({
        where: { rentRecord: { flat: { currentTenantId: tenantId } } },
        include: { rentRecord: true },
      });

      const totalPaid = payments.reduce((sum, p) => p.amount, 0);

      return NextResponse.json({
        type: "tenant",
        tenantId,
        payments,
        totalPaid,
        paymentCount: payments.length,
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
