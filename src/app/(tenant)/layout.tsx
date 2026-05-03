"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import TenantSidebar from "@/components/tenant/TenantSidebar";
import translations from "@/lib/i18n/bn";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const t = translations;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const role = (session?.user as any)?.role;
    const userStatus = (session?.user as any)?.status;

    if (role !== "TENANT") {
      // Redirect based on role if they try to access tenant routes
      if (role === "OWNER") router.push("/dashboard");
      else if (role === "MANAGER") router.push("/manager/dashboard");
      else if (role === "ADMIN") router.push("/admin");
      return;
    }

    if (userStatus !== "APPROVED") {
      router.push("/login?error=account_pending");
      return;
    }

    setIsAuthorized(true);
  }, [status, session, router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center bg-white p-4 border-b border-gray-200 sticky top-0 z-40">
          <h1 className="text-blue-600 font-bold text-lg">{t.tenantPortal.title}</h1>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50">
         <Link href="/tenant/dashboard" className={`flex flex-col items-center ${pathname === "/tenant/dashboard" ? "text-blue-600" : "text-gray-500"}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px] mt-1">{t.nav.dashboard}</span>
         </Link>
         <Link href="/tenant/rent" className={`flex flex-col items-center ${pathname === "/tenant/rent" ? "text-blue-600" : "text-gray-500"}`}>
            <Receipt size={20} />
            <span className="text-[10px] mt-1">{t.tenantPortal.myRent}</span>
         </Link>
         <Link href="/tenant/reports" className={`flex flex-col items-center ${pathname === "/tenant/reports" ? "text-blue-600" : "text-gray-500"}`}>
            <FileText size={20} />
            <span className="text-[10px] mt-1">{t.reports.reports}</span>
         </Link>
         <Link href="/profile" className={`flex flex-col items-center ${pathname === "/profile" ? "text-blue-600" : "text-gray-500"}`}>
            <User size={20} />
            <span className="text-[10px] mt-1">{t.common.profile}</span>
         </Link>
      </div>
    </div>
  );
}

// Helper imports
import { LayoutDashboard, Receipt, FileText, User, LogOut } from "lucide-react";
import Link from "next/link";
