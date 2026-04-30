// Manager API: Get rent records for assigned buildings
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
      return NextResponse.json([]);
    }

    // Get rent records for managed buildings
    const rentRecords = await prisma.rentRecord.findMany({
      where: { buildingId: { in: buildingIds } },
      select: {
        id: true,
        flatId: true,
        tenantId: true,
        buildingId: true,
        month: true,
        baseRent: true,
        extraCharges: true,
        serviceCharges: true,
        total: true,
        paymentStatus: true,
        flat: {
          select: {
            flatNumber: true,
            building: {
              select: { name: true },
            },
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { month: "desc" },
        { flat: { flatNumber: "asc" } },
      ],
    });

    const formattedRecords = rentRecords.map((record) => ({
      id: record.id,
      flatId: record.flatId,
      tenantId: record.tenantId,
      buildingId: record.buildingId,
      month: record.month,
      baseRent: record.baseRent,
      extraCharges: record.extraCharges,
      serviceCharges: record.serviceCharges,
      total: record.total,
      paymentStatus: record.paymentStatus,
      flatNumber: record.flat.flatNumber,
      buildingName: record.flat.building.name,
      tenantName: record.tenant?.name || null,
    }));

    return NextResponse.json(formattedRecords);

  } catch (error) {
    console.error("Error fetching rent records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}