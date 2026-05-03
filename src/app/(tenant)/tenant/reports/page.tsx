"use client";

import { useState, useEffect } from "react";
import { FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import translations from "@/lib/i18n/bn";

export default function TenantReportsPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const t = translations;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/tenant/current-status");
        if (res.ok) setStatusData(await res.json());
      } catch (error) {
        console.error("Error fetching status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const downloadReport = () => {
    window.open('/api/reports/tenant/pdf', '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const summary = statusData?.summary || { totalRent: 0, paidAmount: 0, dueAmount: 0, totalMonths: 0 };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <FileText className="text-blue-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">{t.tenantPortal.downloadReport}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <FileText className="text-blue-600 w-10 h-10" />
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t.tenantPortal.paymentSummary}</h2>
          <p className="text-gray-500 mt-2">{t.tenantPortal.title} {t.reports.reports}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto py-6">
            <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">{t.tenantPortal.totalMonths}</p>
                <p className="text-lg font-bold">{summary.totalMonths}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">{t.tenantPortal.totalPaid}</p>
                <p className="text-lg font-bold text-green-600">৳{summary.paidAmount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500 uppercase">{t.tenantPortal.totalDue}</p>
                <p className="text-lg font-bold text-red-600">৳{summary.dueAmount}</p>
            </div>
        </div>

        <button 
          onClick={downloadReport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-105 flex items-center justify-center mx-auto"
        >
          <Download className="w-6 h-6 mr-3" />
          {t.tenantPortal.downloadReport} (PDF)
        </button>
        
        <p className="text-sm text-gray-400">
            * এটি আপনার সম্পূর্ণ ভাড়া এবং পেমেন্টের একটি অফিসিয়াল রিপোর্ট।
        </p>
      </div>
    </div>
  );
}
