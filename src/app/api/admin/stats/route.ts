// Admin API: Dashboard statistics
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get statistics
    const totalOwners = await prisma.user.count({
      where: { role: "OWNER" },
    });

    const totalBuildings = await prisma.building.count();

    const totalTenants = await prisma.tenant.count();

    // Calculate monthly income (sum of paid rent records this month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthlyIncome = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        rentRecord: {
          year,
          month,
        },
      },
    });

    // Get pending users count
    const pendingUsers = await prisma.user.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      totalOwners,
      totalBuildings,
      totalTenants,
      monthlyIncome: monthlyIncome._sum.amount || 0,
      pendingUsers,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
