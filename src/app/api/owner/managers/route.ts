// Owner API: Manage managers assigned to owner's buildings
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET all managers for the logged-in owner
export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig as any);
  if (!session || (session.user as any).role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = (session.user as any).id;

  try {
    // Get all buildings owned by the user
    const buildings = await prisma.building.findMany({
      where: {
        ownerId: ownerId,
      },
      select: {
        managerId: true,
      },
    });

    // Extract unique manager IDs
    const managerIds = [...new Set(buildings.map((b) => b.managerId).filter((id) => id !== null))];

    // Get manager details
    const managers = await prisma.user.findMany({
      where: {
        id: {
          in: managerIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json({ error: "Failed to fetch managers" }, { status: 500 });
  }
}

// POST a new manager
export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig as any);
  if (!session || (session.user as any).role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = (session.user as any).id;
  const body = await req.json();
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    buildingId,
  } = body;

  if (!firstName || !email || !password || !buildingId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Verify that the building belongs to the logged-in owner
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building || building.ownerId !== ownerId) {
      return NextResponse.json({ error: "Building not found or unauthorized" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newManager = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: "MANAGER",
        status: "APPROVED",
      },
    });

    // Assign manager to building
    await prisma.building.update({
      where: { id: buildingId },
      data: { managerId: newManager.id },
    });

    return NextResponse.json(newManager, { status: 201 });
  } catch (error) {
    console.error("Error creating manager:", error);
    return NextResponse.json({ error: "Failed to create manager" }, { status: 500 });
  }
}
