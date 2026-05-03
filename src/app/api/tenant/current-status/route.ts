import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = (session as any).user;
    if (role !== "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { userId: id },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Fetch all rent records for this tenant
    const allRecords = await prisma.rentRecord.findMany({
      where: { tenantId: tenant.id },
      include: { payments: true },
      orderBy: { month: "asc" },
    });

    // Separate current month and unpaid months
    const currentRecord = allRecords.find(r => r.month === currentMonth);
    const unpaidMonths = allRecords.filter(r => r.paymentStatus !== "PAID");
    
    // Calculate total summary
    const totalRent = allRecords.reduce((sum, r) => sum + r.totalAmount, 0);
    const paidAmount = allRecords.reduce((sum, r) => sum + r.paidAmount, 0);
    const dueAmount = totalRent - paidAmount;

    return NextResponse.json({
      currentMonth,
      currentRecord,
      unpaidMonths: unpaidMonths.map(r => ({
        id: r.id,
        month: r.month,
        amount: r.totalAmount,
        due: r.dueAmount,
        status: r.paymentStatus,
      })),
      summary: {
        totalRent,
        paidAmount,
        dueAmount: Math.max(0, dueAmount),
        totalMonths: allRecords.length,
      }
    });
  } catch (error) {
    console.error("Error fetching current status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
