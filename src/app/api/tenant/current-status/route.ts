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

    const currentRecord = await prisma.rentRecord.findFirst({
      where: {
        tenantId: tenant.id,
        month: currentMonth,
      },
      include: {
        payments: true,
      },
    });

    const summary = await prisma.rentRecord.aggregate({
      where: { tenantId: tenant.id },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      }
    });

    const totalPaid = await prisma.payment.aggregate({
      where: {
        rentRecord: {
          tenantId: tenant.id
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalDue = (summary._sum.total || 0) - (totalPaid._sum.amount || 0);

    return NextResponse.json({
      currentMonth,
      currentRecord,
      summary: {
        totalRent: summary._sum.total || 0,
        paidAmount: totalPaid._sum.amount || 0,
        dueAmount: totalDue,
        totalMonths: summary._count.id || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching current status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
