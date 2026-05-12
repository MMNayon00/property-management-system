// Reports API: Generate monthly reports and analytics
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const type = req.nextUrl.searchParams.get("type"); // "monthly" or "tenant"
    const buildingId = req.nextUrl.searchParams.get("buildingId");
    const tenantId = req.nextUrl.searchParams.get("tenantId");
    
    // Month as string "YYYY-MM"
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStr = req.nextUrl.searchParams.get("month") || currentMonthStr;

    if (type === "monthly" && buildingId) {
      // Monthly building report
      const rentRecordsResult = await query(`
        SELECT rr.*, f.id as f_id, f."flatNumber", f.floor, f."baseRent" as f_base_rent, f."extraCharges" as f_extra_charges, f."serviceCharges" as f_service_charges, f.status as f_status, f."buildingId" as f_building_id, f."currentTenantId", f."createdAt" as f_created_at, f."updatedAt" as f_updated_at,
               p.id as p_id, p."rentRecordId", p."flatId" as p_flat_id, p."buildingId" as p_building_id, p.amount as p_amount, p.method, p.reference, p."createdById", p."createdAt" as p_created_at, p."updatedAt" as p_updated_at
        FROM "RentRecord" rr
        JOIN "Flat" f ON rr."flatId" = f.id
        LEFT JOIN "Payment" p ON rr.id = p."rentRecordId"
        WHERE rr."buildingId" = $1 AND rr.month = $2
      `, [buildingId, monthStr]);

      // Group by rent record
      const recordMap = new Map();
      rentRecordsResult.rows.forEach(row => {
        const recordId = row.id;
        if (!recordMap.has(recordId)) {
          recordMap.set(recordId, {
            id: row.id,
            flatId: row.flatId,
            buildingId: row.buildingId,
            month: row.month,
            baseRent: row.baseRent,
            extraCharges: row.extraCharges,
            serviceCharges: row.serviceCharges,
            totalAmount: row.totalAmount,
            dueAmount: row.dueAmount,
            paidAmount: row.paidAmount,
            paymentStatus: row.paymentStatus,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
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
              updatedAt: row.f_updated_at
            },
            payments: []
          });
        }
        if (row.p_id) {
          recordMap.get(recordId).payments.push({
            id: row.p_id,
            rentRecordId: row.rentRecordId,
            flatId: row.p_flat_id,
            buildingId: row.p_building_id,
            amount: row.p_amount,
            method: row.method,
            reference: row.reference,
            createdById: row.createdById,
            createdAt: row.p_created_at,
            updatedAt: row.p_updated_at
          });
        }
      });

      const rentRecords = Array.from(recordMap.values());

      const totalCollection = rentRecords.reduce((sum, record) => {
        const paid = record.payments.reduce((p, payment) => p + payment.amount, 0);
        return sum + paid;
      }, 0);

      const totalDue = rentRecords.reduce((sum, record) => {
        const paid = record.payments.reduce((p, payment) => p + payment.amount, 0);
        return sum + Math.max(0, record.totalAmount - paid);
      }, 0);

      return NextResponse.json({
        type: "monthly",
        buildingId,
        month: monthStr,
        records: rentRecords,
        totalCollection,
        totalDue,
        collectionRate: totalCollection / (totalCollection + totalDue) || 0,
      });
    } else if (type === "tenant" && tenantId) {
      // Tenant lifetime report
      const paymentsResult = await query(`
        SELECT p.*, rr.id as rr_id, rr."flatId", rr."buildingId", rr.month, rr."baseRent", rr."extraCharges", rr."serviceCharges", rr."totalAmount", rr."dueAmount", rr."paidAmount", rr."paymentStatus", rr."createdAt" as rr_created_at, rr."updatedAt" as rr_updated_at
        FROM "Payment" p
        JOIN "RentRecord" rr ON p."rentRecordId" = rr.id
        WHERE rr."flatId" IN (SELECT id FROM "Flat" WHERE "currentTenantId" = $1)
      `, [tenantId]);

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
          flatId: row.flatId,
          buildingId: row.buildingId,
          month: row.month,
          baseRent: row.baseRent,
          extraCharges: row.extraCharges,
          serviceCharges: row.serviceCharges,
          totalAmount: row.totalAmount,
          dueAmount: row.dueAmount,
          paidAmount: row.paidAmount,
          paymentStatus: row.paymentStatus,
          createdAt: row.rr_created_at,
          updatedAt: row.rr_updated_at
        }
      }));

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      return NextResponse.json({
        type: "tenant",
        tenantId,
        payments,
        totalPaid,
        paymentCount: payments.length,
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
