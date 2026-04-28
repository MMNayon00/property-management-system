"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
  role?: string;
  status?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [users, setUsers] = useState<OwnerUser[]>([]);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
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
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchData();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session, roleFilter, statusFilter, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const [pendingRes, usersRes] = await Promise.all([
        fetch("/api/admin/pending-users"),
        fetch(`/api/admin/users?${params.toString()}`),
      ]);

      const pendingData = await pendingRes.json();
      const usersData = await usersRes.json();

      setPendingUsers(pendingData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

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
        fetchData(); // Refresh main list
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
        fetchData(); // Refresh main list
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserEdit = (user: OwnerUser) => {
    setEditingUserId(user.id);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      status: user.status || "APPROVED",
    });
  };

  const handleUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSave = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          firstName: userForm.firstName,
          lastName: userForm.lastName || undefined,
          email: userForm.email,
          phone: userForm.phone || undefined,
          status: userForm.status,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u))
        );
        setEditingUserId(null);
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleSuspendToggle = async (user: OwnerUser) => {
    const newStatus = user.status === "SUSPENDED" ? "APPROVED" : "SUSPENDED";
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          firstName: user.firstName,
          email: user.email,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u))
        );
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  if (status === "loading" || (loading && users.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.users}</h1>
      </div>

      {/* Pending Users */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {t.admin.pendingUsers}
        </h2>
        {pendingUsers.length === 0 ? (
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <p className="text-gray-600">{t.admin.noPendingUsers}</p>
          </div>
        ) : (
          <div className="bg-white overflow-hidden shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">নাম</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ইমেইল</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ফোন</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">কর্ম</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={actionLoading === user.id}
                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md transition disabled:opacity-50"
                      >
                        {t.admin.approveUser}
                      </button>
                      <button
                        onClick={() => setSelectedUser(user.id)}
                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition"
                      >
                        {t.admin.rejectUser}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Management */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-medium text-gray-900">{t.admin.users}</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-64 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
            >
              <option value="">{t.admin.filters} ({t.admin.role})</option>
              <option value="OWNER">{t.admin.owner}</option>
              <option value="MANAGER">{t.admin.manager}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
            >
              <option value="">{t.admin.filters} ({t.admin.status})</option>
              <option value="APPROVED">{t.admin.statusApproved}</option>
              <option value="PENDING">{t.admin.statusPending}</option>
              <option value="REJECTED">{t.admin.statusRejected}</option>
              <option value="SUSPENDED">{t.admin.statusSuspended}</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.auth.firstName}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.auth.email}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.auth.phone}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.role}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.admin.status}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">কর্ম</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingUserId === user.id ? (
                      <div className="space-y-2">
                        <input name="firstName" value={userForm.firstName} onChange={handleUserChange} className="w-full px-2 py-1 border rounded" />
                        <input name="lastName" value={userForm.lastName} onChange={handleUserChange} className="w-full px-2 py-1 border rounded" />
                      </div>
                    ) : (
                      `${user.firstName} ${user.lastName || ""}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {editingUserId === user.id ? (
                      <input name="email" value={userForm.email} onChange={handleUserChange} className="w-full px-2 py-1 border rounded" />
                    ) : user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {editingUserId === user.id ? (
                      <input name="phone" value={userForm.phone} onChange={handleUserChange} className="w-full px-2 py-1 border rounded" />
                    ) : user.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {editingUserId === user.id ? (
                      <select name="status" value={userForm.status} onChange={handleUserChange} className="w-full px-2 py-1 border rounded">
                        <option value="PENDING">{t.admin.statusPending}</option>
                        <option value="APPROVED">{t.admin.statusApproved}</option>
                        <option value="REJECTED">{t.admin.statusRejected}</option>
                        <option value="SUSPENDED">{t.admin.statusSuspended}</option>
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        user.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        user.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingUserId === user.id ? (
                      <div className="space-x-2">
                        <button onClick={() => handleUserSave(user.id)} className="text-green-600 hover:text-green-900">{t.common.save}</button>
                        <button onClick={() => setEditingUserId(null)} className="text-gray-600 hover:text-gray-900">{t.common.cancel}</button>
                      </div>
                    ) : (
                      <div className="space-x-3 flex items-center">
                        <button onClick={() => handleUserEdit(user)} className="text-blue-600 hover:text-blue-900">{t.common.edit}</button>
                        {user.status === "SUSPENDED" ? (
                          <button onClick={() => handleSuspendToggle(user)} className="text-green-600 hover:text-green-900">{t.admin.reactivateUser}</button>
                        ) : (
                          <button onClick={() => handleSuspendToggle(user)} className="text-orange-600 hover:text-orange-900">{t.admin.suspendUser}</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t.admin.rejectUser}</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="প্রত্যাখ্যানের কারণ লিখুন (ঐচ্ছিক)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="mt-5 flex space-x-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md transition"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleReject(selectedUser)}
                disabled={actionLoading === selectedUser}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md transition disabled:opacity-50"
              >
                {t.admin.rejectUser}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
