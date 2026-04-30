// Manager API: Move out tenant
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    // Move out tenant
    const result = await prisma.$transaction(async (tx) => {
      const moveOutDate = new Date();

      // Update tenant
      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          moveOutDate,
          currentFlatId: null,
        },
      });

      // Mark flat as vacant
      await tx.flat.update({
        where: { id: tenant.currentFlat!.id },
        data: { status: "VACANT" },
      });

      // Update tenant history
      await tx.tenantHistory.updateMany({
        where: {
          tenantId,
          moveOutDate: null,
        },
        data: {
          moveOutDate,
        },
      });

      return updatedTenant;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error moving out tenant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}