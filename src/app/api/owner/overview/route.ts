// Owner/Manager API: Overview statistics
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

    if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = session.user.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const buildingWhere =
      session.user.role === "OWNER"
        ? { ownerId: userId }
        : { managerId: userId };

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const buildings = await prisma.building.findMany({
      where: buildingWhere,
      select: { id: true },
    });

    const buildingIds = buildings.map((b) => b.id);

    if (buildingIds.length === 0) {
      return NextResponse.json({
        totalBuildings: 0,
        totalFlats: 0,
        totalTenants: 0,
        occupiedFlats: 0,
        vacantFlats: 0,
        unpaidRent: 0,
        monthlyIncome: 0,
      });
    }

    const [totalFlats, totalTenants, occupiedFlats, vacantFlats, unpaidRent, monthlyIncome] =
      await Promise.all([
        prisma.flat.count({ where: { buildingId: { in: buildingIds } } }),
        prisma.tenant.count({
          where: {
            currentFlat: {
              buildingId: { in: buildingIds },
            },
          },
        }),
        prisma.flat.count({
          where: { buildingId: { in: buildingIds }, status: "OCCUPIED" },
        }),
        prisma.flat.count({
          where: { buildingId: { in: buildingIds }, status: "VACANT" },
        }),
        prisma.rentRecord.count({
          where: {
            buildingId: { in: buildingIds },
            paymentStatus: "UNPAID",
          },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            buildingId: { in: buildingIds },
            rentRecord: {
              year,
              month,
            },
          },
        }),
      ]);

    return NextResponse.json({
      totalBuildings: buildingIds.length,
      totalFlats,
      totalTenants,
      occupiedFlats,
      vacantFlats,
      unpaidRent,
      monthlyIncome: monthlyIncome._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching owner overview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
