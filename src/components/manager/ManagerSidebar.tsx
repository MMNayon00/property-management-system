"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building,
  Home,
  Users,
  CreditCard,
  FileText
} from "lucide-react";
import translations from "@/lib/i18n/bn";

const ManagerSidebar = () => {
  const pathname = usePathname();
  const t = translations;

  const navItems = [
    {
      name: t.nav.dashboard,
      href: "/manager/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: t.nav.buildings,
      href: "/manager/buildings",
      icon: Building,
    },
    {
      name: t.nav.flats,
      href: "/manager/flats",
      icon: Home,
    },
    {
      name: t.nav.tenants,
      href: "/manager/tenants",
      icon: Users,
    },
    {
      name: t.nav.payments,
      href: "/manager/payments",
      icon: CreditCard,
    },
    {
      name: t.nav.reports,
      href: "/manager/reports",
      icon: FileText,
    },
  ];

  return (
    <div className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] flex-shrink-0 border-r border-gray-200">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 px-2">
            {t.common.appName}
          </h2>
          <p className="text-sm text-gray-500 px-2 mt-1">
            ম্যানেজার প্যানেল
          </p>
        </div>

        <ul className="space-y-2 font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-lg group ${isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-900"
                      }`}
                  />
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ManagerSidebar;