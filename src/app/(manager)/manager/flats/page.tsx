"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import translations from "@/lib/i18n/bn";

type Flat = {
  id: string;
  flatNumber: string;
  floor: number | null;
  baseRent: number;
  status: "VACANT" | "OCCUPIED";
  buildingName: string;
  tenantName: string | null;
  tenantPhone: string | null;
};

export default function ManagerFlats() {
  const t = translations;
  const searchParams = useSearchParams();
  const buildingFilter = searchParams.get("building");

  const [flats, setFlats] = useState<Flat[]>([]);
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>(buildingFilter || "");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [flatsRes, buildingsRes] = await Promise.all([
          fetch("/api/manager/flats"),
          fetch("/api/manager/buildings"),
        ]);

        if (flatsRes.ok) {
          const flatsData = await flatsRes.json();
          setFlats(flatsData);
        }

        if (buildingsRes.ok) {
          const buildingsData = await buildingsRes.json();
          setBuildings(buildingsData.map((b: any) => ({ id: b.id, name: b.name })));
        }
      } catch (error) {
        console.error("Error loading flats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredFlats = selectedBuilding
    ? flats.filter(flat => buildings.find(b => b.name === flat.buildingName)?.id === selectedBuilding)
    : flats;

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.flats.flats}
          </h1>
          <p className="text-gray-600 mt-1">
            আপনার পরিচালিত বাড়ির ফ্ল্যাটগুলো
          </p>
        </div>
        <a
          href="/manager/tenants"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ভাড়াটিয়া যোগ করুন
        </a>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            বাড়ি ফিল্টার:
          </label>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">সব বাড়ি</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flats Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.flats.flatNumber}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  বাড়ি
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.flats.floor}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.flats.rent}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.flats.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.tenants.tenant}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  কাজ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t.flats.noFlats}
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => (
                  <tr key={flat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {flat.flatNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {flat.buildingName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flat.floor || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ৳{flat.baseRent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        flat.status === "OCCUPIED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {flat.status === "OCCUPIED" ? t.flats.occupied : t.flats.vacant}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {flat.tenantName ? (
                        <div>
                          <div className="font-medium">{flat.tenantName}</div>
                          {flat.tenantPhone && (
                            <div className="text-gray-500 text-xs">{flat.tenantPhone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {flat.status === "VACANT" ? (
                          <a
                            href={`/manager/tenants?flat=${flat.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ভাড়াটিয়া যোগ করুন
                          </a>
                        ) : (
                          <a
                            href={`/manager/tenants/${flat.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            বিস্তারিত
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}