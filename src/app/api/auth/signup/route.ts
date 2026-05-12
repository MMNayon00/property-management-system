// Sign up API route
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, isValidEmail, isValidPhoneNumber } from "@/lib/utils";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(11, "Invalid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupInput = z.infer<typeof signupSchema>;

export async function POST(req: NextRequest) {
  try {
    const body: SignupInput = await req.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password } = validation.data;

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!isValidPhoneNumber(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      "SELECT * FROM \"User\" WHERE email = $1 OR phone = $2",
      [email, phone]
    ).then(res => res.rows[0]);

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email or phone" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with APPROVED status
    const user = await query(
      `INSERT INTO "User" (id, "firstName", "lastName", email, phone, password, role, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [firstName, lastName || null, email, phone, hashedPassword, "OWNER", "APPROVED"]
    ).then(res => res.rows[0]);

    return NextResponse.json(
      {
        message: "Signup successful. You can now log in.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
