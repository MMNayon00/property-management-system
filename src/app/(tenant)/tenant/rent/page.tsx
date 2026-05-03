"use client";

import { useState, useEffect } from "react";
import { Receipt, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import translations from "@/lib/i18n/bn";

export default function TenantRentPage() {
  const [rentHistory, setRentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/tenant/rent-history");
        if (res.ok) setRentHistory(await res.json());
      } catch (error) {
        console.error("Error fetching rent history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <Receipt className="text-blue-600 w-8 h-8" />
        <h1 className="text-2xl font-bold text-gray-800">{t.tenantPortal.myRent}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm md:text-base">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">{t.rent.month}</th>
                <th className="px-6 py-4 font-semibold">{t.rent.total}</th>
                <th className="px-6 py-4 font-semibold">{t.payments.amount}</th>
                <th className="px-6 py-4 font-semibold">{t.rent.paymentStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rentHistory.length > 0 ? rentHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{record.month}</td>
                  <td className="px-6 py-4 font-semibold">৳{record.total}</td>
                  <td className="px-6 py-4">
                    ৳{record.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0}
                  </td>
                  <td className="px-6 py-4">
                    {record.paymentStatus === "PAID" ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {t.tenantPortal.statusPaid}
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center font-medium">
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
