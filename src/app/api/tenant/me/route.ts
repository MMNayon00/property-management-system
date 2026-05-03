import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = (session as any).user;
    if (role !== "TENANT") {
      return NextResponse.json({ error: "Forbidden: Tenant role required" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { userId: id },
      include: {
        currentFlat: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant record not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
