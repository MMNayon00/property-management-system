import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { getTenantReportData } from "@/lib/tenant-report-service";
import puppeteer from "puppeteer";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig as any);

    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const fromMonth = searchParams.get('fromMonth') || undefined;
    const toMonth = searchParams.get('toMonth') || undefined;

    const { id, role } = (session as any).user;
    let targetTenantId = tenantId;

    if (role === "TENANT") {
      const tenant = await prisma.tenant.findUnique({ where: { userId: id } });
      if (!tenant) return NextResponse.json({ error: "Tenant record not found" }, { status: 404 });
      targetTenantId = tenant.id;
    } else if (!targetTenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Security: If not admin/owner/manager, check if it's their own record
    if (role === "TENANT" && tenantId && tenantId !== targetTenantId) {
        return NextResponse.json({ error: "Forbidden: You can only access your own report" }, { status: 403 });
    }

    // Get report data
    const reportData = await getTenantReportData(targetTenantId as string, fromMonth, toMonth);

    if (!reportData) {
      return NextResponse.json({ error: "Tenant or data not found" }, { status: 404 });
    }

    // Generate HTML content for PDF
    const htmlContent = generateReportHTML(reportData);

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

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tenant-report-${reportData.tenant.name}-${new Date().toISOString().split('T')[0]}.pdf"`,
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

/**
 * Generate HTML content for the PDF report
 */
function generateReportHTML(data: any): string {
  const { tenant, building, flat, months, summary } = data;

  return `
    <!DOCTYPE html>
    <html lang="bn" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ভাড়াটিয়া রিপোর্ট - ${tenant.name}</title>
        <style>
            ${getPDFStyles()}
        </style>
    </head>
    <body>
        <div class="report-container">
            <!-- Header -->
            <div class="header">
                <h1 class="title">ভাড়াটিয়া ভাড়া রিপোর্ট</h1>
                <div class="header-info">
                    <div class="info-row">
                        <span class="label">বিল্ডিং:</span>
                        <span class="value">${building.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">ফ্ল্যাট:</span>
                        <span class="value">${flat.flatNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">ভাড়াটিয়া:</span>
                        <span class="value">${tenant.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">ফোন:</span>
                        <span class="value">${tenant.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Report Table -->
            <div class="table-container">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>মাস</th>
                            <th>মূল ভাড়া</th>
                            <th>অতিরিক্ত চার্জ</th>
                            <th>সার্ভিস চার্জ</th>
                            <th>মোট</th>
                            <th>পরিশোধিত</th>
                            <th>বাকি</th>
                            <th>স্ট্যাটাস</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${months.map((month: any) => `
                            <tr>
                                <td>${month.monthName}</td>
                                <td class="number">৳${month.baseRent.toLocaleString('bn-BD')}</td>
                                <td class="number">৳${month.extraCharges.toLocaleString('bn-BD')}</td>
                                <td class="number">৳${month.serviceCharges.toLocaleString('bn-BD')}</td>
                                <td class="number total">৳${month.total.toLocaleString('bn-BD')}</td>
                                <td class="number paid">৳${month.paid.toLocaleString('bn-BD')}</td>
                                <td class="number due">৳${month.due.toLocaleString('bn-BD')}</td>
                                <td class="status ${month.status === 'পরিশোধিত' ? 'paid' : month.status === 'বাকি' ? 'due' : 'partial'}">${month.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Summary -->
            <div class="summary">
                <h3>সারাংশ</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="label">মোট মাস:</span>
                        <span class="value">${summary.totalMonths}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">মোট ভাড়া:</span>
                        <span class="value">৳${summary.totalRent.toLocaleString('bn-BD')}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">মোট পরিশোধিত:</span>
                        <span class="value">৳${summary.totalPaid.toLocaleString('bn-BD')}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">মোট বাকি:</span>
                        <span class="value">৳${summary.totalDue.toLocaleString('bn-BD')}</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>রিপোর্ট তৈরি করা হয়েছে: ${new Date().toLocaleDateString('bn-BD')}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Get CSS styles for PDF
 */
function getPDFStyles(): string {
  return `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Noto Sans Bengali', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: white;
    }

    .report-container {
        max-width: 210mm;
        margin: 0 auto;
        padding: 15mm;
    }

    .header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 15px;
    }

    .title {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 15px;
    }

    .header-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        font-size: 11px;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
    }

    .label {
        font-weight: bold;
    }

    .table-container {
        margin: 20px 0;
        overflow-x: auto;
    }

    .report-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
    }

    .report-table th,
    .report-table td {
        padding: 6px 4px;
        text-align: center;
        border: 1px solid #ddd;
    }

    .report-table th {
        background-color: #f5f5f5;
        font-weight: bold;
        font-size: 9px;
    }

    .number {
        font-family: 'Courier New', monospace;
        text-align: right;
    }

    .total {
        font-weight: bold;
        background-color: #fff8e1;
    }

    .paid {
        color: #2e7d32;
    }

    .due {
        color: #d32f2f;
        font-weight: bold;
    }

    .status {
        font-weight: bold;
        padding: 2px 4px;
        border-radius: 3px;
    }

    .status.paid {
        background-color: #e8f5e8;
        color: #2e7d32;
    }

    .status.due {
        background-color: #ffebee;
        color: #d32f2f;
    }

    .status.partial {
        background-color: #fff3e0;
        color: #f57c00;
    }

    .summary {
        margin-top: 20px;
        padding: 15px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    .summary h3 {
        font-size: 14px;
        margin-bottom: 10px;
        color: #333;
        text-align: center;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 11px;
    }

    .summary-item .label {
        font-weight: bold;
    }

    .footer {
        margin-top: 20px;
        text-align: center;
        font-size: 10px;
        color: #666;
        border-top: 1px solid #ddd;
        padding-top: 10px;
    }

    @media print {
        .report-container {
            margin: 0;
            padding: 10mm;
        }

        .report-table {
            font-size: 9px;
        }

        .header-info {
            font-size: 10px;
        }
    }
  `;
}