"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Receipt,
  FileText,
  LogOut,
  User
} from "lucide-react";
import translations from "@/lib/i18n/bn";

const TenantSidebar = () => {
  const pathname = usePathname();
  const t = translations;

  const navItems = [
    {
      name: t.nav.dashboard,
      href: "/tenant/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: t.tenantPortal.myRent,
      href: "/tenant/rent",
      icon: Receipt,
    },
    {
      name: t.common.profile,
      href: "/profile",
      icon: User,
    },
    {
      name: t.tenantPortal.downloadReport,
      href: "/tenant/reports",
      icon: FileText,
    },
  ];

  return (
    <div className="w-64 bg-white shadow-sm h-screen flex-shrink-0 border-r border-gray-200 flex flex-col hidden md:flex">
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="mb-6 px-4 py-2 bg-blue-600 rounded-lg">
          <h1 className="text-white font-bold text-lg">{t.tenantPortal.title}</h1>
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
                  className={`flex items-center p-2 rounded-lg group ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-900"
                    }`}
                  />
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Profile & Logout Section */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center p-2 rounded-lg group text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600" />
          <span className="ml-3">{t.common.logout}</span>
        </button>
      </div>
    </div>
  );
};

export default TenantSidebar;
