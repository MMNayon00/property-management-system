"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import translations from "@/lib/i18n/bn";

type Tenant = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  nidNumber: string | null;
  moveInDate: string | null;
  flatNumber: string;
  buildingName: string;
  flatId: string;
};

type Flat = {
  id: string;
  flatNumber: string;
  buildingName: string;
  baseRent: number;
  status: "VACANT" | "OCCUPIED";
};

export default function ManagerTenants() {
  const t = translations;
  const searchParams = useSearchParams();
  const flatFilter = searchParams.get("flat");

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [vacantFlats, setVacantFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    nidNumber: "",
    flatId: "",
    moveInDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (flatFilter) {
      setForm(prev => ({ ...prev, flatId: flatFilter }));
      setShowForm(true);
    }
  }, [flatFilter]);

  const loadData = async () => {
    try {
      const [tenantsRes, flatsRes] = await Promise.all([
        fetch("/api/manager/tenants"),
        fetch("/api/manager/vacant-flats"),
      ]);

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData);
      }

      if (flatsRes.ok) {
        const flatsData = await flatsRes.json();
        setVacantFlats(flatsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTenant
        ? `/api/manager/tenants/${editingTenant.id}`
        : "/api/manager/tenants";

      const method = editingTenant ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setMessage(editingTenant ? t.tenants.tenantUpdated : t.tenants.tenantAdded);
        setShowForm(false);
        setEditingTenant(null);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        setMessage(error.error || "Error occurred");
      }
    } catch (error) {
      setMessage("Error occurred");
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name,
      phone: tenant.phone || "",
      whatsapp: tenant.whatsapp || "",
      nidNumber: tenant.nidNumber || "",
      flatId: tenant.flatId,
      moveInDate: tenant.moveInDate || new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleMoveOut = async (tenantId: string) => {
    if (!confirm("আপনি কি এই ভাড়াটিয়াকে উচ্ছেদ করতে চান?")) return;

    try {
      const response = await fetch(`/api/manager/tenants/${tenantId}/move-out`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage("ভাড়াটিয়া সফলভাবে উচ্ছেদ করা হয়েছে");
        loadData();
      } else {
        const error = await response.json();
        setMessage(error.error || "Error occurred");
      }
    } catch (error) {
      setMessage("Error occurred");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      whatsapp: "",
      nidNumber: "",
      flatId: "",
      moveInDate: new Date().toISOString().split('T')[0],
    });
  };

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
            {t.tenants.tenants}
          </h1>
          <p className="text-gray-600 mt-1">
            ভাড়াটিয়া ব্যবস্থাপনা
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingTenant(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t.tenants.addTenant}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="float-right ml-4 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingTenant ? t.tenants.editTenant : t.tenants.addTenant}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.tenants.name} *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.tenants.phone}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.tenants.whatsapp}
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.tenants.nidNumber}
                </label>
                <input
                  type="text"
                  value={form.nidNumber}
                  onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ফ্ল্যাট *
                </label>
                <select
                  required
                  value={form.flatId}
                  onChange={(e) => setForm({ ...form, flatId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">ফ্ল্যাট নির্বাচন করুন</option>
                  {vacantFlats.map((flat) => (
                    <option key={flat.id} value={flat.id}>
                      {flat.buildingName} - {flat.flatNumber} (৳{flat.baseRent})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.tenants.moveInDate} *
                </label>
                <input
                  type="date"
                  required
                  value={form.moveInDate}
                  onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTenant(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t.common.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenants Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.tenants.name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.tenants.phone}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ফ্ল্যাট
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  বাড়ি
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.tenants.moveInDate}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  কাজ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t.tenants.noTenants}
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.flatNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.buildingName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString('bn') : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(tenant)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t.common.edit}
                        </button>
                        <button
                          onClick={() => handleMoveOut(tenant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          উচ্ছেদ
                        </button>
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