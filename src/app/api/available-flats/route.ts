import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id } = (session as any).user;
    
    const where: any = {};
    if (role === "ADMIN") {
      // Admins see all buildings with vacant flats
      where.flats = { some: { status: "VACANT" } };
    } else if (role === "MANAGER") {
      // Managers see buildings they manage that have vacant flats
      where.managerId = id;
      where.flats = { some: { status: "VACANT" } };
    } else {
      // Owners see buildings they own that have vacant flats
      where.ownerId = id;
      where.flats = { some: { status: "VACANT" } };
    }

    const buildings = await prisma.building.findMany({
      where,
      include: {
        flats: {
          where: { status: "VACANT" },
          orderBy: { flatNumber: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(buildings);
  } catch (error: any) {
    console.error("CRITICAL ERROR in /api/available-flats:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error?.message || "Unknown error" 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
