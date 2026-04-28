// Payment API: Record and manage payments
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paymentSchema = z.object({
  rentRecordId: z.string(),
  flatId: z.string(),
  buildingId: z.string(),
  amount: z.number().min(0),
  method: z.string().optional(),
  reference: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rentRecordId = req.nextUrl.searchParams.get("rentRecordId");
    const flatId = req.nextUrl.searchParams.get("flatId");

    const where: {
      rentRecordId?: string;
      flatId?: string;
    } = {};
    if (rentRecordId) where.rentRecordId = rentRecordId;
    if (flatId) where.flatId = flatId;

    const payments = await prisma.payment.findMany({
      where,
      include: { rentRecord: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = paymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { rentRecordId, flatId, buildingId, amount, method, reference } = validation.data;

    // Get rent record
    const rentRecord = await prisma.rentRecord.findUnique({
      where: { id: rentRecordId },
      include: { payments: true },
    });

    if (!rentRecord) {
      return NextResponse.json({ error: "Rent record not found" }, { status: 404 });
    }

    // Calculate total paid
    const totalPaid = rentRecord.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
    const newStatus = totalPaid >= rentRecord.total ? "PAID" : "PARTIAL";

    // Record payment
    const payment = await prisma.payment.create({
      data: {
        rentRecordId,
        flatId,
        buildingId,
        amount,
        method: method || null,
        reference: reference || null,
        createdById: session.user.id,
      },
    });

    // Update rent record status if fully paid
    if (newStatus === "PAID") {
      await prisma.rentRecord.update({
        where: { id: rentRecordId },
        data: { paymentStatus: "PAID" },
      });
    } else if (totalPaid > 0) {
      await prisma.rentRecord.update({
        where: { id: rentRecordId },
        data: { paymentStatus: "PARTIAL" },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
