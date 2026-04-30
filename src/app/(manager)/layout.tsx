"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import translations from "@/lib/i18n/bn";

export default function ManagerLayout({
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

    // Only allow MANAGER role
    if (role !== "MANAGER") {
      if (role === "OWNER") {
        router.push("/dashboard");
      } else if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/login");
      }
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}