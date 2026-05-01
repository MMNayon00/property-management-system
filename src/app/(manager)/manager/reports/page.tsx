"use client";

import { useEffect, useState } from "react";
import translations from "@/lib/i18n/bn";
import BackButton from '@/components/common/BackButton';

type ReportData = {
  totalBuildings: number;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
  totalTenants: number;
  monthlyIncome: number;
  unpaidRent: number;
  collectionRate: number;
};

export default function ManagerReports() {
  const t = translations;
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const response = await fetch("/api/manager/reports");
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (reportType: string) => {
    setGeneratingPDF(true);
    try {
      const response = await fetch(`/api/manager/reports/generate-pdf?type=${reportType}`, {
        method: "POST",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("PDF তৈরি করতে সমস্যা হয়েছে");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.reports.reports}
        </h1>
        <p className="text-gray-600 mt-1">
          রিপোর্ট দেখুন এবং PDF তৈরি করুন
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.dashboard.totalBuildings}</p>
              <p className="text-2xl font-bold text-gray-900">{reportData?.totalBuildings || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.dashboard.totalFlats}</p>
              <p className="text-2xl font-bold text-gray-900">{reportData?.totalFlats || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.dashboard.totalTenants}</p>
              <p className="text-2xl font-bold text-gray-900">{reportData?.totalTenants || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t.dashboard.monthlyIncome}</p>
              <p className="text-2xl font-bold text-gray-900">৳{reportData?.monthlyIncome || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">{t.dashboard.occupiedFlats}</p>
            <p className="text-3xl font-bold text-green-600">{reportData?.occupiedFlats || 0}</p>
            <p className="text-sm text-gray-500 mt-1">মোট ফ্ল্যাটের {reportData?.totalFlats ? Math.round((reportData.occupiedFlats / reportData.totalFlats) * 100) : 0}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">{t.dashboard.vacantFlats}</p>
            <p className="text-3xl font-bold text-gray-600">{reportData?.vacantFlats || 0}</p>
            <p className="text-sm text-gray-500 mt-1">মোট ফ্ল্যাটের {reportData?.totalFlats ? Math.round((reportData.vacantFlats / reportData.totalFlats) * 100) : 0}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">{t.reports.collectionRate}</p>
            <p className="text-3xl font-bold text-blue-600">{reportData?.collectionRate || 0}%</p>
            <p className="text-sm text-gray-500 mt-1">ভাড়া আদায়ের হার</p>
          </div>
        </div>
      </div>

      {/* Report Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">রিপোর্ট তৈরি করুন</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => generatePDF("monthly")}
            disabled={generatingPDF}
            className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">মাসিক রিপোর্ট</p>
              <p className="text-sm text-gray-600">PDF তে রপ্তানি</p>
            </div>
          </button>

          <button
            onClick={() => generatePDF("tenant")}
            disabled={generatingPDF}
            className="flex items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">ভাড়াটিয়া রিপোর্ট</p>
              <p className="text-sm text-gray-600">PDF তে রপ্তানি</p>
            </div>
          </button>

          <button
            onClick={() => generatePDF("building")}
            disabled={generatingPDF}
            className="flex items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">বাড়ির রিপোর্ট</p>
              <p className="text-sm text-gray-600">PDF তে রপ্তানি</p>
            </div>
          </button>
        </div>

        {generatingPDF && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">PDF তৈরি হচ্ছে...</p>
          </div>
        )}
      </div>
    </div>
  );
}