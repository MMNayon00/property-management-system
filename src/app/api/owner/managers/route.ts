// Owner API: Manage managers assigned to owner's buildings
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/utils";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  buildingId: z.string().min(1),
});

const updateSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ownerId = session.user.id as string | undefined;
    if (!ownerId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const buildings = await prisma.building.findMany({
      where: { ownerId, managerId: { not: null } },
      select: { managerId: true },
    });

    const managerIds = Array.from(new Set(buildings.map((b) => b.managerId).filter(Boolean)));

    if (managerIds.length === 0) {
      return NextResponse.json([]);
    }

    const managers = await prisma.user.findMany({
      where: { id: { in: managerIds }, role: "MANAGER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ownerId = session.user.id as string | undefined;
    if (!ownerId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const body = await req.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password, buildingId } = validation.data;

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building || building.ownerId !== ownerId) {
      return NextResponse.json({ error: "Invalid building" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: phone || undefined }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const manager = await prisma.user.create({
      data: {
        firstName,
        lastName: lastName || null,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: "MANAGER",
        status: "APPROVED",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.building.update({
      where: { id: buildingId },
      data: { managerId: manager.id },
    });

    return NextResponse.json(manager, { status: 201 });
  } catch (error) {
    console.error("Error creating manager:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ownerId = session.user.id as string | undefined;
    if (!ownerId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const body = await req.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, firstName, lastName, email, phone } = validation.data;

    const isManagerLinked = await prisma.building.findFirst({
      where: { ownerId, managerId: id },
    });

    if (!isManagerLinked) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName: lastName || null,
        email,
        phone: phone || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating manager:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
