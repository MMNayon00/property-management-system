"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n/bn";
import { Users, Building2, UserCircle, Home, DollarSign } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalOwners: number;
    totalBuildings: number;
    totalTenants: number;
    monthlyIncome: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const t = translations;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/admin/overview");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
      fetchOverview();
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  if (status === "unauthenticated" || (session?.user as any)?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.adminDashboard}</h1>
        <button
          onClick={() => {
            const { signOut } = require("next-auth/react");
            signOut({ callbackUrl: "/login" });
          }}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t.common.logout}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Total Users */}
        <div className="bg-white overflow-hidden shadow rounded-lg flex">
          <div className="p-5 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{t.admin.totalUsers}</dt>
            <dd className="mt-1 text-3xl font-extrabold text-gray-900">{stats?.totalUsers || 0}</dd>
          </div>
          <div className="bg-blue-50 w-16 flex items-center justify-center text-blue-600">
            <Users className="w-8 h-8" />
          </div>
        </div>

        {/* Total Owners */}
        <div className="bg-white overflow-hidden shadow rounded-lg flex">
          <div className="p-5 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{t.admin.totalOwners}</dt>
            <dd className="mt-1 text-3xl font-extrabold text-gray-900">{stats?.totalOwners || 0}</dd>
          </div>
          <div className="bg-green-50 w-16 flex items-center justify-center text-green-600">
            <UserCircle className="w-8 h-8" />
          </div>
        </div>


        {/* Total Buildings */}
        <div className="bg-white overflow-hidden shadow rounded-lg flex">
          <div className="p-5 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{t.admin.totalBuildings}</dt>
            <dd className="mt-1 text-3xl font-extrabold text-gray-900">{stats?.totalBuildings || 0}</dd>
          </div>
          <div className="bg-purple-50 w-16 flex items-center justify-center text-purple-600">
            <Building2 className="w-8 h-8" />
          </div>
        </div>

        {/* Total Tenants */}
        <div className="bg-white overflow-hidden shadow rounded-lg flex">
          <div className="p-5 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{t.admin.totalTenants}</dt>
            <dd className="mt-1 text-3xl font-extrabold text-gray-900">{stats?.totalTenants || 0}</dd>
          </div>
          <div className="bg-orange-50 w-16 flex items-center justify-center text-orange-600">
            <Home className="w-8 h-8" />
          </div>
        </div>

        {/* Total Monthly Income */}
        <div className="bg-white overflow-hidden shadow rounded-lg flex">
          <div className="p-5 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{t.admin.monthlyIncome}</dt>
            <dd className="mt-1 text-3xl font-extrabold text-gray-900">৳ {stats?.monthlyIncome?.toLocaleString() || 0}</dd>
          </div>
          <div className="bg-emerald-50 w-16 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>

      </div>
    </div>
  );
}
