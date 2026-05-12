// Payment API: Record and manage payments
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";
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
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rentRecordId = req.nextUrl.searchParams.get("rentRecordId");
    const flatId = req.nextUrl.searchParams.get("flatId");

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (rentRecordId) {
      whereClause = 'WHERE p."rentRecordId" = $1';
      params = [rentRecordId];
      paramIndex = 2;
    } else if (flatId) {
      whereClause = 'WHERE p."flatId" = $1';
      params = [flatId];
      paramIndex = 2;
    } else {
      whereClause = 'WHERE rr."buildingId" IN (SELECT id FROM "Building" WHERE "ownerId" = $1)';
      params = [(session as any).user.id];
      paramIndex = 2;
    }

    const paymentsResult = await query(`
      SELECT p.*, rr.id as rr_id, rr."flatId" as rr_flat_id, rr."buildingId" as rr_building_id, rr.month, rr."baseRent", rr."extraCharges", rr."serviceCharges", rr."totalAmount", rr."dueAmount", rr."paidAmount", rr."paymentStatus", rr."createdAt" as rr_created_at, rr."updatedAt" as rr_updated_at,
             f.id as f_id, f."flatNumber", f.floor, f."baseRent" as f_base_rent, f."extraCharges" as f_extra_charges, f."serviceCharges" as f_service_charges, f.status as f_status, f."buildingId" as f_building_id, f."currentTenantId", f."createdAt" as f_created_at, f."updatedAt" as f_updated_at,
             b.id as b_id, b.name, b.address, b.area, b."totalFlats", b."ownerId", b."createdAt" as b_created_at, b."updatedAt" as b_updated_at
      FROM "Payment" p
      JOIN "RentRecord" rr ON p."rentRecordId" = rr.id
      JOIN "Flat" f ON rr."flatId" = f.id
      JOIN "Building" b ON rr."buildingId" = b.id
      ${whereClause}
      ORDER BY p."createdAt" DESC
    `, params);

    const payments = paymentsResult.rows.map(row => ({
      id: row.id,
      rentRecordId: row.rentRecordId,
      flatId: row.flatId,
      buildingId: row.buildingId,
      amount: row.amount,
      method: row.method,
      reference: row.reference,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      rentRecord: {
        id: row.rr_id,
        flatId: row.rr_flat_id,
        buildingId: row.rr_building_id,
        month: row.month,
        baseRent: row.baseRent,
        extraCharges: row.extraCharges,
        serviceCharges: row.serviceCharges,
        totalAmount: row.totalAmount,
        dueAmount: row.dueAmount,
        paidAmount: row.paidAmount,
        paymentStatus: row.paymentStatus,
        createdAt: row.rr_created_at,
        updatedAt: row.rr_updated_at,
        flat: {
          id: row.f_id,
          flatNumber: row.flatNumber,
          floor: row.floor,
          baseRent: row.f_base_rent,
          extraCharges: row.f_extra_charges,
          serviceCharges: row.f_service_charges,
          status: row.f_status,
          buildingId: row.f_building_id,
          currentTenantId: row.currentTenantId,
          createdAt: row.f_created_at,
          updatedAt: row.f_updated_at,
          building: {
            id: row.b_id,
            name: row.name,
            address: row.address,
            area: row.area,
            totalFlats: row.totalFlats,
            ownerId: row.ownerId,
            createdAt: row.b_created_at,
            updatedAt: row.b_updated_at
          }
        }
      }
    }));

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    console.log("DEBUG: Payments session:", JSON.stringify(session, null, 2));
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = paymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { rentRecordId, flatId, buildingId, amount, method, reference } = validation.data;

    // Get rent record with payments
    const rentRecordResult = await query(`
      SELECT rr.*, p.amount as payment_amount
      FROM "RentRecord" rr
      LEFT JOIN "Payment" p ON rr.id = p."rentRecordId"
      WHERE rr.id = $1
    `, [rentRecordId]);

    if (rentRecordResult.rows.length === 0) {
      return NextResponse.json({ error: "Rent record not found" }, { status: 404 });
    }

    const rentRecord = rentRecordResult.rows[0];
    const payments = rentRecordResult.rows.filter(row => row.payment_amount !== null).map(row => ({ amount: row.payment_amount }));

    // Calculate total paid
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + amount;
    const newStatus = totalPaid >= rentRecord.totalAmount ? "PAID" : "PARTIAL";

    // Record payment
    const paymentResult = await query(`
      INSERT INTO "Payment" ("id", "rentRecordId", "flatId", "buildingId", "amount", "method", "reference", "createdById", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [rentRecordId, flatId, buildingId, amount, method || null, reference || null, (session as any).user.id]);

    const payment = paymentResult.rows[0];

    // Update rent record status and balances
    const { updateRentRecordBalances } = await import("@/lib/services/rent-tracker");
    await updateRentRecordBalances(rentRecordId);

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("CRITICAL ERROR in /api/payments:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}
      },
    });

    // Update rent record status and balances
    const { updateRentRecordBalances } = await import("@/lib/services/rent-tracker");
    await updateRentRecordBalances(rentRecordId);

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("CRITICAL ERROR in /api/payments:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
