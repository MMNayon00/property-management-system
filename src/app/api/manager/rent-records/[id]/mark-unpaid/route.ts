// Manager API: Mark rent record as unpaid
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
    const managerUser = await prisma.user.findUnique({ where: { id: managerId } });
    const ownerId = managerUser?.ownerId;

    if (!ownerId) {
      return NextResponse.json({ error: "Manager not associated with any owner" }, { status: 403 });
    }

    // Check if the rent record belongs to a building managed by this manager
    const rentRecord = await prisma.rentRecord.findUnique({
      where: { id: rentRecordId },
      select: {
        id: true,
        building: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!rentRecord) {
      return NextResponse.json({ error: "Rent record not found" }, { status: 404 });
    }

    if (rentRecord.building.ownerId !== ownerId) {
      return NextResponse.json({ error: "Unauthorized to manage this rent record" }, { status: 403 });
    }

    // Mark as unpaid
    const result = await prisma.rentRecord.update({
      where: { id: rentRecordId },
      data: { paymentStatus: "UNPAID" },
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error marking rent as unpaid:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}