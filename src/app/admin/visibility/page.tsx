"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";

export default function SystemVisibilityPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"buildings" | "flats" | "tenants">("buildings");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const t = translations;

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session, activeTab, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("type", activeTab);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/admin/visibility?${params.toString()}`);
      const json = await res.json();
      setData(json || []);
    } catch (error) {
      console.error("Error fetching visibility data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.systemVisibility}</h1>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("buildings")}
              className={`${
                activeTab === "buildings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {t.buildings.buildings}
            </button>
            <button
              onClick={() => setActiveTab("flats")}
              className={`${
                activeTab === "flats"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {t.flats.flats}
            </button>
            <button
              onClick={() => setActiveTab("tenants")}
              className={`${
                activeTab === "tenants"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {t.tenants.tenants}
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">{t.common.loading}</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-gray-500">কোন তথ্য পাওয়া যায়নি</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              {activeTab === "buildings" && (
                <>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">নাম</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ঠিকানা</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মালিক</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মোট ফ্ল্যাট</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.owner.firstName} {item.owner.lastName || ""} <br />
                          <span className="text-xs text-gray-400">{item.owner.phone}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item._count?.flats || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === "flats" && (
                <>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ফ্ল্যাট নম্বর</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">বাড়ি</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মালিক</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ভাড়াটিয়া</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.flatNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.building?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.building?.owner?.firstName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentTenant?.name || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${item.status === 'OCCUPIED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {item.status === 'OCCUPIED' ? t.flats.occupied : t.flats.vacant}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === "tenants" && (
                <>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">নাম</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ফোন</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">বর্তমান ফ্ল্যাট</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.currentFlat ? `${item.currentFlat.building.name} - ${item.currentFlat.flatNumber}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
