// Owner API: Manage managers assigned to owner's buildings
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET all managers for the logged-in owner
export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig as any);
  if (!session || (session as any)?.user?.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = (session as any)?.user?.id;

  try {
    const managers = await prisma.user.findMany({
      where: {
        role: "MANAGER",
        ownerId: ownerId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json({ error: "Failed to fetch managers" }, { status: 500 });
  }
}

// POST a new manager
export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig as any);
  if (!session || (session as any)?.user?.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerId = (session as any)?.user?.id;
  const body = await req.json();
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
  } = body;

  if (!firstName || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {

    const hashedPassword = await bcrypt.hash(password, 10);

    const newManager = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: "MANAGER",
        status: "APPROVED",
        ownerId: ownerId,
      },
    });

    return NextResponse.json(newManager, { status: 201 });
  } catch (error) {
    console.error("Error creating manager:", error);
    return NextResponse.json({ error: "Failed to create manager" }, { status: 500 });
  }
}
