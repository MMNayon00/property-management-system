// Owner Dashboard
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n/bn";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
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
        const response = await fetch("/api/buildings");
        const buildings: unknown[] = await response.json();

        let totalFlats = 0;
        const monthlyIncome = 0;

        (buildings as Array<{ flats?: { length: number } }>).forEach((building) => {
          totalFlats += building.flats?.length || 0;
        });

        setStats({
          totalBuildings: buildings.length,
          totalFlats,
          monthlyIncome,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "OWNER") {
      fetchStats();
    }
  }, [session]);

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
        <h1 className="text-3xl font-bold text-gray-900">
          {t.dashboard.welcome}, {session?.user?.name}
        </h1>

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
