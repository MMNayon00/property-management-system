// Admin Panel - Pending Users
"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n/bn";

interface PendingUser {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

interface OwnerUser {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<
    | {
        totalUsers: number;
        totalOwners: number;
        totalBuildings: number;
        totalTenants: number;
        pendingUsers: number;
        monthlyIncome: number;
      }
    | null
  >(null);
  const [owners, setOwners] = useState<OwnerUser[]>([]);
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [ownerForm, setOwnerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "APPROVED",
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const t = translations;

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      setLoading(false);
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, overviewRes, ownersRes] = await Promise.all([
          fetch("/api/admin/pending-users"),
          fetch("/api/admin/overview"),
          fetch("/api/admin/users?role=OWNER"),
        ]);

        const users = await usersRes.json();
        const overview = await overviewRes.json();
        const ownersData = await ownersRes.json();

        setPendingUsers(users);
        setStats(overview);
        setOwners(ownersData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "authenticated") {
      return;
    }

    if (session?.user?.role === "ADMIN") {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [session, status]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "approve",
        }),
      });

      if (response.ok) {
        setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "reject",
          rejectionReason,
        }),
      });

      if (response.ok) {
        setPendingUsers(pendingUsers.filter((u) => u.id !== userId));
        setSelectedUser(null);
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOwnerEdit = (owner: OwnerUser) => {
    setEditingOwnerId(owner.id);
    setOwnerForm({
      firstName: owner.firstName,
      lastName: owner.lastName || "",
      email: owner.email || "",
      phone: owner.phone || "",
      status: owner.status || "APPROVED",
    });
  };

  const handleOwnerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOwnerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOwnerSave = async (ownerId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ownerId,
          firstName: ownerForm.firstName,
          lastName: ownerForm.lastName || undefined,
          email: ownerForm.email,
          phone: ownerForm.phone || undefined,
          status: ownerForm.status,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setOwners((prev) =>
          prev.map((owner) => (owner.id === updated.id ? updated : owner))
        );
        setEditingOwnerId(null);
      }
    } catch (error) {
      console.error("Error updating owner:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t.common.loading}</p>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            {t.admin.adminPanel}
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t.common.logout}
          </button>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500">
                {t.admin.totalUsers}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.totalUsers || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500">
                {t.admin.totalOwners}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.totalOwners || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500">
                {t.admin.totalBuildings}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.totalBuildings || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500">
                {t.admin.totalTenants}
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.totalTenants || 0}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500">
                পেন্ডিং ব্যবহারকারী
              </dt>
              <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                {stats?.pendingUsers ?? pendingUsers.length}
              </dd>
            </div>
          </div>
        </div>

        {/* Pending Users */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t.admin.pendingUsers}
          </h2>

          {pendingUsers.length === 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <p className="text-gray-600">{t.admin.noPendingUsers}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      নাম
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ইমেইল
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ফোন
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      কর্ম
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={actionLoading === user.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          অনুমোদন
                        </button>
                        <button
                          onClick={() => setSelectedUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          প্রত্যাখ্যান
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ব্যবহারকারী প্রত্যাখ্যান করুন
              </h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="প্রত্যাখ্যানের কারণ লিখুন (ঐচ্ছিক)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={4}
              />
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                >
                  বাতিল
                </button>
                <button
                  onClick={() => handleReject(selectedUser)}
                  disabled={actionLoading === selectedUser}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  প্রত্যাখ্যান করুন
                </button>
              </div>

              <div className="mt-10">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {t.admin.owners}
                </h2>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t.auth.firstName}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t.auth.email}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t.auth.phone}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t.admin.status}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {t.common.edit}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {owners.length === 0 ? (
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-600" colSpan={5}>
                            {t.admin.noOwners}
                          </td>
                        </tr>
                      ) : (
                        owners.map((owner) => (
                          <tr key={owner.id}>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {editingOwnerId === owner.id ? (
                                <div className="space-y-2">
                                  <input
                                    name="firstName"
                                    value={ownerForm.firstName}
                                    onChange={handleOwnerChange}
                                    className="w-full px-2 py-1 border rounded text-gray-900"
                                  />
                                  <input
                                    name="lastName"
                                    value={ownerForm.lastName}
                                    onChange={handleOwnerChange}
                                    className="w-full px-2 py-1 border rounded text-gray-900"
                                  />
                                </div>
                              ) : (
                                `${owner.firstName} ${owner.lastName || ""}`
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {editingOwnerId === owner.id ? (
                                <input
                                  name="email"
                                  value={ownerForm.email}
                                  onChange={handleOwnerChange}
                                  className="w-full px-2 py-1 border rounded text-gray-900"
                                />
                              ) : (
                                owner.email
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {editingOwnerId === owner.id ? (
                                <input
                                  name="phone"
                                  value={ownerForm.phone}
                                  onChange={handleOwnerChange}
                                  className="w-full px-2 py-1 border rounded text-gray-900"
                                />
                              ) : (
                                owner.phone || "-"
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {editingOwnerId === owner.id ? (
                                <select
                                  name="status"
                                  value={ownerForm.status}
                                  onChange={handleOwnerChange}
                                  className="w-full px-2 py-1 border rounded text-gray-900"
                                >
                                  <option value="PENDING">{t.admin.statusPending}</option>
                                  <option value="APPROVED">{t.admin.statusApproved}</option>
                                  <option value="REJECTED">{t.admin.statusRejected}</option>
                                </select>
                              ) : (
                                owner.status || "-"
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {editingOwnerId === owner.id ? (
                                <div className="space-x-2">
                                  <button
                                    onClick={() => handleOwnerSave(owner.id)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    {t.common.save}
                                  </button>
                                  <button
                                    onClick={() => setEditingOwnerId(null)}
                                    className="text-gray-600 hover:text-gray-800"
                                  >
                                    {t.common.cancel}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOwnerEdit(owner)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {t.common.edit}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
