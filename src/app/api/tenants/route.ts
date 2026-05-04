// Tenant API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tenantSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  nidNumber: z.string().optional().or(z.literal("")),
  moveInDate: z.string(),
  flatId: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  advanceAmount: z.number().optional().default(0),
  advanceNote: z.string().optional().or(z.literal("")),
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
        const managerUser = await prisma.user.findUnique({ where: { id } });
        buildingFilter.ownerId = managerUser?.ownerId;
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

    const { name, phone, whatsapp, nidNumber, moveInDate, flatId, email, advanceAmount, advanceDate, advanceReceived } = validation.data;

    // Verify flat is available
    const targetFlat = await prisma.flat.findUnique({ where: { id: flatId } });
    if (!targetFlat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }
    if (targetFlat.status === "OCCUPIED") {
      return NextResponse.json({ error: "This flat is already occupied" }, { status: 400 });
    }

    // Handle User account creation/linking
    let userId = null;
    const cleanEmail = email?.trim() || null;
    const cleanPhone = phone?.trim() || null;

    if (cleanEmail || cleanPhone) {
      // Check if user already exists
      let existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
        },
      });

      if (existingUser) {
        userId = existingUser.id;
        // Update role if not already tenant
        if (existingUser.role !== "TENANT" && existingUser.role !== "OWNER" && existingUser.role !== "ADMIN") {
           await prisma.user.update({
             where: { id: existingUser.id },
             data: { role: "TENANT" }
           });
        }
      } else {
        // Create new user
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash("tenant123", 10);
        
        const user = await prisma.user.create({
          data: {
            email: cleanEmail || `${cleanPhone || Date.now()}@tenant.com`,
            firstName: name,
            phone: cleanPhone || null,
            password: hashedPassword,
            role: "TENANT",
            status: "APPROVED",
          }
        });
        userId = user.id;
      }
    }

    // Create or Update tenant
    let tenant;
    const existingTenant = userId ? await prisma.tenant.findUnique({ where: { userId } }) : null;

    if (existingTenant) {
      // Update existing tenant's flat
      tenant = await prisma.tenant.update({
        where: { id: existingTenant.id },
        data: {
          name,
          phone: cleanPhone || existingTenant.phone,
          whatsapp: whatsapp || existingTenant.whatsapp,
          nidNumber: nidNumber || existingTenant.nidNumber,
          moveInDate: new Date(moveInDate),
          currentFlatId: flatId,
          email: cleanEmail || existingTenant.email,
          advanceAmount: advanceAmount !== undefined ? advanceAmount : existingTenant.advanceAmount,
          advanceDate: (advanceDate && advanceDate.trim() !== "") ? new Date(advanceDate) : existingTenant.advanceDate,
          advanceReceived: advanceReceived !== undefined ? advanceReceived : existingTenant.advanceReceived,
        }
      });
    } else {
      // Create new tenant
      tenant = await prisma.tenant.create({
        data: {
          name,
          phone: cleanPhone || null,
          whatsapp: whatsapp || null,
          nidNumber: nidNumber || null,
          moveInDate: new Date(moveInDate),
          currentFlatId: flatId,
          email: cleanEmail || null,
          userId: userId,
          advanceAmount: advanceAmount || 0,
          advanceDate: (advanceDate && advanceDate.trim() !== "") ? new Date(advanceDate) : null,
          advanceReceived: advanceReceived || false,
        },
      });
    }

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

    // Link any existing unlinked rent records for this flat to the new tenant
    await prisma.rentRecord.updateMany({
      where: {
        flatId,
        tenantId: null,
      },
      data: {
        tenantId: tenant.id,
      },
    });

    // Automatically generate missing rent records for this tenant
    const { generateMonthlyRentRecords } = await import("@/lib/services/rent-tracker");
    await generateMonthlyRentRecords();

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
