import { NextResponse } from "next/server";
import { generateMonthlyRentRecords } from "@/lib/rent-service";

/**
 * POST /api/rent/generate
 * Manually trigger monthly rent generation.
 * Optional body: { "month": "YYYY-MM" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { month } = body;

    // Validate month format if provided
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM." },
        { status: 400 }
      );
    }

    const result = await generateMonthlyRentRecords(month);

    return NextResponse.json({
      success: true,
      message: `Rent generation completed for ${month || "current month"}.`,
      data: result,
    });
  } catch (error) {
    console.error("[API Rent Generate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error during rent generation." },
      { status: 500 }
    );
  }
}
