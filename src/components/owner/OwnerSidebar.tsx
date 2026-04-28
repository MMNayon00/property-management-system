"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building, 
  Home, 
  Users, 
  Receipt,
  CreditCard,
  FileText
} from "lucide-react";
import translations from "@/lib/i18n/bn";

const OwnerSidebar = () => {
  const pathname = usePathname();
  const t = translations;

  const navItems = [
    {
      name: t.nav.dashboard,
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: t.nav.buildings,
      href: "/buildings",
      icon: Building,
    },
    {
      name: t.nav.flats,
      href: "/flats",
      icon: Home,
    },
    {
      name: t.nav.tenants,
      href: "/tenants",
      icon: Users,
    },
    {
      name: t.nav.rent,
      href: "/rent",
      icon: Receipt,
    },
    {
      name: t.nav.payments,
      href: "/payments",
      icon: CreditCard,
    },
    {
      name: t.nav.reports,
      href: "/reports",
      icon: FileText,
    },
  ];

  return (
    <div className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)] flex-shrink-0 border-r border-gray-200">
      <div className="h-full px-3 py-4 overflow-y-auto">
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
    </div>
  );
};

export default OwnerSidebar;
