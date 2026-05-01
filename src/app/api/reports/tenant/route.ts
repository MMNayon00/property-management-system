import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { getTenantReportData, getUserBuildings, getBuildingFlats, getFlatTenants } from "@/lib/tenant-report-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Handle different actions
    switch (action) {
      case 'buildings': {
        const userRole = (session as any).user.role;
        const userId = (session as any).user.id;
        const buildings = await getUserBuildings(userId, userRole);
        return NextResponse.json(buildings);
      }

      case 'flats': {
        const buildingId = searchParams.get('buildingId');
        if (!buildingId) {
          return NextResponse.json({ error: "buildingId is required" }, { status: 400 });
        }
        const flats = await getBuildingFlats(buildingId);
        return NextResponse.json(flats);
      }

      case 'tenants': {
        const flatId = searchParams.get('flatId');
        if (!flatId) {
          return NextResponse.json({ error: "flatId is required" }, { status: 400 });
        }
        const tenants = await getFlatTenants(flatId);
        return NextResponse.json(tenants);
      }

      case 'report': {
        const tenantId = searchParams.get('tenantId');
        const fromMonth = searchParams.get('fromMonth') || undefined;
        const toMonth = searchParams.get('toMonth') || undefined;

        if (!tenantId) {
          return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
        }

        const reportData = await getTenantReportData(tenantId, fromMonth, toMonth);

        if (!reportData) {
          return NextResponse.json({ error: "Tenant or data not found" }, { status: 404 });
        }

        return NextResponse.json(reportData);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in tenant reports API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}