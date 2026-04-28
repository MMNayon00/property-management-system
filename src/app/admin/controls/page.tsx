"use client";

import { useSession } from "next-auth/react";
import translations from "@/lib/i18n/bn";

export default function SystemControlsPage() {
  const { data: session, status } = useSession();
  const t = translations;

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t.admin.systemControls}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Enable/Disable Features */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t.admin.enableFeatures}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                <p className="text-xs text-gray-500">এসএমএস নোটিফিকেশন সিস্টেম</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Online Payments</p>
                <p className="text-xs text-gray-500">অনলাইন পেমেন্ট গেটওয়ে</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New Registrations</p>
                <p className="text-xs text-gray-500">নতুন ব্যবহারকারী নিবন্ধন</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <p className="text-xs text-orange-500 mt-4">* This is a mockup for Future Ready features.</p>
        </div>

        {/* Subscription Plans */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t.admin.subscriptionPlans}</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Basic Plan</p>
                <p className="text-xs text-gray-500">Up to 5 Buildings</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800">{t.common.edit}</button>
            </div>
            <div className="border border-gray-200 rounded p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Premium Plan</p>
                <p className="text-xs text-gray-500">Unlimited Buildings</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800">{t.common.edit}</button>
            </div>
            <button className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition">
              + {t.common.add} Plan
            </button>
          </div>
          <p className="text-xs text-orange-500 mt-4">* This is a mockup for Future Ready features.</p>
        </div>

        {/* Announcements */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t.admin.announcements}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="ঘোষণার শিরোনাম" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">বার্তা</label>
              <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="সিস্টেম-ব্যাপী ঘোষণার বার্তা লিখুন..."></textarea>
            </div>
            <div className="flex justify-end">
              <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                ঘোষণা করুন (Mock)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
