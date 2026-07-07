// components/admin/Sidebar.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Images,
  Music,
  Gift,
  Users,
  CalendarCheck,
  Megaphone,
  BarChart3,
  Settings,
  Crown,
  LogOut,
} from "lucide-react";
import { SiteSwitcher } from "./SiteSwitcher";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content", label: "Content Editor", icon: FileText },
  { href: "/gallery", label: "Galeri", icon: Images },
  { href: "/music-maps", label: "Music & Maps", icon: Music },
  { href: "/gift", label: "Gift & QRIS", icon: Gift },
  { href: "/guests", label: "Daftar Tamu", icon: Users },
  { href: "/rsvp", label: "RSVP & Ucapan", icon: CalendarCheck },
  { href: "/announcements", label: "Pengumuman", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Berhasil keluar.");
    router.replace("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-30"
           style={{ background: "var(--admin-bg)", borderRight: "1px solid var(--admin-border)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--admin-border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
               style={{ background: "linear-gradient(135deg, #C9A24B 0%, #6B2C55 100%)" }}>
            <Crown className="w-5 h-5 text-[#0B0B10]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight text-gold-gradient" style={{ fontFamily: "var(--font-cormorant)" }}>
              Master Control
            </div>
            <div className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>
              Wedding CMS
            </div>
          </div>
        </Link>
      </div>

      {/* Site Switcher */}
      <div className="px-3 py-4 border-b" style={{ borderColor: "var(--admin-border)" }}>
        <SiteSwitcher />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="text-[10px] uppercase tracking-widest px-3 py-2" style={{ color: "var(--admin-text-muted)" }}>
          Kelola Konten
        </div>
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition-all ${
                active ? "nav-item-active" : "hover:bg-[var(--admin-surface)]"
              }`}
              style={!active ? { color: "var(--admin-text-muted)" } : {}}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A24B]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t p-3" style={{ borderColor: "var(--admin-border)" }}>
        <div className="flex items-center gap-3 p-2 rounded-lg mb-1" style={{ background: "var(--admin-surface)" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
               style={{ background: "linear-gradient(135deg, #C9A24B 0%, #6B2C55 100%)", color: "#0B0B10" }}>
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: "var(--admin-text)" }}>
              {user?.email ?? "—"}
            </div>
            <div className="text-[10px] flex items-center gap-1" style={{ color: "var(--admin-text-muted)" }}>
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                Verified Admin
              </>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md hover:bg-[var(--admin-surface-2)] transition-colors"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" style={{ color: "var(--admin-text-muted)" }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
