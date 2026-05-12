// Tenant API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
import { z } from "zod";

const tenantSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  nidNumber: z.string().optional().or(z.literal("")),
  moveInDate: z.string(),
  flatId: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  advanceAmount: z.number().optional().default(0),
  advanceNote: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const flatId = req.nextUrl.searchParams.get("flatId");

    let tenants;

    if (flatId) {
      const tenantsResult = await query(`
        SELECT t.id, t.name, t.phone, t.whatsapp, t."nidNumber", t."nidImage", t."profileImage", t."moveInDate", t."moveOutDate", t."currentFlatId", t."advanceAmount", t."advanceDate", t."advanceReceived", t.email, t."userId", t."createdAt", t."updatedAt",
               f.id as flat_id, f."flatNumber", f.floor, f."baseRent", f."extraCharges", f."serviceCharges", f.status, f."buildingId", f."currentTenantId", f."createdAt" as flat_created_at, f."updatedAt" as flat_updated_at,
               b.id as building_id, b.name as building_name, b.address, b.area, b."totalFlats", b."ownerId", b."createdAt" as building_created_at, b."updatedAt" as building_updated_at,
               th.id as history_id, th."tenantId", th."flatId" as history_flat_id, th."moveInDate" as history_move_in, th."moveOutDate" as history_move_out, th."rentAmount", th."createdAt" as history_created_at
        FROM "Tenant" t
        LEFT JOIN "Flat" f ON t."currentFlatId" = f.id
        LEFT JOIN "Building" b ON f."buildingId" = b.id
        LEFT JOIN "TenantHistory" th ON th."tenantId" = t.id
        WHERE t."currentFlatId" = $1
      `, [flatId]);

      // Group by tenant and collect history
      const tenantMap = new Map();
      tenantsResult.rows.forEach(row => {
        const tenantId = row.id;
        if (!tenantMap.has(tenantId)) {
          tenantMap.set(tenantId, {
            id: row.id,
            name: row.name,
            phone: row.phone,
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
            email: row.email,
            userId: row.userId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            history: [],
            currentFlat: row.currentFlatId ? {
              id: row.flat_id,
              flatNumber: row.flatNumber,
              floor: row.floor,
              baseRent: row.baseRent,
              extraCharges: row.extraCharges,
              serviceCharges: row.serviceCharges,
              status: row.status,
              buildingId: row.buildingId,
              currentTenantId: row.currentTenantId,
              createdAt: row.flat_created_at,
              updatedAt: row.flat_updated_at,
              building: {
                id: row.building_id,
                name: row.building_name,
                address: row.address,
                area: row.area,
                totalFlats: row.totalFlats,
                ownerId: row.ownerId,
                createdAt: row.building_created_at,
                updatedAt: row.building_updated_at
              }
            } : null
          });
        }
        if (row.history_id) {
          tenantMap.get(tenantId).history.push({
            id: row.history_id,
            tenantId: row.tenantId,
            flatId: row.history_flat_id,
            moveInDate: row.history_move_in,
            moveOutDate: row.history_move_out,
            rentAmount: row.rentAmount,
            createdAt: row.history_created_at
          });
        }
      });
      tenants = Array.from(tenantMap.values());
    } else {
      const { role, id } = (session as any).user;
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (role === "MANAGER") {
        const managerResult = await query('SELECT "ownerId" FROM "User" WHERE id = $1', [id]);
        const ownerId = managerResult.rows[0]?.ownerId;
        whereClause = 'WHERE b."ownerId" = $1';
        params = [ownerId];
        paramIndex = 2;
      } else if (role === "OWNER") {
        whereClause = 'WHERE b."ownerId" = $1';
        params = [id];
        paramIndex = 2;
      }
      // If role is ADMIN, no where clause

      const tenantsResult = await query(`
        SELECT t.id, t.name, t.phone, t.whatsapp, t."nidNumber", t."nidImage", t."profileImage", t."moveInDate", t."moveOutDate", t."currentFlatId", t."advanceAmount", t."advanceDate", t."advanceReceived", t.email, t."userId", t."createdAt", t."updatedAt",
               f.id as flat_id, f."flatNumber", f.floor, f."baseRent", f."extraCharges", f."serviceCharges", f.status, f."buildingId", f."currentTenantId", f."createdAt" as flat_created_at, f."updatedAt" as flat_updated_at,
               b.id as building_id, b.name as building_name, b.address, b.area, b."totalFlats", b."ownerId", b."createdAt" as building_created_at, b."updatedAt" as building_updated_at,
               th.id as history_id, th."tenantId", th."flatId" as history_flat_id, th."moveInDate" as history_move_in, th."moveOutDate" as history_move_out, th."rentAmount", th."createdAt" as history_created_at
        FROM "Tenant" t
        LEFT JOIN "Flat" f ON t."currentFlatId" = f.id
        LEFT JOIN "Building" b ON f."buildingId" = b.id
        LEFT JOIN "TenantHistory" th ON th."tenantId" = t.id
        ${whereClause}
      `, params);

      // Same grouping logic
      const tenantMap = new Map();
      tenantsResult.rows.forEach(row => {
        const tenantId = row.id;
        if (!tenantMap.has(tenantId)) {
          tenantMap.set(tenantId, {
            id: row.id,
            name: row.name,
            phone: row.phone,
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
            email: row.email,
            userId: row.userId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            history: [],
            currentFlat: row.currentFlatId ? {
              id: row.id_1,
              flatNumber: row.flatNumber,
              floor: row.floor,
              baseRent: row.baseRent,
              extraCharges: row.extraCharges,
              serviceCharges: row.serviceCharges,
              status: row.status,
              buildingId: row.buildingId,
              currentTenantId: row.currentTenantId,
              createdAt: row.createdAt_1,
              updatedAt: row.updatedAt_1,
              building: {
                id: row.id_2,
                name: row.name_1,
                address: row.address,
                area: row.area,
                totalFlats: row.totalFlats,
                ownerId: row.ownerId,
                createdAt: row.createdAt_2,
                updatedAt: row.updatedAt_2
              }
            } : null
          });
        }
        if (row.id_3) {
          tenantMap.get(tenantId).history.push({
            id: row.id_3,
            tenantId: row.tenantId,
            flatId: row.flatId_1,
            moveInDate: row.moveInDate_1,
            moveOutDate: row.moveOutDate_1,
            rentAmount: row.rentAmount,
            createdAt: row.createdAt_3
          });
        }
      });
      tenants = Array.from(tenantMap.values());
    }

    return NextResponse.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = tenantSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, phone, whatsapp, nidNumber, moveInDate, flatId, email, advanceAmount, advanceDate, advanceReceived } = validation.data;

    // Verify flat is available
    const targetFlatResult = await query('SELECT * FROM "Flat" WHERE id = $1', [flatId]);
    const targetFlat = targetFlatResult.rows[0];
    if (!targetFlat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }
    if (targetFlat.status === "OCCUPIED") {
      return NextResponse.json({ error: "This flat is already occupied" }, { status: 400 });
    }

    // Handle User account creation/linking
    let userId = null;
    const cleanEmail = email?.trim() || null;
    const cleanPhone = phone?.trim() || null;

    if (cleanEmail || cleanPhone) {
      // Check if user already exists
      let existingUser = null;
      if (cleanEmail && cleanPhone) {
        const userResult = await query('SELECT * FROM "User" WHERE email = $1 OR phone = $2', [cleanEmail, cleanPhone]);
        existingUser = userResult.rows[0];
      } else if (cleanEmail) {
        const userResult = await query('SELECT * FROM "User" WHERE email = $1', [cleanEmail]);
        existingUser = userResult.rows[0];
      } else if (cleanPhone) {
        const userResult = await query('SELECT * FROM "User" WHERE phone = $1', [cleanPhone]);
        existingUser = userResult.rows[0];
      }

      if (existingUser) {
        userId = existingUser.id;
        // Update role if not already tenant
        if (existingUser.role !== "TENANT" && existingUser.role !== "OWNER" && existingUser.role !== "ADMIN") {
           await query('UPDATE "User" SET role = $1, "updatedAt" = NOW() WHERE id = $2', ["TENANT", existingUser.id]);
        }
      } else {
        // Create new user
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash("tenant123", 10);
        
        const userResult = await query(`
          INSERT INTO "User" ("id", "email", "firstName", "phone", "password", "role", "status", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING *
        `, [cleanEmail || `${cleanPhone || Date.now()}@tenant.com`, name, cleanPhone || null, hashedPassword, "TENANT", "APPROVED"]);
        userId = userResult.rows[0].id;
      }
    }

    // Create or Update tenant
    let tenant;
    let existingTenant = null;
    if (userId) {
      const tenantResult = await query('SELECT * FROM "Tenant" WHERE "userId" = $1', [userId]);
      existingTenant = tenantResult.rows[0];
    }

    if (existingTenant) {
      // Update existing tenant's flat
      const updateResult = await query(`
        UPDATE "Tenant"
        SET name = $1, phone = $2, whatsapp = $3, "nidNumber" = $4, "moveInDate" = $5, "currentFlatId" = $6, email = $7, "advanceAmount" = $8, "advanceDate" = $9, "advanceReceived" = $10, "updatedAt" = NOW()
        WHERE id = $11
        RETURNING *
      `, [name, cleanPhone || existingTenant.phone, whatsapp || existingTenant.whatsapp, nidNumber || existingTenant.nidNumber, new Date(moveInDate), flatId, cleanEmail || existingTenant.email, advanceAmount !== undefined ? advanceAmount : existingTenant.advanceAmount, (advanceDate && advanceDate.trim() !== "") ? new Date(advanceDate) : existingTenant.advanceDate, advanceReceived !== undefined ? advanceReceived : existingTenant.advanceReceived, existingTenant.id]);
      tenant = updateResult.rows[0];
    } else {
      // Create new tenant
      const tenantResult = await query(`
        INSERT INTO "Tenant" ("id", "name", "phone", "whatsapp", "nidNumber", "moveInDate", "currentFlatId", "email", "userId", "advanceAmount", "advanceDate", "advanceReceived", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `, [name, cleanPhone || null, whatsapp || null, nidNumber || null, new Date(moveInDate), flatId, cleanEmail || null, userId, advanceAmount || 0, (advanceDate && advanceDate.trim() !== "") ? new Date(advanceDate) : null, advanceReceived || false]);
      tenant = tenantResult.rows[0];
    }

    // Create tenant history entry
    await query(`
      INSERT INTO "TenantHistory" ("id", "tenantId", "flatId", "moveInDate", "rentAmount", "createdAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())
    `, [tenant.id, flatId, new Date(moveInDate), targetFlat.baseRent]);

    // Update flat status to occupied
    await query('UPDATE "Flat" SET status = $1, "currentTenantId" = $2, "updatedAt" = NOW() WHERE id = $3', ["OCCUPIED", tenant.id, flatId]);

    // Link any existing unlinked rent records for this flat to the new tenant
    await query('UPDATE "RentRecord" SET "tenantId" = $1 WHERE "flatId" = $2 AND "tenantId" IS NULL', [tenant.id, flatId]);

    // Automatically generate missing rent records for this tenant
    const { generateMonthlyRentRecords } = await import("@/lib/services/rent-tracker");
    await generateMonthlyRentRecords();

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
