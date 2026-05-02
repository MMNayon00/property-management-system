"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { t } from '@/lib/i18n';
import BackButton from '@/components/common/BackButton';

// Mock user data type - replace with your actual User type
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "OWNER" | "MANAGER" | "TENANT";
  status: "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    role: "",
    status: "",
    search: "",
  });

  const [debouncedSearch] = useDebounce(filters.search, 500);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        role: filters.role,
        status: filters.status,
        search: debouncedSearch,
      });
      const response = await fetch(`/api/admin/users?${query.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.role, filters.status, debouncedSearch]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleStatusUpdate = async (userId: string, status: User["status"]) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchUsers(); // Refresh users
    } catch (error) {
      console.error(error);
      alert("Failed to update user status.");
    }
  };

  return (
    <div className="p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">{t('User Management')}</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-white rounded-lg shadow">
        <input
          type="text"
          name="search"
          placeholder={t('Search by name or email...')}
          value={filters.search}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        />
        <select name="role" value={filters.role} onChange={handleFilterChange} className="p-2 border rounded">
          <option value="">{t('All Roles')}</option>
          <option value="OWNER">{t('Owner')}</option>
          <option value="MANAGER">{t('Manager')}</option>
          <option value="TENANT">{t('Tenant')}</option>
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded">
          <option value="">{t('All Statuses')}</option>

          <option value="APPROVED">{t('Approved')}</option>
          <option value="REJECTED">{t('Rejected')}</option>
          <option value="SUSPENDED">{t('Suspended')}</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <p className="p-4">{t('Loading...')}</p>
        ) : error ? (
          <p className="p-4 text-red-500">{error}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Joined')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{t(user.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t(user.status)}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.status === 'APPROVED' && (
                       <button onClick={() => handleStatusUpdate(user.id, 'SUSPENDED')} className="text-red-600 hover:text-red-900">{t('Suspend')}</button>
                    )}
                     {user.status === 'SUSPENDED' && (
                       <button onClick={() => handleStatusUpdate(user.id, 'APPROVED')} className="text-green-600 hover:text-green-900">{t('Unsuspend')}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
         {users.length === 0 && !loading && <p className="p-4 text-center text-gray-500">{t('No users found.')}</p>}
      </div>
    </div>
  );
}
