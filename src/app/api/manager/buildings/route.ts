// Manager API: Get buildings assigned to the manager
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

    // Get buildings managed by this manager with flat counts
    const buildings = await prisma.building.findMany({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        address: true,
        area: true,
        _count: {
          select: { flats: true },
        },
        flats: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate occupied and vacant flats for each building
    const buildingsWithStats = buildings.map((building) => {
      const occupiedFlats = building.flats.filter(f => f.status === "OCCUPIED").length;
      const vacantFlats = building.flats.filter(f => f.status === "VACANT").length;

      return {
        id: building.id,
        name: building.name,
        address: building.address,
        area: building.area,
        totalFlats: building._count.flats,
        occupiedFlats,
        vacantFlats,
      };
    });

    return NextResponse.json(buildingsWithStats);

  } catch (error) {
    console.error("Error fetching manager buildings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}