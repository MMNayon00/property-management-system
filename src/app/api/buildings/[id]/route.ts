import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  area: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const buildingId = (await params).id;
    const building = await prisma.building.findUnique({ where: { id: buildingId } });

    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });
    if (session.user.role === "OWNER" && building.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.building.update({
      where: { id: buildingId },
      data: validation.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating building:", error);
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

    const buildingId = (await params).id;
    const building = await prisma.building.findUnique({ where: { id: buildingId } });

    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });
    if (session.user.role === "OWNER" && building.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.building.delete({ where: { id: buildingId } });

    return NextResponse.json({ message: "Building deleted successfully" });
  } catch (error) {
    console.error("Error deleting building:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
