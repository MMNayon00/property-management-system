"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";

export default function TenantReportsPage() {
  const { data: session, status } = useSession();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  // Selection states
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");

  // Date range states
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const t = translations;

  useEffect(() => {
    if (status === "authenticated") {
      fetchInitialData();
    } else if (status !== "loading") {
      setInitialLoading(false);
    }
  }, [status, session]);

  const fetchInitialData = async () => {
    try {
      // Fetch buildings
      const bRes = await fetch("/api/buildings", { cache: "no-store" });
      const bData = await bRes.json();
      setBuildings(Array.isArray(bData) ? bData : []);
      if (bData.length > 0) {
        setSelectedBuildingId(bData[0].id);
        await fetchFlatsForBuilding(bData[0].id);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchFlatsForBuilding = async (buildingId: string) => {
    try {
      const res = await fetch(`/api/flats?buildingId=${buildingId}`);
      const data = await res.json();
      setFlats(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedFlatId(data[0].id);
        await fetchTenantsForFlat(data[0].id);
      } else {
        setSelectedFlatId("");
        setTenants([]);
        setSelectedTenantId("");
      }
    } catch (error) {
      console.error("Error fetching flats:", error);
      setFlats([]);
      setSelectedFlatId("");
      setTenants([]);
      setSelectedTenantId("");
    }
  };

  const fetchTenantsForFlat = async (flatId: string) => {
    try {
      const res = await fetch(`/api/tenants?flatId=${flatId}`);
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedTenantId(data[0].id);
      } else {
        setSelectedTenantId("");
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setTenants([]);
      setSelectedTenantId("");
    }
  };

  const handleBuildingChange = async (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedFlatId("");
    setSelectedTenantId("");
    await fetchFlatsForBuilding(buildingId);
  };

  const handleFlatChange = async (flatId: string) => {
    setSelectedFlatId(flatId);
    setSelectedTenantId("");
    await fetchTenantsForFlat(flatId);
  };

  const generatePDF = async () => {
    if (!selectedTenantId) {
      alert("অনুগ্রহ করে একজন ভাড়াটিয়া নির্বাচন করুন");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: selectedTenantId,
      });

      if (useCustomRange && fromMonth && toMonth) {
        params.append('fromMonth', fromMonth);
        params.append('toMonth', toMonth);
      }

      const response = await fetch(`/api/reports/tenant/pdf?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenant-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("পিডিএফ তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const copyReportData = async () => {
    if (!selectedTenantId) {
      alert("অনুগ্রহ করে একজন ভাড়াটিয়া নির্বাচন করুন");
      return;
    }

    setCopyLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: selectedTenantId,
      });

      if (useCustomRange && fromMonth && toMonth) {
        params.append('fromMonth', fromMonth);
        params.append('toMonth', toMonth);
      }

      const response = await fetch(`/api/reports/tenant?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);

      // Format data for copying
      const formattedData = formatReportForCopy(data);

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedData);

      alert("রিপোর্ট ডেটা কপি করা হয়েছে!");

    } catch (error) {
      console.error("Error copying report data:", error);
      alert("ডেটা কপি করতে সমস্যা হয়েছে");
    } finally {
      setCopyLoading(false);
    }
  };

  const printReport = async () => {
    if (!selectedTenantId) {
      alert("অনুগ্রহ করে একজন ভাড়াটিয়া নির্বাচন করুন");
      return;
    }

    setPrintLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: selectedTenantId,
      });

      if (useCustomRange && fromMonth && toMonth) {
        params.append('fromMonth', fromMonth);
        params.append('toMonth', toMonth);
      }

      const response = await fetch(`/api/reports/tenant?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();

      // Open print dialog with formatted content
      openPrintDialog(data);

    } catch (error) {
      console.error("Error printing report:", error);
      alert("প্রিন্ট করতে সমস্যা হয়েছে");
    } finally {
      setPrintLoading(false);
    }
  };

  const openPrintDialog = (data: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("পপআপ ব্লক করা হয়েছে। অনুগ্রহ করে পপআপ অনুমতি দিন।");
      return;
    }

    const printContent = generatePrintHTML(data);
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const generatePrintHTML = (data: any): string => {
    const { tenant, building, flat, months, summary } = data;

    return `
      <!DOCTYPE html>
      <html lang="bn" dir="ltr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ভাড়াটিয়া রিপোর্ট - ${tenant.name}</title>
          <style>
              ${getPrintStyles()}
          </style>
      </head>
      <body>
          <div class="print-container">
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
  };

  const getPrintStyles = (): string => {
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

        .print-container {
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
            .print-container {
                margin: 0;
                padding: 10mm;
            }

            .report-table {
                font-size: 9px;
            }

            .header-info {
                font-size: 10px;
            }

            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    `;
  };

  const formatReportForCopy = (data: any) => {
    const { tenant, building, flat, months, summary } = data;

    let text = `ভাড়াটিয়া ভাড়া রিপোর্ট\n\n`;
    text += `বিল্ডিং: ${building.name}\n`;
    text += `ফ্ল্যাট: ${flat.flatNumber}\n`;
    text += `ভাড়াটিয়া: ${tenant.name}\n`;
    text += `ফোন: ${tenant.phone || 'N/A'}\n\n`;

    text += `মাসিক বিবরণ:\n`;
    text += `মাস\t\tমূল ভাড়া\tঅতিরিক্ত\tসার্ভিস\tমোট\tপরিশোধিত\tবাকি\tস্ট্যাটাস\n`;
    text += `--------------------------------------------------------------------------------\n`;

    months.forEach((month: any) => {
      text += `${month.monthName}\t৳${month.baseRent.toLocaleString('bn-BD')}\t৳${month.extraCharges.toLocaleString('bn-BD')}\t৳${month.serviceCharges.toLocaleString('bn-BD')}\t৳${month.total.toLocaleString('bn-BD')}\t৳${month.paid.toLocaleString('bn-BD')}\t৳${month.due.toLocaleString('bn-BD')}\t${month.status}\n`;
    });

    text += `\nসারাংশ:\n`;
    text += `মোট মাস: ${summary.totalMonths}\n`;
    text += `মোট ভাড়া: ৳${summary.totalRent.toLocaleString('bn-BD')}\n`;
    text += `মোট পরিশোধিত: ৳${summary.totalPaid.toLocaleString('bn-BD')}\n`;
    text += `মোট বাকি: ৳${summary.totalDue.toLocaleString('bn-BD')}\n\n`;

    text += `রিপোর্ট তৈরি করা হয়েছে: ${new Date().toLocaleDateString('bn-BD')}`;

    return text;
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">অনুগ্রহ করে লগইন করুন</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          ভাড়াটিয়া ভাড়া রিপোর্ট
        </h1>

        {/* Selection Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Building Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              বিল্ডিং নির্বাচন করুন
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => handleBuildingChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {/* Flat Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ফ্ল্যাট নির্বাচন করুন
            </label>
            <select
              value={selectedFlatId}
              onChange={(e) => handleFlatChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={flats.length === 0}
            >
              <option value="">ফ্ল্যাট নির্বাচন করুন</option>
              {flats.map((flat) => (
                <option key={flat.id} value={flat.id}>
                  {flat.flatNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ভাড়াটিয়া নির্বাচন করুন
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={tenants.length === 0}
            >
              <option value="">ভাড়াটিয়া নির্বাচন করুন</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}({tenant.phone || "No Phone"})-{tenant.currentFlat?.building?.name}-{tenant.currentFlat?.flatNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Options */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="customRange"
              checked={useCustomRange}
              onChange={(e) => setUseCustomRange(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="customRange" className="text-sm font-medium text-gray-700">
              কাস্টম তারিখ পরিসীমা ব্যবহার করুন
            </label>
          </div>

          {useCustomRange && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  থেকে (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={fromMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  পর্যন্ত (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={toMonth}
                  onChange={(e) => setToMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex justify-center flex-wrap gap-4">
            {/* Copy Button */}
            <button
              onClick={copyReportData}
              disabled={copyLoading || !selectedTenantId}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center"
            >
              {copyLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  কপি হচ্ছে...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  ডেটা কপি করুন
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={printReport}
              disabled={printLoading || !selectedTenantId}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center"
            >
              {printLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  প্রিন্ট হচ্ছে...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  প্রিন্ট করুন
                </>
              )}
            </button>

            {/* PDF Button */}
            <button
              onClick={generatePDF}
              disabled={false} // Temporarily always enabled for testing
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  পিডিএফ তৈরি করুন (TEST)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">নির্দেশনা:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• প্রথমে বিল্ডিং, তারপর ফ্ল্যাট, এবং সবশেষে ভাড়াটিয়া নির্বাচন করুন</li>
            <li>• কাস্টম তারিখ পরিসীমা না দিলে ভাড়াটিয়ার মুভ-ইন তারিখ থেকে বর্তমান পর্যন্ত রিপোর্ট তৈরি হবে</li>
            <li>• "ডেটা কপি করুন" বাটনে ক্লিক করে রিপোর্ট ডেটা ক্লিপবোর্ডে কপি করুন</li>
            <li>• "প্রিন্ট করুন" বাটনে ক্লিক করে ব্রাউজারের প্রিন্ট ডায়ালগ খুলে প্রিন্ট করুন</li>
            <li>• "পিডিএফ তৈরি করুন" বাটনে ক্লিক করে পিডিএফ ফাইল ডাউনলোড করুন</li>
          </ul>
        </div>
      </div>
    </div>
  );
}