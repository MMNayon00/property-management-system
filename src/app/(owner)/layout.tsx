"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import translations from "@/lib/i18n/bn";

export default function OwnerLayout({
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

    // Role check: Allow OWNER, redirect MANAGER to their interface
    const role = (session?.user as any)?.role;
    const userStatus = (session?.user as any)?.status;

    if (role === "ADMIN" && pathname !== "/admin") {
      router.push("/admin");
      return;
    }

    if (role === "MANAGER") {
      router.push("/manager/dashboard");
      return;
    }

    if (role === "OWNER" && userStatus !== "APPROVED") {
      // Could redirect to a dedicated pending page
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
      <OwnerSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
