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

    if ((session as any).user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current year
    const currentYear = new Date().getFullYear();

    // Fetch unpaid rent records grouped by month for the current year
    const unpaidRecords = await prisma.rentRecord.groupBy({
      by: ['month'],
      where: {
        month: { startsWith: `${currentYear}-` },
        paymentStatus: 'UNPAID',
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // Format the response for a chart or table
    const trends = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthStr = `${currentYear}-${String(monthNum).padStart(2, '0')}`;
      const record = unpaidRecords.find((r) => r.month === monthStr);
      return {
        month: monthNum,
        amount: record?._sum.total || 0,
        count: record?._count.id || 0,
      };
    });

    // Fetch some basic mock logs or recent user activities
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ trends, recentUsers });
  } catch (error) {
    console.error("Error fetching monitoring data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
