// Admin API: Overview statistics
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [totalUsers, totalOwners, totalBuildings, totalTenants, pendingUsers, monthlyIncome] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "OWNER" } }),
        prisma.building.count(),
        prisma.tenant.count(),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            rentRecord: {
              month: monthStr,
            },
          },
        }),
      ]);

    return NextResponse.json({
      totalUsers,
      totalOwners,
      totalBuildings,
      totalTenants,
      pendingUsers,
      monthlyIncome: monthlyIncome._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
