import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  flatNumber: z.string().min(1).optional(),
  floor: z.number().optional(),
  baseRent: z.number().min(0).optional(),
  status: z.enum(["VACANT", "OCCUPIED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = (await params).id;
    const flat = await prisma.flat.findUnique({ 
      where: { id: flatId },
      include: { building: true }
    });

    if (!flat) return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    if (session.user.role === "OWNER" && flat.building.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.flat.update({
      where: { id: flatId },
      data: validation.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating flat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = (await params).id;
    const flat = await prisma.flat.findUnique({ 
      where: { id: flatId },
      include: { building: true }
    });

    if (!flat) return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    if (session.user.role === "OWNER" && flat.building.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.flat.delete({ where: { id: flatId } });

    return NextResponse.json({ message: "Flat deleted successfully" });
  } catch (error) {
    console.error("Error deleting flat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
