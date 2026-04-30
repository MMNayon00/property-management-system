// Manager API: Update individual tenant
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  nidNumber: z.string().optional(),
  flatId: z.string().min(1),
  moveInDate: z.string().min(1),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session as any).user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = id;
    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    const managerId = (session as any).user.id as string;

    // Check if the tenant belongs to a building managed by this manager
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        currentFlat: {
          select: {
            id: true,
            building: {
              select: {
                managerId: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (tenant.currentFlat?.building.managerId !== managerId) {
      return NextResponse.json({ error: "Unauthorized to manage this tenant" }, { status: 403 });
    }

    // Check if the new flat belongs to a building managed by this manager
    if (validatedData.flatId !== tenant.currentFlat.id) {
      const newFlat = await prisma.flat.findUnique({
        where: { id: validatedData.flatId },
        select: {
          status: true,
          building: {
            select: {
              managerId: true,
            },
          },
        },
      });

      if (!newFlat) {
        return NextResponse.json({ error: "New flat not found" }, { status: 404 });
      }

      if (newFlat.building.managerId !== managerId) {
        return NextResponse.json({ error: "Unauthorized to manage new flat" }, { status: 403 });
      }

      if (newFlat.status === "OCCUPIED") {
        return NextResponse.json({ error: "New flat is already occupied" }, { status: 400 });
      }
    }

    // Update tenant
    const result = await prisma.$transaction(async (tx) => {
      // If flat changed, update flat statuses
      if (validatedData.flatId !== tenant.currentFlat!.id) {
        // Mark old flat as vacant
        await tx.flat.update({
          where: { id: tenant.currentFlat!.id },
          data: { status: "VACANT" },
        });

        // Mark new flat as occupied
        await tx.flat.update({
          where: { id: validatedData.flatId },
          data: { status: "OCCUPIED" },
        });

        // Update tenant history
        await tx.tenantHistory.updateMany({
          where: {
            tenantId,
            moveOutDate: null,
          },
          data: {
            moveOutDate: new Date(),
          },
        });

        // Get the new flat's rent amount
        const newFlat = await tx.flat.findUnique({
          where: { id: validatedData.flatId },
          select: { baseRent: true },
        });

        if (!newFlat) {
          throw new Error("New flat not found");
        }

        await tx.tenantHistory.create({
          data: {
            tenantId,
            flatId: validatedData.flatId,
            moveInDate: new Date(validatedData.moveInDate),
            rentAmount: newFlat.baseRent,
          },
        });
      }

      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: validatedData.name,
          phone: validatedData.phone || null,
          whatsapp: validatedData.whatsapp || null,
          nidNumber: validatedData.nidNumber || null,
          moveInDate: new Date(validatedData.moveInDate),
          currentFlatId: validatedData.flatId,
        },
      });

      return updatedTenant;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error updating tenant:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}