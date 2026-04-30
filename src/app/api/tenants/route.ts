// Tenant API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tenantSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  nidNumber: z.string().optional(),
  moveInDate: z.string(),
  flatId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = req.nextUrl.searchParams.get("flatId");

    let tenants;

    if (flatId) {
      tenants = await prisma.tenant.findMany({
        where: { currentFlatId: flatId },
        include: { history: true, currentFlat: { include: { building: true } } },
      });
    } else {
      const { role, id } = (session as any).user;
      const buildingFilter: any = {};
      
      if (role === "MANAGER") {
        buildingFilter.managerId = id;
      } else if (role === "OWNER") {
        buildingFilter.ownerId = id;
      }
      // If role is ADMIN, buildingFilter remains empty {} which returns all

      tenants = await prisma.tenant.findMany({
        where: {
          currentFlat: {
            building: buildingFilter,
          },
        },
        include: { history: true, currentFlat: { include: { building: true } } },
      });
    }

    return NextResponse.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = tenantSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, phone, whatsapp, nidNumber, moveInDate, flatId } = validation.data;

    // Verify flat is available
    const targetFlat = await prisma.flat.findUnique({ where: { id: flatId } });
    if (!targetFlat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }
    if (targetFlat.status === "OCCUPIED") {
      return NextResponse.json({ error: "This flat is already occupied" }, { status: 400 });
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        phone: phone || null,
        whatsapp: whatsapp || null,
        nidNumber: nidNumber || null,
        moveInDate: new Date(moveInDate),
        currentFlatId: flatId,
      },
    });

    // Create tenant history entry
    await prisma.tenantHistory.create({
      data: {
        tenantId: tenant.id,
        flatId,
        moveInDate: new Date(moveInDate),
        rentAmount: targetFlat.baseRent,
      },
    });

    // Update flat status to occupied
    await prisma.flat.update({
      where: { id: flatId },
      data: { status: "OCCUPIED", currentTenantId: tenant.id },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
