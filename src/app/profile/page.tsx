// Profile Page
"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n/bn";
import BackButton from '@/components/common/BackButton';

type Profile = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = translations;
  const [form, setForm] = useState<Profile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/owner/profile");
        const data = await response.json();
        setForm({
          firstName: data?.firstName || "",
          lastName: data?.lastName || "",
          email: data?.email || "",
          phone: data?.phone || "",
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadProfile();
    }
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/owner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName || undefined,
          phone: form.phone || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data?.error || t.messages.somethingWentWrong);
      } else {
        setMessage(t.messages.operationSuccessful);
      }
    } catch {
      setMessage(t.messages.somethingWentWrong);
    } finally {
      setSaving(false);
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      <BackButton />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t.profile.profile}
        </h1>
      </div>

      <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 space-y-4">
        {message && (
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.auth.firstName}
          </label>
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 ${(session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'TENANT' ? 'bg-gray-50' : ''}`}
            required
            disabled={(session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'TENANT'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.auth.lastName}
          </label>
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 ${(session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'TENANT' ? 'bg-gray-50' : ''}`}
            disabled={(session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'TENANT'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.auth.email}
          </label>
          <input
            name="email"
            value={form.email}
            readOnly
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-500 bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.auth.phone}
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 ${(session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'TENANT' ? 'bg-gray-50' : ''}`}
            disabled={(session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'TENANT'}
          />
        </div>

        {(session?.user as any)?.role !== 'ADMIN' && (session?.user as any)?.role !== 'TENANT' && (
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? t.common.loading : t.common.save}
          </button>
        )}
      </form>
    </div>
  );
}
