// app/(dashboard)/layout.tsx
'use client';

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { LiveStatusBadge } from "@/components/admin/LiveStatusBadge";
import { AuthProvider, useAuth } from "@/components/admin/AuthProvider";
import { motion } from "framer-motion";

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--admin-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#C9A24B] border-t-transparent animate-spin" />
          <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Memuat panel admin…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--admin-bg)" }}>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between backdrop-blur-md"
                style={{ background: "rgba(11, 11, 16, 0.8)", borderBottom: "1px solid var(--admin-border)" }}>
          <LiveStatusBadge />
          <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </header>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-8 py-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
