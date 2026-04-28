"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";

export default function MonitoringPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<{
    trends: { month: number; amount: number; count: number }[];
    recentUsers: { id: string; firstName: string; email: string; role: string; createdAt: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const t = translations;

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchMonitoringData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchMonitoringData = async () => {
    try {
      const res = await fetch("/api/admin/monitoring");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  const getMonthName = (monthNum: number) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('bn-BD', { month: 'long' });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t.admin.monitoring}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Unpaid Trends */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t.admin.unpaidTrends} (বর্তমান বছর)</h2>
          {data?.trends && data.trends.some(t => t.count > 0) ? (
            <div className="space-y-4">
              {data.trends.filter(t => t.count > 0).map((trend) => (
                <div key={trend.month} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm font-medium text-gray-700">{getMonthName(trend.month)}</span>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-red-600">৳ {trend.amount.toLocaleString('bn-BD')}</span>
                    <span className="block text-xs text-gray-500">{trend.count} টি রেকর্ড বাকি</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>কোন বকেয়া ভাড়ার ডেটা পাওয়া যায়নি।</p>
            </div>
          )}
        </div>

        {/* System Logs (Recent Users) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t.admin.systemLogs} (নতুন নিবন্ধন)</h2>
          {data?.recentUsers && data.recentUsers.length > 0 ? (
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {data.recentUsers.map((user) => (
                  <li key={user.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="inline-flex items-center text-xs font-semibold text-gray-900 px-2 py-1 bg-gray-100 rounded-full">
                        {user.role}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('bn-BD')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>কোন সাম্প্রতিক লগ নেই।</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
