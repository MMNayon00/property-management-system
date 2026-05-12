import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
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
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const buildingId = (await params).id;
    const buildingResult = await query('SELECT * FROM "Building" WHERE id = $1', [buildingId]);
    const building = buildingResult.rows[0];

    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });
    if ((session as any).user.role === "OWNER" && building.ownerId !== (session as any).user.id) {
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

    if (validation.data.name !== undefined) {
      updateFields.push(`"name" = $${paramIndex++}`);
      values.push(validation.data.name);
    }
    if (validation.data.address !== undefined) {
      updateFields.push(`"address" = $${paramIndex++}`);
      values.push(validation.data.address);
    }
    if (validation.data.area !== undefined) {
      updateFields.push(`"area" = $${paramIndex++}`);
      values.push(validation.data.area);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(building);
    }

    values.push(buildingId);
    const updateResult = await query(`
      UPDATE "Building"
      SET ${updateFields.join(', ')}, "updatedAt" = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    const updated = updateResult.rows[0];

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
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const buildingId = (await params).id;
    const buildingResult = await query('SELECT * FROM "Building" WHERE id = $1', [buildingId]);
    const building = buildingResult.rows[0];

    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });
    if ((session as any).user.role === "OWNER" && building.ownerId !== (session as any).user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await query('DELETE FROM "Building" WHERE id = $1', [buildingId]);

    return NextResponse.json({ message: "Building deleted successfully" });
  } catch (error) {
    console.error("Error deleting building:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
