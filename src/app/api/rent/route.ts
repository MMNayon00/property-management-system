// Rent API: Manage rent records and calculations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = req.nextUrl.searchParams.get("flatId");
    const year = req.nextUrl.searchParams.get("year");
    const month = req.nextUrl.searchParams.get("month");

    const where: any = {};
    if (flatId) {
      where.flatId = flatId;
    } else {
      where.flat = {
        building: {
          ownerId: session.user.id
        }
      };
    }
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

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
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { flatId, buildingId, year, month, baseRent, extraCharges, serviceCharges } = body;

    if (!flatId || !buildingId || !year || !month || baseRent === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const total = baseRent + (extraCharges || 0) + (serviceCharges || 0);

    // Check if record exists
    const existing = await prisma.rentRecord.findUnique({
      where: { flatId_year_month: { flatId, year: parseInt(year), month: parseInt(month) } },
    });

    if (existing) {
      return NextResponse.json({ error: "Rent record already exists" }, { status: 409 });
    }

    const rentRecord = await prisma.rentRecord.create({
      data: {
        flatId,
        buildingId,
        year: parseInt(year),
        month: parseInt(month),
        baseRent,
        extraCharges: extraCharges || 0,
        serviceCharges: serviceCharges || 0,
        total,
      },
    });

    return NextResponse.json(rentRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating rent record:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
