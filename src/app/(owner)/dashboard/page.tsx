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
  const [stats, setStats] = useState<
    | {
        totalBuildings: number;
        totalFlats: number;
        totalTenants: number;
        occupiedFlats: number;
        vacantFlats: number;
        unpaidRent: number;
        monthlyIncome: number;
      }
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const t = translations;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/owner/overview");
        const overview = await response.json();
        setStats(overview);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && (session?.user?.role === "OWNER" || session?.user?.role === "MANAGER")) {
      fetchStats();
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [session, status]);

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
