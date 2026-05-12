import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateOTP } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Find user by phone
    const user = await query(
      "SELECT * FROM \"User\" WHERE phone = $1",
      [phone]
    ).then(res => res.rows[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found with this phone number" }, { status: 404 });
    }

    // Generate OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to user
    await query(
      "UPDATE \"User\" SET otp = $1, \"otpExpires\" = $2 WHERE id = $3",
      [otp, expires, user.id]
    );

    // In a real app, send OTP via SMS gateway here
    console.log(`[OTP] Sent ${otp} to ${phone}`);

    return NextResponse.json({ 
        message: "OTP sent successfully",
        // Only returning OTP in development/test environments for convenience
        ...(process.env.NODE_ENV === 'development' ? { dev_otp: otp } : {})
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
