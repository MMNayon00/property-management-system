// Flat API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
import { z } from "zod";

const flatSchema = z.object({
  flatNumber: z.string().min(1),
  floor: z.number().optional(),
  baseRent: z.number().min(0),
  status: z.enum(["VACANT", "OCCUPIED"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const buildingId = req.nextUrl.searchParams.get("buildingId");
    if (!buildingId) return NextResponse.json({ error: "Building ID required" }, { status: 400 });

    // Verify access
    const buildingResult = await query('SELECT * FROM "Building" WHERE id = $1', [buildingId]);
    const building = buildingResult.rows[0];
    if (!building) return NextResponse.json({ error: "Building not found" }, { status: 404 });

    const { role, id } = (session as any).user;
    if (role === "OWNER" && building.ownerId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (role === "MANAGER") {
      const managerResult = await query('SELECT "ownerId" FROM "User" WHERE id = $1', [id]);
      const managerUser = managerResult.rows[0];
      if (building.ownerId !== managerUser?.ownerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const flatsResult = await query(`
      SELECT f.*, t.id as tenant_id, t.name as tenant_name, t.phone as tenant_phone, t.whatsapp, t."nidNumber", t."nidImage", t."profileImage", t."moveInDate", t."moveOutDate", t."currentFlatId", t."advanceAmount", t."advanceDate", t."advanceReceived", t.email as tenant_email, t."userId", t."createdAt" as tenant_created_at, t."updatedAt" as tenant_updated_at,
             b.id as building_id, b.name as building_name, b.address, b.area as building_area, b."totalFlats", b."ownerId", b."createdAt" as building_created_at, b."updatedAt" as building_updated_at
      FROM "Flat" f
      LEFT JOIN "Tenant" t ON f."currentTenantId" = t.id
      JOIN "Building" b ON f."buildingId" = b.id
      WHERE f."buildingId" = $1
    `, [buildingId]);

    const flats = flatsResult.rows.map(row => ({
      id: row.id,
      flatNumber: row.flatNumber,
      floor: row.floor,
      baseRent: row.baseRent,
      extraCharges: row.extraCharges,
      serviceCharges: row.serviceCharges,
      status: row.status,
      buildingId: row.buildingId,
      currentTenantId: row.currentTenantId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      currentTenant: row.tenant_id ? {
        id: row.tenant_id,
        name: row.tenant_name,
        phone: row.tenant_phone,
        whatsapp: row.whatsapp,
        nidNumber: row.nidNumber,
        nidImage: row.nidImage,
        profileImage: row.profileImage,
        moveInDate: row.moveInDate,
        moveOutDate: row.moveOutDate,
        currentFlatId: row.currentFlatId,
        advanceAmount: row.advanceAmount,
        advanceDate: row.advanceDate,
        advanceReceived: row.advanceReceived,
        email: row.tenant_email,
        userId: row.userId,
        createdAt: row.tenant_created_at,
        updatedAt: row.tenant_updated_at
      } : null,
      building: {
        id: row.building_id,
        name: row.building_name,
        address: row.address,
        area: row.building_area,
        totalFlats: row.totalFlats,
        ownerId: row.ownerId,
        createdAt: row.building_created_at,
        updatedAt: row.building_updated_at
      }
    }));

    return NextResponse.json(flats);
  } catch (error) {
    console.error("Error fetching flats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = flatSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const buildingId = req.nextUrl.searchParams.get("buildingId");
    if (!buildingId) return NextResponse.json({ error: "Building ID required" }, { status: 400 });

    const { flatNumber, floor, baseRent, status } = validation.data;

    const flatResult = await query(`
      INSERT INTO "Flat" ("id", "flatNumber", "floor", "baseRent", "extraCharges", "serviceCharges", "status", "buildingId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, 0, 0, $4, $5, NOW(), NOW())
      RETURNING *
    `, [flatNumber, floor || null, baseRent, status || "VACANT", buildingId]);

    const flat = flatResult.rows[0];

    return NextResponse.json(flat, { status: 201 });
  } catch (error) {
    console.error("Error creating flat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
