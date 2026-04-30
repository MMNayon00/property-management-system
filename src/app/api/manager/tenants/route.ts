// Manager API: Manage tenants in assigned buildings
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  nidNumber: z.string().optional(),
  flatId: z.string().min(1),
  moveInDate: z.string().min(1),
});

const updateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  nidNumber: z.string().optional(),
  flatId: z.string().min(1),
  moveInDate: z.string().min(1),
});

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

    // Get tenants from managed buildings
    const tenants = await prisma.tenant.findMany({
      where: {
        currentFlat: {
          buildingId: { in: buildingIds },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        whatsapp: true,
        nidNumber: true,
        moveInDate: true,
        currentFlat: {
          select: {
            id: true,
            flatNumber: true,
            building: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedTenants = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      whatsapp: tenant.whatsapp,
      nidNumber: tenant.nidNumber,
      moveInDate: tenant.moveInDate?.toISOString().split('T')[0] || null,
      flatNumber: tenant.currentFlat?.flatNumber || "",
      buildingName: tenant.currentFlat?.building?.name || "",
      flatId: tenant.currentFlat?.id || "",
    }));

    return NextResponse.json(formattedTenants);

  } catch (error) {
    console.error("Error fetching manager tenants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session as any).user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createSchema.parse(body);

    const managerId = (session as any).user.id as string;

    // Check if the flat belongs to a building managed by this manager
    const flat = await prisma.flat.findUnique({
      where: { id: validatedData.flatId },
      select: {
        id: true,
        status: true,
        baseRent: true,
        building: {
          select: {
            id: true,
            managerId: true,
          },
        },
      },
    });

    if (!flat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    if (flat.building.managerId !== managerId) {
      return NextResponse.json({ error: "Unauthorized to manage this flat" }, { status: 403 });
    }

    if (flat.status === "OCCUPIED") {
      return NextResponse.json({ error: "Flat is already occupied" }, { status: 400 });
    }

    // Create tenant and update flat
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: validatedData.name,
          phone: validatedData.phone || null,
          whatsapp: validatedData.whatsapp || null,
          nidNumber: validatedData.nidNumber || null,
          moveInDate: new Date(validatedData.moveInDate),
          currentFlatId: validatedData.flatId,
        },
      });

      await tx.flat.update({
        where: { id: validatedData.flatId },
        data: { status: "OCCUPIED" },
      });

      // Create tenant history
      await tx.tenantHistory.create({
        data: {
          tenantId: tenant.id,
          flatId: validatedData.flatId,
          moveInDate: new Date(validatedData.moveInDate),
          rentAmount: flat.baseRent,
        },
      });

      return tenant;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error creating tenant:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}