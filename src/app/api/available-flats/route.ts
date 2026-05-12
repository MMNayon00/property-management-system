import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let buildingsResult;
    if (role === "ADMIN") {
      // Admins see all buildings with vacant flats
      buildingsResult = await query(`
        SELECT b.*, 
               json_agg(json_build_object(
                 'id', f.id,
                 'flatNumber', f."flatNumber",
                 'floor', f.floor,
                 'baseRent', f."baseRent",
                 'status', f.status,
                 'buildingId', f."buildingId",
                 'currentTenantId', f."currentTenantId",
                 'createdAt', f."createdAt",
                 'updatedAt', f."updatedAt"
               ) ORDER BY f."flatNumber") as flats
        FROM "Building" b
        JOIN "Flat" f ON b.id = f."buildingId" AND f.status = 'VACANT'
        GROUP BY b.id
        ORDER BY b.name
      `);
    } else if (role === "MANAGER") {
      // Managers see buildings they manage that have vacant flats
      const managerResult = await query('SELECT "ownerId" FROM "User" WHERE id = $1', [id]);
      const ownerId = managerResult.rows[0]?.ownerId;
      if (!ownerId) {
        buildingsResult = { rows: [] };
      } else {
        buildingsResult = await query(`
          SELECT b.*, 
                 json_agg(json_build_object(
                   'id', f.id,
                   'flatNumber', f."flatNumber",
                   'floor', f.floor,
                   'baseRent', f."baseRent",
                   'status', f.status,
                   'buildingId', f."buildingId",
                   'currentTenantId', f."currentTenantId",
                   'createdAt', f."createdAt",
                   'updatedAt', f."updatedAt"
                 ) ORDER BY f."flatNumber") as flats
          FROM "Building" b
          JOIN "Flat" f ON b.id = f."buildingId" AND f.status = 'VACANT'
          WHERE b."ownerId" = $1
          GROUP BY b.id
          ORDER BY b.name
        `, [ownerId]);
      }
    } else {
      // Owners see buildings they own that have vacant flats
      buildingsResult = await query(`
        SELECT b.*, 
               json_agg(json_build_object(
                 'id', f.id,
                 'flatNumber', f."flatNumber",
                 'floor', f.floor,
                 'baseRent', f."baseRent",
                 'status', f.status,
                 'buildingId', f."buildingId",
                 'currentTenantId', f."currentTenantId",
                 'createdAt', f."createdAt",
                 'updatedAt', f."updatedAt"
               ) ORDER BY f."flatNumber") as flats
        FROM "Building" b
        JOIN "Flat" f ON b.id = f."buildingId" AND f.status = 'VACANT'
        WHERE b."ownerId" = $1
        GROUP BY b.id
        ORDER BY b.name
      `, [id]);
    }

    const buildings = buildingsResult.rows;

    return NextResponse.json(buildings);
  } catch (error: any) {
    console.error("CRITICAL ERROR in /api/available-flats:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error?.message || "Unknown error" 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
