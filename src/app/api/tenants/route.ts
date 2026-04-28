// Tenant API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
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
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = req.nextUrl.searchParams.get("flatId");
    if (!flatId) return NextResponse.json({ error: "Flat ID required" }, { status: 400 });

    const tenants = await prisma.tenant.findMany({
      where: { currentFlatId: flatId },
      include: { history: true },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = tenantSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { name, phone, whatsapp, nidNumber, moveInDate, flatId } = validation.data;

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
    const flat = await prisma.flat.findUnique({ where: { id: flatId } });
    if (flat) {
      await prisma.tenantHistory.create({
        data: {
          tenantId: tenant.id,
          flatId,
          moveInDate: new Date(moveInDate),
          rentAmount: flat.baseRent,
        },
      });

      // Update flat status to occupied
      await prisma.flat.update({
        where: { id: flatId },
        data: { status: "OCCUPIED", currentTenantId: tenant.id },
      });
    }

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
