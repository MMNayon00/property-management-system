// Rent API: Manage rent records and calculations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = req.nextUrl.searchParams.get("flatId");
    const month = req.nextUrl.searchParams.get("month"); // Now a string "YYYY-MM"
    const status = req.nextUrl.searchParams.get("status"); // Payment status filter

    const where: any = {};
    if (flatId) {
      where.flatId = flatId;
    } else {
      where.flat = {
        building: {
          ownerId: (session as any).user.id
        }
      };
    }
    if (month) where.month = month;
    if (status) where.paymentStatus = status;

    const rentRecords = await prisma.rentRecord.findMany({
      where,
      include: { 
        payments: true,
        flat: {
          include: {
            building: true
          }
        }
      },
      orderBy: { month: "desc" },
    });

    return NextResponse.json(rentRecords);
  } catch (error) {
    console.error("Error fetching rent records:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { flatId, buildingId, month, baseRent, extraCharges, serviceCharges } = body;

    if (!flatId || !buildingId || !month || baseRent === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const total = baseRent + (extraCharges || 0) + (serviceCharges || 0);

    const totalAmount = baseRent + (extraCharges || 0) + (serviceCharges || 0);

    // Find the current tenant for this flat if not already known
    const flat = await prisma.flat.findUnique({
      where: { id: flatId },
      select: { currentTenantId: true }
    });

    // Use upsert to create or update
    const rentRecord = await prisma.rentRecord.upsert({
      where: { flatId_month: { flatId, month } },
      update: {
        baseRent,
        extraCharges: extraCharges || 0,
        serviceCharges: serviceCharges || 0,
        totalAmount,
        // We will update dueAmount in the next step
      },
      create: {
        flatId,
        buildingId,
        month,
        baseRent,
        extraCharges: extraCharges || 0,
        serviceCharges: serviceCharges || 0,
        totalAmount,
        dueAmount: totalAmount,
        tenantId: flat?.currentTenantId || null,
      },
    });
    
    // Also update the Flat model to store these as the new recurring standards
    await prisma.flat.update({
      where: { id: flatId },
      data: {
        baseRent,
        extraCharges: extraCharges || 0,
        serviceCharges: serviceCharges || 0,
      }
    });

    // Recalculate balances (in case of updates to existing records)
    const { updateRentRecordBalances } = await import("@/lib/services/rent-tracker");
    await updateRentRecordBalances(rentRecord.id);

    // Fetch the final record to return
    const finalRecord = await prisma.rentRecord.findUnique({
      where: { id: rentRecord.id },
      include: { payments: true }
    });

    return NextResponse.json(finalRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating rent record:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
