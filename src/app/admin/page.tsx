// Admin Panel - Pending Users
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const t = translations;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, statsRes] = await Promise.all([
          fetch("/api/admin/pending-users"),
          fetch("/api/admin/stats"),
        ]);

        const users = await usersRes.json();
        const statistics = await statsRes.json();

        setPendingUsers(users);
        setStats(statistics);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchData();
    }
  }, [session]);

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
        <h1 className="text-3xl font-bold text-gray-900">
          {t.admin.adminPanel}
        </h1>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-4">
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
                {pendingUsers.length}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
