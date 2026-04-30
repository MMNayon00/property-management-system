// Manager API: Dashboard statistics for assigned buildings
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session as any).user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const managerId = (session as any).user.id as string;

    // Get buildings managed by this manager
    const buildings = await prisma.building.findMany({
      where: { managerId },
      select: { id: true },
    });

    const buildingIds = buildings.map(b => b.id);

    if (buildingIds.length === 0) {
      return NextResponse.json({
        totalBuildings: 0,
        totalFlats: 0,
        totalTenants: 0,
        monthlyIncome: 0,
        unpaidRent: 0,
        occupiedFlats: 0,
        vacantFlats: 0,
      });
    }

    // Get stats for managed buildings
    const [
      totalBuildings,
      totalFlats,
      occupiedFlats,
      vacantFlats,
      totalTenants,
      monthlyIncome,
      unpaidRent,
    ] = await Promise.all([
      // Total buildings
      prisma.building.count({
        where: { managerId },
      }),

      // Total flats
      prisma.flat.count({
        where: { buildingId: { in: buildingIds } },
      }),

      // Occupied flats
      prisma.flat.count({
        where: {
          buildingId: { in: buildingIds },
          status: "OCCUPIED",
        },
      }),

      // Vacant flats
      prisma.flat.count({
        where: {
          buildingId: { in: buildingIds },
          status: "VACANT",
        },
      }),

      // Total tenants
      prisma.tenant.count({
        where: {
          currentFlat: {
            buildingId: { in: buildingIds },
          },
        },
      }),

      // Monthly income (paid rent this month)
      prisma.payment.aggregate({
        where: {
          buildingId: { in: buildingIds },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),

      // Unpaid rent (current month rent records that are unpaid)
      prisma.rentRecord.aggregate({
        where: {
          buildingId: { in: buildingIds },
          month: {
            startsWith: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          },
          paymentStatus: { in: ["UNPAID", "PARTIAL"] },
        },
        _sum: { total: true },
      }),
    ]);

    return NextResponse.json({
      totalBuildings,
      totalFlats,
      totalTenants,
      monthlyIncome: monthlyIncome._sum.amount || 0,
      unpaidRent: unpaidRent._sum.total || 0,
      occupiedFlats,
      vacantFlats,
    });

  } catch (error) {
    console.error("Error fetching manager dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}