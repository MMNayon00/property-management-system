"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";

interface Building {
  id: string;
  name: string;
  address: string;
  area: string | null;
  flats: any[];
}

export default function BuildingsPage() {
  const { data: session, status } = useSession();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", address: "", area: "" });
  const [submitting, setSubmitting] = useState(false);
  
  const t = translations;

  useEffect(() => {
    if (status === "authenticated" && (session?.user?.role === "OWNER" || session?.user?.role === "ADMIN")) {
      fetchBuildings();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/buildings", { cache: "no-store" });
      const data = await res.json();
      setBuildings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching buildings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (building?: Building) => {
    if (building) {
      setIsEditing(true);
      setFormData({
        id: building.id,
        name: building.name,
        address: building.address,
        area: building.area || "",
      });
    } else {
      setIsEditing(false);
      setFormData({ id: "", name: "", address: "", area: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        await fetch(`/api/buildings/${formData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            address: formData.address,
            area: formData.area,
          }),
        });
      } else {
        await fetch("/api/buildings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            address: formData.address,
            area: formData.area,
          }),
        });
      }
      setShowModal(false);
      fetchBuildings();
    } catch (error) {
      console.error("Error saving building:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.messages.confirmDelete)) return;
    try {
      await fetch(`/api/buildings/${id}`, { method: "DELETE" });
      fetchBuildings();
    } catch (error) {
      console.error("Error deleting building:", error);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-10"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.buildings.buildings}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition"
        >
          {t.buildings.addBuilding}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {buildings.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t.buildings.noBuildings}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.buildings.name}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.buildings.address}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.buildings.area}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.buildings.totalFlats}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">কর্ম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buildings.map((building) => (
                <tr key={building.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{building.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{building.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{building.area || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{building.flats?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button onClick={() => handleOpenModal(building)} className="text-blue-600 hover:text-blue-900">
                      {t.common.edit}
                    </button>
                    <button onClick={() => handleDelete(building.id)} className="text-red-600 hover:text-red-900">
                      {t.common.delete}
                    </button>
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
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? t.buildings.editBuilding : t.buildings.addBuilding}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.buildings.name}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.buildings.address}</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.buildings.area}</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
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
