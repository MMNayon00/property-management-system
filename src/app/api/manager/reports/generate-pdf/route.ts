// Manager API: Generate PDF reports
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session as any).user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "monthly";

    const managerId = (session as any).user.id as string;

    // Get buildings managed by this manager
    const buildings = await prisma.building.findMany({
      where: { managerId },
      select: { id: true, name: true },
    });

    const buildingIds = buildings.map(b => b.id);

    if (buildingIds.length === 0) {
      return NextResponse.json({ error: "No buildings assigned" }, { status: 400 });
    }

    let htmlContent = "";
    let fileName = "";

    if (reportType === "monthly") {
      // Generate monthly report
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      const rentRecords = await prisma.rentRecord.findMany({
        where: {
          buildingId: { in: buildingIds },
          month: currentMonth,
        },
        select: {
          flat: {
            select: {
              flatNumber: true,
              building: { select: { name: true } },
            },
          },
          tenant: {
            select: { name: true },
          },
          total: true,
          paymentStatus: true,
        },
        orderBy: [
          { flat: { building: { name: "asc" } } },
          { flat: { flatNumber: "asc" } },
        ],
      });

      htmlContent = `
        <!DOCTYPE html>
        <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>মাসিক রিপোর্ট - ${currentMonth}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .paid { color: #16a34a; }
            .unpaid { color: #dc2626; }
            .partial { color: #ca8a04; }
          </style>
        </head>
        <body>
          <h1>মাসিক ভাড়া রিপোর্ট</h1>
          <p><strong>মাস:</strong> ${currentMonth}</p>
          <p><strong>ম্যানেজার:</strong> ${(session as any).user.name}</p>
          <p><strong>তৈরির তারিখ:</strong> ${new Date().toLocaleDateString('bn')}</p>

          <table>
            <thead>
              <tr>
                <th>বাড়ি</th>
                <th>ফ্ল্যাট</th>
                <th>ভাড়াটিয়া</th>
                <th>মোট ভাড়া</th>
                <th>অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              ${rentRecords.map(record => `
                <tr>
                  <td>${record.flat.building.name}</td>
                  <td>${record.flat.flatNumber}</td>
                  <td>${record.tenant?.name || '-'}</td>
                  <td>৳${record.total}</td>
                  <td class="${record.paymentStatus === 'PAID' ? 'paid' : record.paymentStatus === 'PARTIAL' ? 'partial' : 'unpaid'}">
                    ${record.paymentStatus === 'PAID' ? 'পরিশোধিত' : record.paymentStatus === 'PARTIAL' ? 'আংশিক' : 'বাকি'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      fileName = `monthly-report-${currentMonth}`;

    } else if (reportType === "tenant") {
      // Generate tenant report
      const tenants = await prisma.tenant.findMany({
        where: {
          currentFlat: {
            buildingId: { in: buildingIds },
          },
        },
        select: {
          name: true,
          phone: true,
          moveInDate: true,
          currentFlat: {
            select: {
              flatNumber: true,
              building: { select: { name: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      htmlContent = `
        <!DOCTYPE html>
        <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>ভাড়াটিয়া রিপোর্ট</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
          </style>
        </head>
        <body>
          <h1>ভাড়াটিয়া রিপোর্ট</h1>
          <p><strong>ম্যানেজার:</strong> ${(session as any).user.name}</p>
          <p><strong>তৈরির তারিখ:</strong> ${new Date().toLocaleDateString('bn')}</p>

          <table>
            <thead>
              <tr>
                <th>নাম</th>
                <th>ফোন</th>
                <th>বাড়ি</th>
                <th>ফ্ল্যাট</th>
                <th>প্রবেশের তারিখ</th>
              </tr>
            </thead>
            <tbody>
              ${tenants.map(tenant => `
                <tr>
                  <td>${tenant.name}</td>
                  <td>${tenant.phone || '-'}</td>
                  <td>${tenant.currentFlat?.building.name}</td>
                  <td>${tenant.currentFlat?.flatNumber}</td>
                  <td>${tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString('bn') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      fileName = "tenant-report";

    } else if (reportType === "building") {
      // Generate building report
      const buildingsData = await prisma.building.findMany({
        where: { managerId },
        select: {
          name: true,
          address: true,
          _count: {
            select: { flats: true },
          },
          flats: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      const buildingsWithStats = buildingsData.map(building => ({
        ...building,
        occupiedFlats: building.flats.filter(f => f.status === "OCCUPIED").length,
        vacantFlats: building.flats.filter(f => f.status === "VACANT").length,
      }));

      htmlContent = `
        <!DOCTYPE html>
        <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>বাড়ির রিপোর্ট</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
          </style>
        </head>
        <body>
          <h1>বাড়ির রিপোর্ট</h1>
          <p><strong>ম্যানেজার:</strong> ${(session as any).user.name}</p>
          <p><strong>তৈরির তারিখ:</strong> ${new Date().toLocaleDateString('bn')}</p>

          <table>
            <thead>
              <tr>
                <th>বাড়ির নাম</th>
                <th>ঠিকানা</th>
                <th>মোট ফ্ল্যাট</th>
                <th>দখলীকৃত</th>
                <th>খালি</th>
              </tr>
            </thead>
            <tbody>
              ${buildingsWithStats.map(building => `
                <tr>
                  <td>${building.name}</td>
                  <td>${building.address}</td>
                  <td>${building._count.flats}</td>
                  <td>${building.occupiedFlats}</td>
                  <td>${building.vacantFlats}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      fileName = "building-report";
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}