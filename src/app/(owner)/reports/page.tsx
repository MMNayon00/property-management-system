"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";
import BackButton from '@/components/common/BackButton';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"monthly" | "tenant">("monthly");
  
  // Buildings & Tenants options
  const [buildings, setBuildings] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  
  // Selection States
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedTenantId, setSelectedTenantId] = useState("");
  
  // Results
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const t = translations;

  useEffect(() => {
    if (status === "authenticated") {
      fetchFilters();
    } else if (status !== "loading") {
      setInitialLoading(false);
    }
  }, [status, session]);

  const fetchFilters = async () => {
    try {
      const bRes = await fetch("/api/buildings", { cache: "no-store" });
      const bData = await bRes.json();
      setBuildings(Array.isArray(bData) ? bData : []);
      if (bData.length > 0) setSelectedBuildingId(bData[0].id);

      const tRes = await fetch("/api/tenants");
      const tData = await tRes.json();
      setTenants(Array.isArray(tData) ? tData : []);
      if (tData.length > 0) setSelectedTenantId(tData[0].id);
    } catch (error) {
      console.error("Error fetching filters:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let url = "";
      if (activeTab === "monthly") {
        if (!selectedBuildingId) return;
        const monthStr = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
        url = `/api/reports?type=monthly&buildingId=${selectedBuildingId}&month=${monthStr}`;
      } else {
        if (!selectedTenantId) return;
        url = `/api/reports?type=tenant&tenantId=${selectedTenantId}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthStr?: string | number) => {
    if (!monthStr) return "";
    if (typeof monthStr === "number") {
      const date = new Date();
      date.setMonth(monthStr - 1);
      return date.toLocaleString('bn-BD', { month: 'long' });
    }
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
  };

  if (status === "loading" || initialLoading) {
    return <div className="flex justify-center py-10"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.nav.reports}</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => { setActiveTab("monthly"); setReportData(null); }}
              className={`${
                activeTab === "monthly"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              মাসিক রিপোর্ট
            </button>
            <button
              onClick={() => { setActiveTab("tenant"); setReportData(null); }}
              className={`${
                activeTab === "tenant"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              ভাড়াটিয়া রিপোর্ট
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
            {activeTab === "monthly" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বিল্ডিং</label>
                  <select
                    value={selectedBuildingId}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="" disabled>নির্বাচন করুন</option>
                    {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">মাস</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বছর</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="block w-full sm:w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </>
            )}

            {activeTab === "tenant" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ভাড়াটিয়া</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="block w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" disabled>নির্বাচন করুন</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}({t.phone || "No Phone"})-{t.currentFlat?.building?.name}-{t.currentFlat?.flatNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow transition disabled:opacity-50"
            >
              {loading ? "তৈরি হচ্ছে..." : "রিপোর্ট তৈরি করুন"}
            </button>
          </div>

          {/* Report Results */}
          {reportData && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {reportData.type === "monthly" && (
                <div>
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">মোট আদায় (Collection)</p>
                      <p className="text-2xl font-bold text-green-600">৳ {reportData.totalCollection}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">মোট বকেয়া (Due)</p>
                      <p className="text-2xl font-bold text-red-600">৳ {reportData.totalDue}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">আদায়ের হার</p>
                      <p className="text-2xl font-bold text-blue-600">{(reportData.collectionRate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ফ্ল্যাট</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মোট ভাড়া</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">পরিশোধিত</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.records?.length > 0 ? reportData.records.map((r: any) => {
                        const paid = r.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                        return (
                          <tr key={r.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.flat.flatNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳ {r.total}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">৳ {paid}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                r.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 
                                r.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {r.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">কোন রেকর্ড পাওয়া যায়নি</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {reportData.type === "tenant" && (
                <div>
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">সর্বমোট পরিশোধিত (Total Paid)</p>
                      <p className="text-2xl font-bold text-green-600">৳ {reportData.totalPaid}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">মোট পেমেন্ট সংখ্যা</p>
                      <p className="text-2xl font-bold text-blue-600">{reportData.paymentCount} বার</p>
                    </div>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">তারিখ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ভাড়া মাস</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">পরিমাণ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">পদ্ধতি</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.payments?.length > 0 ? reportData.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(p.createdAt).toLocaleDateString('bn-BD')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getMonthName(p.rentRecord?.month)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">৳ {p.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.method || "-"}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">কোন রেকর্ড পাওয়া যায়নি</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
