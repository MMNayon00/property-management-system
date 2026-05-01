"use client";

import { useEffect, useState } from "react";
import translations from "@/lib/i18n/bn";
import BackButton from '@/components/common/BackButton';

type Building = {
  id: string;
  name: string;
  address: string;
  area: string | null;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
};

export default function ManagerBuildings() {
  const t = translations;
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const response = await fetch("/api/manager/buildings");
        if (response.ok) {
          const data = await response.json();
          setBuildings(data);
        }
      } catch (error) {
        console.error("Error loading buildings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBuildings();
  }, []);

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
      <BackButton />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.buildings.buildings}
        </h1>
        <p className="text-gray-600 mt-1">
          আপনার পরিচালিত বাড়িগুলো
        </p>
      </div>

      {/* Buildings Grid */}
      {buildings.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500">{t.buildings.noBuildings}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <div key={building.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{building.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{building.address}</p>
                  {building.area && (
                    <p className="text-sm text-gray-500">{building.area}</p>
                  )}
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t.buildings.totalFlats}</span>
                  <span className="font-semibold">{building.totalFlats}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">দখলীকৃত ফ্ল্যাট</span>
                  <span className="font-semibold text-green-600">{building.occupiedFlats}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">খালি ফ্ল্যাট</span>
                  <span className="font-semibold text-gray-600">{building.vacantFlats}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href={`/manager/flats?building=${building.id}`}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                >
                  ফ্ল্যাট দেখুন
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}