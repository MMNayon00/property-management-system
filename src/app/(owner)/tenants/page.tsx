"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";

interface Flat {
  id: string;
  flatNumber: string;
  building: { name: string };
  status: string;
}

interface Tenant {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  nidNumber: string | null;
  currentFlat?: Flat | null;
  history: any[];
}

export default function TenantsPage() {
  const { data: session, status } = useSession();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Available flats & buildings for assigning
  const [availableBuildings, setAvailableBuildings] = useState<{id: string, name: string}[]>([]);
  const [availableFlats, setAvailableFlats] = useState<Flat[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: "", name: "", phone: "", whatsapp: "", nidNumber: "", buildingId: "", flatId: "", moveInDate: "" 
  });
  const [submitting, setSubmitting] = useState(false);
  
  const t = translations;

  useEffect(() => {
    // Set initial date only on client side to prevent hydration mismatch
    setFormData(prev => ({ ...prev, moveInDate: new Date().toISOString().split('T')[0] }));
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTenants();
      fetchAvailableFlats();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenants", { cache: "no-store" });
      const data = await res.json();
      setTenants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFlats = async () => {
    try {
      const res = await fetch("/api/buildings", { cache: "no-store" });
      if (!res.ok) {
        console.error("Error response from /api/buildings:", await res.text());
        return;
      }
      const buildings = await res.json();
      if (!Array.isArray(buildings)) {
        console.error("Expected array from /api/buildings, got:", buildings);
        return;
      }
      let vacantFlats: Flat[] = [];
      let buildingsList: {id: string, name: string}[] = [];
      for (const b of buildings) {
        buildingsList.push({ id: b.id, name: b.name });
        if (b.flats) {
          const v = b.flats.filter((f: any) => f.status === "VACANT").map((f: any) => ({
            ...f,
            building: { name: b.name },
            buildingId: b.id
          }));
          vacantFlats = [...vacantFlats, ...v];
        }
      }
      setAvailableBuildings(buildingsList);
      setAvailableFlats(vacantFlats);
    } catch (error) {
      console.error("Error fetching available flats:", error);
    }
  };

  const handleOpenModal = (tenant?: Tenant) => {
    if (tenant) {
      setIsEditing(true);
      setFormData({
        id: tenant.id,
        name: tenant.name,
        phone: tenant.phone || "",
        whatsapp: tenant.whatsapp || "",
        nidNumber: tenant.nidNumber || "",
        flatId: tenant.currentFlat?.id || "",
        buildingId: "",
        moveInDate: "",
      });
    } else {
      setIsEditing(false);
      setFormData({ id: "", name: "", phone: "", whatsapp: "", nidNumber: "", buildingId: "", flatId: "", moveInDate: new Date().toISOString().split('T')[0] });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let res;
      if (isEditing) {
        res = await fetch(`/api/tenants/${formData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            nidNumber: formData.nidNumber,
          }),
        });
      } else {
        res = await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            nidNumber: formData.nidNumber,
            flatId: formData.flatId,
            moveInDate: formData.moveInDate,
          }),
        });
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        alert("Error: " + (errorData.error || "Failed to save tenant"));
        return;
      }
      
      setShowModal(false);
      fetchTenants();
      fetchAvailableFlats();
    } catch (error) {
      console.error("Error saving tenant:", error);
      alert("Error saving tenant. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveOut = async (tenantId: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই ভাড়াটিয়াকে ফ্ল্যাট থেকে সরাতে চান?")) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await fetch(`/api/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moveOutDate: today }),
      });
      fetchTenants();
      fetchAvailableFlats();
    } catch (error) {
      console.error("Error moving out tenant:", error);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.phone && t.phone.includes(searchQuery))
  );

  if (status === "loading" || loading) {
    return <div className="flex justify-center py-10"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.tenants.tenants}</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition"
          >
            {t.tenants.addTenant}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredTenants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t.tenants.noTenants}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.tenants.name}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.tenants.phone}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ফ্ল্যাট</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">কর্ম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tenant.name}
                    <div className="text-xs text-gray-400">NID: {tenant.nidNumber || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.phone || "-"}
                    {tenant.whatsapp && <span className="block text-xs text-green-600">WA: {tenant.whatsapp}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.currentFlat ? `${tenant.currentFlat.building.name} - ${tenant.currentFlat.flatNumber}` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.currentFlat ? (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                        সক্রিয়
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                        সাবেক
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button onClick={() => handleOpenModal(tenant)} className="text-blue-600 hover:text-blue-900">
                      {t.common.edit}
                    </button>
                    {tenant.currentFlat && (
                      <button onClick={() => handleMoveOut(tenant.id)} className="text-orange-600 hover:text-orange-900">
                        সরান (Move Out)
                      </button>
                    )}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? t.tenants.editTenant : t.tenants.addTenant}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.tenants.name}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.tenants.phone}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.tenants.whatsapp}</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.tenants.nidNumber}</label>
                <input
                  type="text"
                  value={formData.nidNumber}
                  onChange={(e) => setFormData({ ...formData, nidNumber: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {!isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">বিল্ডিং নির্বাচন করুন</label>
                    <select
                      required
                      value={formData.buildingId}
                      onChange={(e) => {
                        const newBuildingId = e.target.value;
                        const flatsForBuilding = availableFlats.filter((f: any) => f.buildingId === newBuildingId);
                        setFormData({ 
                          ...formData, 
                          buildingId: newBuildingId, 
                          flatId: flatsForBuilding.length === 1 ? flatsForBuilding[0].id : "" 
                        });
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="" disabled>বিল্ডিং নির্বাচন করুন</option>
                      {availableBuildings.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  {formData.buildingId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ফ্ল্যাট নির্বাচন করুন</label>
                      <select
                        required
                        value={formData.flatId}
                        onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="" disabled>ফ্ল্যাট নির্বাচন করুন</option>
                        {availableFlats.filter((f: any) => f.buildingId === formData.buildingId).length === 0 ? (
                          <option value="" disabled>এই বিল্ডিংয়ে কোনো খালি ফ্ল্যাট নেই</option>
                        ) : (
                          availableFlats.filter((f: any) => f.buildingId === formData.buildingId).map((f) => (
                            <option key={f.id} value={f.id}>{f.building.name} - {f.flatNumber}</option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t.tenants.moveInDate}</label>
                    <input
                      type="date"
                      required
                      value={formData.moveInDate}
                      onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </>
              )}
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
