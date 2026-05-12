import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
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
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = (await params).id;
    const flatResult = await query(`
      SELECT f.*, b."ownerId"
      FROM "Flat" f
      JOIN "Building" b ON f."buildingId" = b.id
      WHERE f.id = $1
    `, [flatId]);
    const flat = flatResult.rows[0];

    if (!flat) return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    if ((session as any).user.role === "OWNER" && flat.ownerId !== (session as any).user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (validation.data.flatNumber !== undefined) {
      updateFields.push(`"flatNumber" = $${paramIndex++}`);
      values.push(validation.data.flatNumber);
    }
    if (validation.data.floor !== undefined) {
      updateFields.push(`"floor" = $${paramIndex++}`);
      values.push(validation.data.floor);
    }
    if (validation.data.baseRent !== undefined) {
      updateFields.push(`"baseRent" = $${paramIndex++}`);
      values.push(validation.data.baseRent);
    }
    if (validation.data.status !== undefined) {
      updateFields.push(`"status" = $${paramIndex++}`);
      values.push(validation.data.status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(flat);
    }

    values.push(flatId);
    const updateResult = await query(`
      UPDATE "Flat"
      SET ${updateFields.join(', ')}, "updatedAt" = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    const updated = updateResult.rows[0];

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
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = (await params).id;
    const flatResult = await query(`
      SELECT f.*, b."ownerId"
      FROM "Flat" f
      JOIN "Building" b ON f."buildingId" = b.id
      WHERE f.id = $1
    `, [flatId]);
    const flat = flatResult.rows[0];

    if (!flat) return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    if ((session as any).user.role === "OWNER" && flat.ownerId !== (session as any).user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await query('DELETE FROM "Flat" WHERE id = $1', [flatId]);

    return NextResponse.json({ message: "Flat deleted successfully" });
  } catch (error) {
    console.error("Error deleting flat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
