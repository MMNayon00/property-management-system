import { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import translations from "@/lib/i18n/bn";

export const metadata: Metadata = {
  title: `${translations.admin.adminPanel} | ${translations.common.appName}`,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
