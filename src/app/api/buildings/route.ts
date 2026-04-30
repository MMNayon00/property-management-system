// Building API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  address: z.string().min(1, "Address is required"),
  area: z.string().optional(),
  managerId: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let buildings;

    if (session.user.role === "ADMIN") {
      // Admins see all buildings
      buildings = await prisma.building.findMany({
        include: {
          owner: { select: { firstName: true, lastName: true, email: true } },
          flats: true,
        },
      });
    } else if (session.user.role === "OWNER") {
      // Owners see only their buildings
      buildings = await prisma.building.findMany({
        where: { ownerId: session.user.id },
        include: {
          owner: { select: { firstName: true, lastName: true } },
          flats: true,
        },
      });
    } else if (session.user.role === "MANAGER") {
      // Managers see only buildings they manage
      buildings = await prisma.building.findMany({
        where: { managerId: session.user.id },
        include: {
          owner: { select: { firstName: true, lastName: true } },
          flats: true,
        },
      });
    }

    return NextResponse.json(buildings);
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "ADMIN" && !session.user.id) {
      return NextResponse.json({ error: "Invalid admin" }, { status: 400 });
    }

    const body = await req.json();
    const validation = buildingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, address, area, managerId } = validation.data;

    // Only owners can create buildings (unless admin is doing it)
    const ownerId =
      session.user.role === "OWNER"
        ? session.user.id
        : req.nextUrl.searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner ID is required" },
        { status: 400 }
      );
    }

    // Verify owner exists
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner || owner.role !== "OWNER") {
      return NextResponse.json(
        { error: "Invalid owner" },
        { status: 400 }
      );
    }

    const building = await prisma.building.create({
      data: {
        name,
        address,
        area: area || null,
        ownerId,
        managerId: managerId || null,
      },
    });

    return NextResponse.json(building, { status: 201 });
  } catch (error) {
    console.error("Error creating building:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
