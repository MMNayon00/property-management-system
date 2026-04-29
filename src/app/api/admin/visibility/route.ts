import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const type = req.nextUrl.searchParams.get("type") || "buildings";
    const search = req.nextUrl.searchParams.get("search") || "";

    if (type === "buildings") {
      const buildings = await prisma.building.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        include: {
          owner: { select: { firstName: true, lastName: true, phone: true } },
          _count: { select: { flats: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json(buildings);
    } 
    
    if (type === "flats") {
      const flats = await prisma.flat.findMany({
        where: search
          ? {
              OR: [
                { flatNumber: { contains: search, mode: "insensitive" } },
                { building: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
        include: {
          building: { select: { name: true, owner: { select: { firstName: true } } } },
          currentTenant: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json(flats);
    }

    if (type === "tenants") {
      const tenants = await prisma.tenant.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        include: {
          currentFlat: { 
            select: { 
              flatNumber: true, 
              building: { select: { name: true } } 
            } 
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json(tenants);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching system visibility data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
