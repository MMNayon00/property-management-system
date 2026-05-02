// Flat API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const flatSchema = z.object({
  flatNumber: z.string().min(1),
  floor: z.number().optional(),
  baseRent: z.number().min(0),
  status: z.enum(["VACANT", "OCCUPIED"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const buildingId = req.nextUrl.searchParams.get("buildingId");
    if (!buildingId) return NextResponse.json({ error: "Building ID required" }, { status: 400 });

    // Verify access
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });

    const { role, id } = (session as any).user;
    if (role === "OWNER" && building.ownerId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (role === "MANAGER") {
      const managerUser = await prisma.user.findUnique({ where: { id } });
      if (building.ownerId !== managerUser?.ownerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const flats = await prisma.flat.findMany({
      where: { buildingId },
      include: { currentTenant: true, building: true },
    });

    return NextResponse.json(flats);
  } catch (error) {
    console.error("Error fetching flats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = flatSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const buildingId = req.nextUrl.searchParams.get("buildingId");
    if (!buildingId) return NextResponse.json({ error: "Building ID required" }, { status: 400 });

    const { flatNumber, floor, baseRent, status } = validation.data;

    const flat = await prisma.flat.create({
      data: {
        flatNumber,
        floor: floor || null,
        baseRent,
        status: (status || "VACANT") as "VACANT" | "OCCUPIED",
        buildingId,
      },
    });

    return NextResponse.json(flat, { status: 201 });
  } catch (error) {
    console.error("Error creating flat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
