"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";
import BackButton from '@/components/common/BackButton';

interface Flat {
  id: string;
  flatNumber: string;
  floor: number | null;
  baseRent: number;
  status: "VACANT" | "OCCUPIED";
  currentTenant?: { name: string } | null;
}

interface Building {
  id: string;
  name: string;
}

export default function FlatsPage() {
  const { data: session, status } = useSession();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: "", flatNumber: "", floor: "", baseRent: "", status: "VACANT" });
  const [submitting, setSubmitting] = useState(false);
  
  const t = translations;

  useEffect(() => {
    if (status === "authenticated") {
      fetchBuildings();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  useEffect(() => {
    if (selectedBuildingId) {
      fetchFlats(selectedBuildingId);
    } else {
      setFlats([]);
    }
  }, [selectedBuildingId]);

  const fetchBuildings = async () => {
    try {
      const res = await fetch("/api/buildings", { cache: "no-store" });
      const data = await res.json();
      setBuildings(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedBuildingId(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      setLoading(false);
    }
  };

  const fetchFlats = async (buildingId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flats?buildingId=${buildingId}`, { cache: "no-store" });
      const data = await res.json();
      setFlats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching flats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (flat?: Flat) => {
    if (flat) {
      setIsEditing(true);
      setFormData({
        id: flat.id,
        flatNumber: flat.flatNumber,
        floor: flat.floor?.toString() || "",
        baseRent: flat.baseRent.toString(),
        status: flat.status,
      });
    } else {
      setIsEditing(false);
      setFormData({ id: "", flatNumber: "", floor: "", baseRent: "", status: "VACANT" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId) return;
    setSubmitting(true);

    const payload = {
      flatNumber: formData.flatNumber,
      floor: formData.floor ? parseInt(formData.floor) : undefined,
      baseRent: parseInt(formData.baseRent),
      status: formData.status,
    };

    try {
      let res;
      if (isEditing) {
        res = await fetch(`/api/flats/${formData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/flats?buildingId=${selectedBuildingId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        alert("Error: " + (errorData.error || "Failed to save flat"));
        return;
      }
      
      setShowModal(false);
      fetchFlats(selectedBuildingId);
    } catch (error) {
      console.error("Error saving flat:", error);
      alert("Error saving flat. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.messages.confirmDelete)) return;
    try {
      await fetch(`/api/flats/${id}`, { method: "DELETE" });
      fetchFlats(selectedBuildingId);
    } catch (error) {
      console.error("Error deleting flat:", error);
    }
  };

  if (status === "loading" || (loading && buildings.length === 0)) {
    return <div className="flex justify-center py-10"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.flats.flats}</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {buildings.length > 0 && (
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>বিল্ডিং নির্বাচন করুন</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => handleOpenModal()}
            disabled={!selectedBuildingId}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition disabled:opacity-50"
          >
            {t.flats.addFlat}
          </button>
        </div>
      </div>

      {!selectedBuildingId ? (
        <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
          প্রথমে একটি বিল্ডিং নির্বাচন করুন বা নতুন বিল্ডিং যোগ করুন।
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500">{t.common.loading}</div>
          ) : flats.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{t.flats.noFlats}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.flats.flatNumber}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.flats.floor}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.flats.baseRent}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.flats.status}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.flats.tenant}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">কর্ম</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flats.map((flat) => (
                  <tr key={flat.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{flat.flatNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.floor || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">৳ {flat.baseRent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${flat.status === 'OCCUPIED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {flat.status === 'OCCUPIED' ? t.flats.occupied : t.flats.vacant}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flat.currentTenant?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => handleOpenModal(flat)} className="text-blue-600 hover:text-blue-900">
                        {t.common.edit}
                      </button>
                      <button onClick={() => handleDelete(flat.id)} className="text-red-600 hover:text-red-900">
                        {t.common.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? t.flats.editFlat : t.flats.addFlat}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.flats.flatNumber}</label>
                <input
                  type="text"
                  required
                  value={formData.flatNumber}
                  onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.flats.floor}</label>
                <input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.flats.baseRent} (৳)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.baseRent}
                  onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.flats.status}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="VACANT">{t.flats.vacant}</option>
                  <option value="OCCUPIED">{t.flats.occupied}</option>
                </select>
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
