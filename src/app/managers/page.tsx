// Manager Management Page
"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n/bn";
import BackButton from '@/components/common/BackButton';

type Manager = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type Building = {
  id: string;
  name: string;
};

export default function ManagersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = translations;
  const [managers, setManagers] = useState<Manager[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "OWNER") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [managerRes, buildingRes] = await Promise.all([
          fetch("/api/owner/managers"),
          fetch("/api/buildings"),
        ]);

        if (!managerRes.ok) {
          throw new Error("Failed to fetch managers");
        }
        if (!buildingRes.ok) {
          throw new Error("Failed to fetch buildings");
        }

        const managerData = await managerRes.json();
        const buildingData = await buildingRes.json();

        setManagers(Array.isArray(managerData) ? managerData : []);
        setBuildings(Array.isArray(buildingData) ? buildingData : []);
      } catch (error) {
        console.error("Error loading managers:", error);
        setManagers([]);
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && (session?.user as any)?.role === "OWNER") {
      loadData();
    }
  }, [status, session]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const response = await fetch("/api/owner/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data?.error || t.messages.somethingWentWrong);
        return;
      }

      const created = await response.json();
      setManagers((prev) => [created, ...prev]);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
      });
      setMessage(t.messages.operationSuccessful);
    } catch {
      setMessage(t.messages.somethingWentWrong);
    }
  };

  const handleEdit = (manager: Manager) => {
    setEditingId(manager.id);
    setForm({
      firstName: manager.firstName,
      lastName: manager.lastName || "",
      email: manager.email || "",
      phone: manager.phone || "",
      password: "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setMessage(null);

    try {
      const response = await fetch("/api/owner/managers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          email: form.email,
          phone: form.phone || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data?.error || t.messages.somethingWentWrong);
        return;
      }

      const updated = await response.json();
      setManagers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
      });
      setMessage(t.messages.operationSuccessful);
    } catch {
      setMessage(t.messages.somethingWentWrong);
    }
  };

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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <BackButton />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t.managers.title}
        </h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t.common.logout}
        </button>
      </div>

      {message && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 mb-4">
          {message}
        </div>
      )}

      <form
        onSubmit={editingId ? handleUpdate : handleCreate}
        className="bg-white shadow rounded-lg p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {editingId ? t.managers.editManager : t.managers.addManager}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t.auth.firstName}
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t.auth.lastName}
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t.auth.email}
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t.auth.phone}
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            />
          </div>

          {!editingId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.auth.password}
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                  required
                />
              </div>


            </>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          {editingId ? t.common.save : t.common.add}
        </button>
      </form>

      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t.managers.managerList}
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {managers.length === 0 ? (
            <div className="px-4 py-5 text-gray-600">{t.managers.noManagers}</div>
          ) : (
            managers.map((manager) => (
              <div key={manager.id} className="px-4 py-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {manager.firstName} {manager.lastName || ""}
                  </p>
                  <p className="text-sm text-gray-600">
                    {manager.email || ""} {manager.phone ? `• ${manager.phone}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleEdit(manager)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {t.common.edit}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
