import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all buildings for the owner, and include ONLY vacant flats
    const buildings = await prisma.building.findMany({
      where: { ownerId: session.user.id },
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
