// Manager API: Get flats from buildings assigned to the manager
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
    const managerUser = await prisma.user.findUnique({ where: { id: managerId } });
    const ownerId = managerUser?.ownerId;

    if (!ownerId) {
      return NextResponse.json({ error: "Manager not associated with any owner" }, { status: 403 });
    }

    // Get buildings managed by this manager
    const buildings = await prisma.building.findMany({
      where: { ownerId },
      select: { id: true, name: true },
    });

    const buildingIds = buildings.map(b => b.id);

    if (buildingIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get flats from managed buildings
    const flats = await prisma.flat.findMany({
      where: { buildingId: { in: buildingIds } },
      select: {
        id: true,
        flatNumber: true,
        floor: true,
        baseRent: true,
        status: true,
        building: {
          select: { name: true },
        },
        currentTenant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { building: { name: "asc" } },
        { flatNumber: "asc" },
      ],
    });

    const formattedFlats = flats.map((flat) => ({
      id: flat.id,
      flatNumber: flat.flatNumber,
      floor: flat.floor,
      baseRent: flat.baseRent,
      status: flat.status,
      buildingName: flat.building.name,
      tenantName: flat.currentTenant?.name || null,
      tenantPhone: flat.currentTenant?.phone || null,
    }));

    return NextResponse.json(formattedFlats);

  } catch (error) {
    console.error("Error fetching manager flats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}