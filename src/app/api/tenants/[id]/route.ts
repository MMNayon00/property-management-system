import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  nidNumber: z.string().optional(),
  moveOutDate: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = (await params).id;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, phone, whatsapp, nidNumber, moveOutDate } = validation.data;

    let updatedTenant;

    if (moveOutDate) {
      // Moving out process
      if (tenant.currentFlatId) {
        // Find latest history record to set moveOutDate
        const latestHistory = await prisma.tenantHistory.findFirst({
          where: { tenantId, flatId: tenant.currentFlatId, moveOutDate: null },
          orderBy: { moveInDate: 'desc' }
        });

        if (latestHistory) {
          await prisma.tenantHistory.update({
            where: { id: latestHistory.id },
            data: { moveOutDate: new Date(moveOutDate) },
          });
        }

        // Make flat vacant
        await prisma.flat.update({
          where: { id: tenant.currentFlatId },
          data: { status: "VACANT", currentTenantId: null },
        });

        // Update tenant
        updatedTenant = await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            name, phone, whatsapp, nidNumber,
            moveOutDate: new Date(moveOutDate),
            currentFlatId: null,
          },
        });
      } else {
        // Already moved out, just update info
        updatedTenant = await prisma.tenant.update({
          where: { id: tenantId },
          data: { name, phone, whatsapp, nidNumber, moveOutDate: new Date(moveOutDate) },
        });
      }
    } else {
      // Just updating info
      updatedTenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { name, phone, whatsapp, nidNumber },
      });
    }

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = (await params).id;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    // If tenant is still occupying a flat, make it vacant
    if (tenant.currentFlatId) {
      await prisma.flat.update({
        where: { id: tenant.currentFlatId },
        data: { status: "VACANT", currentTenantId: null },
      });
    }

    await prisma.tenant.delete({ where: { id: tenantId } });

    return NextResponse.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
