"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  Activity,
  LogOut,
  User
} from "lucide-react";
import translations from "@/lib/i18n/bn";

const AdminSidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = translations;

  const navItems = [
    {
      name: t.admin.adminDashboard,
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: t.common.profile,
      href: "/profile",
      icon: User,
    },
    {
      name: t.admin.users,
      href: "/admin/users",
      icon: Users,
    },
    {
      name: t.admin.systemVisibility,
      href: "/admin/visibility",
      icon: Building2,
    },
    {
      name: t.admin.systemControls,
      href: "/admin/controls",
      icon: Settings,
    },
    {
      name: t.admin.monitoring,
      href: "/admin/monitoring",
      icon: Activity,
    },
  ];

  return (
    <div className="w-64 bg-white shadow-sm h-screen flex-shrink-0 border-r border-gray-200 flex flex-col">
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname?.startsWith(item.href);

            return (
              <li key={item.href}>
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
          className="w-full flex items-center p-2 rounded-lg group text-gray-900 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
          <span className="ml-3">{t.common.logout}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
