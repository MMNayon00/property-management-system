// Manager API: Mark rent record as paid
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

    const rentRecordId = id;
    const managerId = (session as any).user.id as string;

    // Check if the rent record belongs to a building managed by this manager
    const rentRecord = await prisma.rentRecord.findUnique({
      where: { id: rentRecordId },
      select: {
        id: true,
        total: true,
        building: {
          select: {
            managerId: true,
          },
        },
      },
    });

    if (!rentRecord) {
      return NextResponse.json({ error: "Rent record not found" }, { status: 404 });
    }

    if (rentRecord.building.managerId !== managerId) {
      return NextResponse.json({ error: "Unauthorized to manage this rent record" }, { status: 403 });
    }

    // Mark as paid
    const result = await prisma.rentRecord.update({
      where: { id: rentRecordId },
      data: { paymentStatus: "PAID" },
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error marking rent as paid:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}