import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = (session as any).user;
    if (role !== "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantResult = await query(
      'SELECT * FROM "Tenant" WHERE "userId" = $1',
      [id]
    );
    const tenant = tenantResult.rows[0];

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Fetch all rent records for this tenant with payments
    const allRecordsResult = await query(`
      SELECT rr.*, 
             json_agg(p.*) as payments
      FROM "RentRecord" rr
      LEFT JOIN "Payment" p ON rr.id = p."rentRecordId"
      WHERE rr."tenantId" = $1
      GROUP BY rr.id
      ORDER BY rr.month
    `, [tenant.id]);

    const allRecords = allRecordsResult.rows.map(row => ({
      ...row,
      payments: row.payments || []
    }));

    // Separate current month and unpaid months
    const currentRecord = allRecords.find(r => r.month === currentMonth);
    const unpaidMonths = allRecords.filter(r => r.paymentStatus !== "PAID");
    
    // Calculate total summary
    const totalRent = allRecords.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
    const paidAmount = allRecords.reduce((sum, r) => sum + parseFloat(r.paidAmount), 0);
    const dueAmount = totalRent - paidAmount;

    return NextResponse.json({
      currentMonth,
      currentRecord,
      unpaidMonths: unpaidMonths.map(r => ({
        id: r.id,
        month: r.month,
        amount: r.totalAmount,
        due: r.dueAmount,
        status: r.paymentStatus,
      })),
      summary: {
        totalRent,
        paidAmount,
        dueAmount: Math.max(0, dueAmount),
        totalMonths: allRecords.length,
      }
    });
  } catch (error) {
    console.error("Error fetching current status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
