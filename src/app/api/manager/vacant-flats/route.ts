// Manager API: Get vacant flats from assigned buildings
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
      select: { id: true, name: true },
    });

    const buildingIds = buildings.map(b => b.id);

    if (buildingIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get vacant flats from managed buildings
    const flats = await prisma.flat.findMany({
      where: {
        buildingId: { in: buildingIds },
        status: "VACANT",
      },
      select: {
        id: true,
        flatNumber: true,
        baseRent: true,
        building: {
          select: { name: true },
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
      buildingName: flat.building.name,
      baseRent: flat.baseRent,
      status: "VACANT" as const,
    }));

    return NextResponse.json(formattedFlats);

  } catch (error) {
    console.error("Error fetching vacant flats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}