// Manager API: Manage payments for a rent record
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentSchema = z.object({
  amount: z.number().min(1),
  method: z.string().optional(),
  reference: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
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

    // Get payments for this rent record
    const payments = await prisma.payment.findMany({
      where: { rentRecordId },
      select: {
        id: true,
        amount: true,
        method: true,
        reference: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);

  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const body = await req.json();
    const validatedData = createPaymentSchema.parse(body);

    const managerId = (session as any).user.id as string;

    // Check if the rent record belongs to a building managed by this manager
    const rentRecord = await prisma.rentRecord.findUnique({
      where: { id: rentRecordId },
      select: {
        id: true,
        flatId: true,
        buildingId: true,
        total: true,
        paymentStatus: true,
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

    // Calculate current total payments
    const currentPayments = await prisma.payment.aggregate({
      where: { rentRecordId },
      _sum: { amount: true },
    });

    const totalPaid = (currentPayments._sum.amount || 0) + validatedData.amount;

    // Determine new payment status
    let newStatus = rentRecord.paymentStatus;
    if (totalPaid >= rentRecord.total) {
      newStatus = "PAID";
    } else if (totalPaid > 0) {
      newStatus = "PARTIAL";
    }

    // Create payment and update rent record status
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          rentRecordId,
          flatId: rentRecord.flatId,
          buildingId: rentRecord.buildingId,
          amount: validatedData.amount,
          method: validatedData.method,
          reference: validatedData.reference,
          createdById: managerId,
        },
      });

      // Update rent record status
      await tx.rentRecord.update({
        where: { id: rentRecordId },
        data: { paymentStatus: newStatus },
      });

      return payment;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}