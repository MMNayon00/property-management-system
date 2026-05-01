// Owner Dashboard
"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n/bn";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unpaidRents, setUnpaidRents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{type: 'warning' | 'error', message: string, count?: number}[]>([]);
  const t = translations;

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long' });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/owner/overview");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const overview = await response.json();
        setStats(overview);

        // Fetch unpaid rent details for alerts
        const unpaidResponse = await fetch("/api/rent?status=UNPAID");
        if (!unpaidResponse.ok) {
          throw new Error(`API error: ${unpaidResponse.status}`);
        }
        const unpaidData = await unpaidResponse.json();
        setUnpaidRents(Array.isArray(unpaidData) ? unpaidData : []);

        // Generate alerts based on unpaid rents
        const newAlerts: {type: 'warning' | 'error', message: string, count?: number}[] = [];
        
        if (overview.unpaidRent > 0) {
          newAlerts.push({
            type: 'error',
            message: `দখলীকৃত ফ্ল্যাটগুলোতে ${overview.unpaidRent}টি বকেয়া ভাড়া রয়েছে`,
            count: overview.unpaidRent
          });
        }

        setAlerts(newAlerts);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // If authentication fails, redirect to login
        if (error instanceof Error && error.message.includes('401')) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && ((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "MANAGER")) {
      fetchStats();
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t.common.loading}</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            {t.dashboard.welcome}, {session?.user?.name}
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t.common.logout}
          </button>
        </div>

        {/* Automatic Red Alerts for Unpaid Rents */}
        {alerts.length > 0 && (
          <div className="mt-6 space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className={`rounded-md p-4 ${
                alert.type === 'error' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {alert.type === 'error' ? (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      alert.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {alert.type === 'error' ? 'বকেয়া ভাড়া সতর্কতা' : 'সতর্কতা'}
                    </h3>
                    <div className={`mt-2 text-sm ${
                      alert.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      <p>{alert.message}</p>
                      <div className="mt-3 flex space-x-3">
                        <button
                          onClick={() => router.push('/payments')}
                          className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition"
                        >
                          ভাড়া পরিশোধ করুন
                        </button>
                        <button
                          onClick={() => router.push('/reports')}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition"
                        >
                          রিপোর্ট দেখুন
                        </button>
                      </div>
                      {alert.count && alert.count > 0 && (
                        <div className="mt-3">
                          <div className="-my-2 -mx-px overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        বিল্ডিং
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ফ্ল্যাট
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        মাস
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        বাকি পরিমাণ
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {unpaidRents.slice(0, 5).map((rent) => {
                                      const paid = rent.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                                      const remaining = rent.total - paid;
                                      return (
                                        <tr key={rent.id}>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {rent.flat?.building?.name}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {rent.flat?.flatNumber}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getMonthName(rent.month)}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                            ৳{remaining.toLocaleString('bn-BD')}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                                {unpaidRents.length > 5 && (
                                  <div className="bg-gray-50 px-6 py-3 text-center">
                                    <p className="text-sm text-gray-500">
                                      এবং আরও {unpaidRents.length - 5}টি বকেয়া ভাড়া...
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t.dashboard.totalBuildings}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.totalBuildings || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t.dashboard.totalFlats}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.totalFlats || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t.dashboard.monthlyIncome}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {formatCurrency(stats?.monthlyIncome || 0)}
              </dd>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t.dashboard.totalTenants}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.totalTenants || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t.dashboard.occupiedFlats}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.occupiedFlats || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t.dashboard.vacantFlats}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.vacantFlats || 0}
              </dd>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t.dashboard.unpaidRent}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.unpaidRent || 0}
              </dd>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t.nav.buildings}
          </h2>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <p className="text-gray-600">
                বাড়ি সংখ্যা: {stats?.totalBuildings || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
