import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found with this phone number" }, { status: 404 });
    }

    // Generate OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires: expires,
      },
    });

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
