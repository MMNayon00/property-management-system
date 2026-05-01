"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";
import BackButton from '@/components/common/BackButton';

interface Flat {
  id: string;
  flatNumber: string;
  baseRent: number;
  buildingId: string;
  building: { name: string };
}

interface RentRecord {
  id: string;
  flatId: string;
  flat: Flat;
  month: string; // format: "YYYY-MM"
  baseRent: number;
  extraCharges: number;
  serviceCharges: number;
  total: number;
  paymentStatus: string;
}

export default function RentPage() {
  const { data: session, status } = useSession();
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Available flats for generating rent
  const [availableFlats, setAvailableFlats] = useState<Flat[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    flatId: "", 
    buildingId: "",
    year: new Date().getFullYear().toString(), 
    month: (new Date().getMonth() + 1).toString(), 
    baseRent: "0", 
    extraCharges: "0", 
    serviceCharges: "0" 
  });
  const [submitting, setSubmitting] = useState(false);
  
  const t = translations;

  useEffect(() => {
    if (status === "authenticated") {
      fetchRentRecords();
      fetchAvailableFlats();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchRentRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rent", { cache: "no-store" });
      const data = await res.json();
      setRentRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching rent records:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFlats = async () => {
    try {
      const res = await fetch("/api/buildings", { cache: "no-store" });
      const buildings = await res.json();
      let flats: Flat[] = [];
      for (const b of buildings) {
        if (b.flats) {
          const fList = b.flats.filter((f: any) => f.status === "OCCUPIED").map((f: any) => ({
            ...f,
            building: { name: b.name }
          }));
          flats = [...flats, ...fList];
        }
      }
      setAvailableFlats(flats);
    } catch (error) {
      console.error("Error fetching available flats:", error);
    }
  };

  const handleFlatChange = (flatId: string) => {
    const flat = availableFlats.find(f => f.id === flatId);
    if (flat) {
      setFormData(prev => ({
        ...prev,
        flatId: flat.id,
        buildingId: flat.buildingId,
        baseRent: flat.baseRent.toString()
      }));
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatId: formData.flatId,
          buildingId: formData.buildingId,
          month: `${formData.year}-${formData.month.padStart(2, '0')}`,
          baseRent: parseInt(formData.baseRent),
          extraCharges: parseInt(formData.extraCharges || "0"),
          serviceCharges: parseInt(formData.serviceCharges || "0"),
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to create rent record");
      } else {
        setShowModal(false);
        fetchRentRecords();
      }
    } catch (error) {
      console.error("Error saving rent record:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getMonthName = (monthStr?: string | number) => {
    if (!monthStr) return "";
    if (typeof monthStr === "number") {
      const date = new Date();
      date.setMonth(monthStr - 1);
      return date.toLocaleString('bn-BD', { month: 'long' });
    }
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-10"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.rent.rentManagement}</h1>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition"
        >
          নতুন ভাড়া রেকর্ড তৈরি করুন
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {rentRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t.rent.noRentRecords}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মাস/বছর</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ফ্ল্যাট</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.rent.baseRent}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">অন্যান্য চার্জ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.rent.total}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.rent.paymentStatus}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getMonthName(record.month)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.flat?.building?.name} - {record.flat?.flatNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">৳ {record.baseRent}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ৳ {record.extraCharges + record.serviceCharges}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">৳ {record.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      record.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 
                      record.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.paymentStatus === 'PAID' ? t.rent.paid : 
                       record.paymentStatus === 'PARTIAL' ? t.rent.partial : 
                       t.rent.unpaid}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">নতুন ভাড়া রেকর্ড</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ফ্ল্যাট নির্বাচন করুন</label>
                <select
                  required
                  value={formData.flatId}
                  onChange={(e) => handleFlatChange(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" disabled>ফ্ল্যাট নির্বাচন করুন</option>
                  {availableFlats.map((f) => (
                    <option key={f.id} value={f.id}>{f.building.name} - {f.flatNumber}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.rent.month}</label>
                  <select
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.rent.year}</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.rent.baseRent} (৳)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.baseRent}
                  onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.rent.extraCharges} (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.extraCharges}
                    onChange={(e) => setFormData({ ...formData, extraCharges: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.rent.serviceCharges} (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.serviceCharges}
                    onChange={(e) => setFormData({ ...formData, serviceCharges: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
