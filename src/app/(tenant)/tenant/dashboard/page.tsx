"use client";

import { useState, useEffect } from "react";
import { 
  Receipt, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  Clock
} from "lucide-react";
import translations from "@/lib/i18n/bn";

export default function TenantDashboard() {
  const [statusData, setStatusData] = useState<any>(null);
  const [rentHistory, setRentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, historyRes] = await Promise.all([
          fetch("/api/tenant/current-status"),
          fetch("/api/tenant/rent-history")
        ]);

        if (statusRes.ok) setStatusData(await statusRes.json());
        if (historyRes.ok) setRentHistory(await historyRes.json());
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const summary = statusData?.summary || { totalRent: 0, paidAmount: 0, dueAmount: 0, totalMonths: 0 };
  const currentRecord = statusData?.currentRecord;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Welcome Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.dashboard.welcome}!</h1>
          <p className="text-gray-500">{t.tenantPortal.title}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          <Calendar className="text-blue-600" />
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <CheckCircle2 className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t.tenantPortal.totalPaid}</p>
            <p className="text-xl font-bold text-gray-800">৳{summary.paidAmount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-red-100 flex items-start space-x-4">
          <div className="bg-red-50 p-3 rounded-lg">
            <AlertCircle className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-red-500 font-bold">মোট বাকি (Total Due)</p>
            <p className="text-2xl font-black text-red-600">৳{summary.dueAmount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Receipt className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t.tenantPortal.totalMonths}</p>
            <p className="text-xl font-bold text-gray-800">{summary.totalMonths || 0} {t.rent.month}</p>
          </div>
        </div>
      </div>

      {/* Unpaid Months List (Critical Requirement) */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-6">
        <h2 className="text-red-800 font-bold flex items-center mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          🔴 বাকি মাসসমূহ (Unpaid Months)
        </h2>
        {statusData?.unpaidMonths && statusData.unpaidMonths.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusData.unpaidMonths.map((record: any) => (
              <div key={record.id} className="bg-white p-4 rounded-lg shadow-sm border border-red-200 flex justify-between items-center transition-transform hover:scale-[1.02]">
                <div>
                  <p className="text-sm font-bold text-gray-700">{record.month}</p>
                  <p className="text-xs text-gray-500">মোট: ৳{record.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-black">৳{record.due || 0} বাকি</p>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase font-bold">{record.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-green-600 text-sm flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            আপনার কোনো বকেয়া নেই (No outstanding dues)
          </p>
        )}
      </div>

      {/* Current Month Rent Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            📅 বর্তমান মাস ({statusData?.currentMonth})
          </h2>
          {currentRecord?.paymentStatus === "PAID" ? (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium uppercase">
              {t.tenantPortal.statusPaid}
            </span>
          ) : (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium uppercase">
              {t.tenantPortal.statusUnpaid}
            </span>
          )}
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{t.tenantPortal.totalRent}</p>
            <p className="text-lg font-bold">৳{currentRecord?.totalAmount || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{t.rent.baseRent}</p>
            <p className="text-lg font-semibold">৳{currentRecord?.baseRent || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{t.rent.extraCharges}</p>
            <p className="text-lg font-semibold">৳{(currentRecord?.extraCharges || 0) + (currentRecord?.serviceCharges || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{t.tenantPortal.paidAmount}</p>
            <p className="text-lg font-bold text-green-600">
              ৳{currentRecord?.paidAmount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{t.tenantPortal.dueAmount}</p>
            <p className="text-lg font-bold text-red-600">
              ৳{currentRecord?.dueAmount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Rent History List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">{t.tenantPortal.rentHistory}</h2>
          <button 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            onClick={() => window.open('/api/reports/tenant/pdf', '_blank')}
          >
            <Download className="w-4 h-4 mr-1" />
            {t.tenantPortal.downloadReport}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">{t.rent.month}</th>
                <th className="px-6 py-3 font-semibold">{t.rent.total}</th>
                <th className="px-6 py-3 font-semibold">{t.payments.amount}</th>
                <th className="px-6 py-3 font-semibold">{t.rent.paymentStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rentHistory.length > 0 ? rentHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{record.month}</td>
                  <td className="px-6 py-4 font-semibold">৳{record.totalAmount}</td>
                  <td className="px-6 py-4">
                    ৳{record.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0}
                  </td>
                  <td className="px-6 py-4">
                    {record.paymentStatus === "PAID" ? (
                      <span className="text-green-600 flex items-center text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {t.tenantPortal.statusPaid}
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center text-sm font-medium">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {t.tenantPortal.statusUnpaid}
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    {t.rent.noRentRecords}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
