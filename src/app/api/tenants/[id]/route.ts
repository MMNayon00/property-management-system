import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  nidNumber: z.string().optional(),
  moveOutDate: z.string().optional(),
  advanceAmount: z.number().optional(),
  advanceNote: z.string().optional().or(z.literal("")),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = (await params).id;
    const tenantResult = await query('SELECT * FROM "Tenant" WHERE id = $1', [tenantId]);
    const tenant = tenantResult.rows[0];

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const body = await req.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, phone, whatsapp, nidNumber, moveOutDate, advanceAmount, advanceDate, advanceReceived } = validation.data;

    let updatedTenant;

    if (moveOutDate) {
      // Moving out process
      if (tenant.currentFlatId) {
        // Find latest history record to set moveOutDate
        const historyResult = await query('SELECT * FROM "TenantHistory" WHERE "tenantId" = $1 AND "flatId" = $2 AND "moveOutDate" IS NULL ORDER BY "moveInDate" DESC LIMIT 1', [tenantId, tenant.currentFlatId]);
        const latestHistory = historyResult.rows[0];

        if (latestHistory) {
          await query('UPDATE "TenantHistory" SET "moveOutDate" = $1 WHERE id = $2', [new Date(moveOutDate), latestHistory.id]);
        }

        // Make flat vacant
        await query('UPDATE "Flat" SET status = $1, "currentTenantId" = $2, "updatedAt" = NOW() WHERE id = $3', ["VACANT", null, tenant.currentFlatId]);

        // Update tenant
        const updateResult = await query(`
          UPDATE "Tenant"
          SET name = $1, phone = $2, whatsapp = $3, "nidNumber" = $4, "advanceAmount" = $5, "advanceDate" = $6, "advanceReceived" = $7, "moveOutDate" = $8, "currentFlatId" = $9, "updatedAt" = NOW()
          WHERE id = $10
          RETURNING *
        `, [name, phone, whatsapp, nidNumber, advanceAmount !== undefined ? advanceAmount : tenant.advanceAmount, (advanceDate && advanceDate.trim() !== "") ? new Date(advanceDate) : tenant.advanceDate, advanceReceived !== undefined ? advanceReceived : tenant.advanceReceived, new Date(moveOutDate), null, tenantId]);
        updatedTenant = updateResult.rows[0];
      } else {
        // Already moved out, just update info
        const updateResult = await query(`
          UPDATE "Tenant"
          SET name = $1, phone = $2, whatsapp = $3, "nidNumber" = $4, "advanceAmount" = $5, "advanceDate" = $6, "advanceReceived" = $7, "moveOutDate" = $8, "updatedAt" = NOW()
          WHERE id = $9
          RETURNING *
        `, [name, phone, whatsapp, nidNumber, advanceAmount !== undefined ? advanceAmount : tenant.advanceAmount, (advanceDate && advanceDate.trim() !== "") ? new Date(advanceDate) : tenant.advanceDate, advanceReceived !== undefined ? advanceReceived : tenant.advanceReceived, new Date(moveOutDate), tenantId]);
        updatedTenant = updateResult.rows[0];
      }
    } else {
      // Just updating info
      const updateResult = await query(`
        UPDATE "Tenant"
        SET name = $1, phone = $2, whatsapp = $3, "nidNumber" = $4, "advanceAmount" = $5, "advanceDate" = $6, "advanceReceived" = $7, "updatedAt" = NOW()
        WHERE id = $8
        RETURNING *
      `, [name, phone, whatsapp, nidNumber, advanceAmount !== undefined ? advanceAmount : tenant.advanceAmount, (advanceDate && advanceDate.trim() !== "") ? new Date(advanceDate) : tenant.advanceDate, advanceReceived !== undefined ? advanceReceived : tenant.advanceReceived, tenantId]);
      updatedTenant = updateResult.rows[0];
    }

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
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

    const tenantId = (await params).id;
    const tenantResult = await query('SELECT * FROM "Tenant" WHERE id = $1', [tenantId]);
    const tenant = tenantResult.rows[0];

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    // If tenant is still occupying a flat, make it vacant
    if (tenant.currentFlatId) {
      await query('UPDATE "Flat" SET status = $1, "currentTenantId" = $2, "updatedAt" = NOW() WHERE id = $3', ["VACANT", null, tenant.currentFlatId]);
    }

    await query('DELETE FROM "Tenant" WHERE id = $1', [tenantId]);

    return NextResponse.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
