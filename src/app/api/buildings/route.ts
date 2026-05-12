// Building API: CRUD operations
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
import { z } from "zod";

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  address: z.string().min(1, "Address is required"),
  area: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let buildings;

    if ((session as any).user.role === "ADMIN") {
      // Admins see all buildings
      const buildingsResult = await query(`
        SELECT b.*, u."firstName", u."lastName", u.email
        FROM "Building" b
        JOIN "User" u ON b."ownerId" = u.id
      `);
      buildings = await Promise.all(buildingsResult.rows.map(async (building: any) => {
        const flatsResult = await query('SELECT * FROM "Flat" WHERE "buildingId" = $1', [building.id]);
        return {
          ...building,
          owner: { firstName: building.firstName, lastName: building.lastName, email: building.email },
          flats: flatsResult.rows
        };
      }));
    } else if ((session as any).user.role === "OWNER") {
      // Owners see only their buildings
      const buildingsResult = await query(`
        SELECT b.*, u."firstName", u."lastName"
        FROM "Building" b
        JOIN "User" u ON b."ownerId" = u.id
        WHERE b."ownerId" = $1
      `, [(session as any).user.id]);
      buildings = await Promise.all(buildingsResult.rows.map(async (building: any) => {
        const flatsResult = await query('SELECT * FROM "Flat" WHERE "buildingId" = $1', [building.id]);
        return {
          ...building,
          owner: { firstName: building.firstName, lastName: building.lastName },
          flats: flatsResult.rows
        };
      }));
    } else if ((session as any).user.role === "MANAGER") {
      // Managers see only buildings they manage
      const managerResult = await query('SELECT "ownerId" FROM "User" WHERE id = $1', [(session as any).user.id]);
      const ownerId = managerResult.rows[0]?.ownerId;
      if (!ownerId) {
        buildings = [];
      } else {
        const buildingsResult = await query(`
          SELECT b.*, u."firstName", u."lastName"
          FROM "Building" b
          JOIN "User" u ON b."ownerId" = u.id
          WHERE b."ownerId" = $1
        `, [ownerId]);
        buildings = await Promise.all(buildingsResult.rows.map(async (building: any) => {
          const flatsResult = await query('SELECT * FROM "Flat" WHERE "buildingId" = $1', [building.id]);
          return {
            ...building,
            owner: { firstName: building.firstName, lastName: building.lastName },
            flats: flatsResult.rows
          };
        }));
      }
    } else {
      buildings = [];
    }

    return NextResponse.json(buildings);
  } catch (error) {
    console.error("Error fetching buildings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session as any).user.role === "ADMIN" && !(session as any).user.id) {
      return NextResponse.json({ error: "Invalid admin" }, { status: 400 });
    }

    const body = await req.json();
    const validation = buildingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, address, area } = validation.data;

    // Only owners can create buildings (unless admin is doing it)
    const ownerId =
      (session as any).user.role === "OWNER"
        ? (session as any).user.id
        : req.nextUrl.searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner ID is required" },
        { status: 400 }
      );
    }

    // Verify owner exists
    const ownerResult = await query('SELECT role FROM "User" WHERE id = $1', [ownerId]);
    const owner = ownerResult.rows[0];

    if (!owner || owner.role !== "OWNER") {
      return NextResponse.json(
        { error: "Invalid owner" },
        { status: 400 }
      );
    }

    const buildingResult = await query(`
      INSERT INTO "Building" ("id", "name", "address", "area", "ownerId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [name, address, area || null, ownerId]);

    const building = buildingResult.rows[0];

    return NextResponse.json(building, { status: 201 });
  } catch (error) {
    console.error("Error creating building:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
