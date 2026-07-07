// app/(dashboard)/dashboard/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { getSite, SITES } from "@/lib/sites";
import { useRsvp, useGuestbook, useLiveVisitors, useGallery, useGiftTransactions } from "@/lib/use-realtime";
import { motion } from "framer-motion";
import { Users, CalendarCheck, Images, MessageSquare, TrendingUp, Eye, Megaphone, Gift, ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function StatCard({ icon: Icon, label, value, hint, accent = "#C9A24B", href }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  href?: string;
}) {
  const content = (
    <motion.div
      whileHover={{ y: -2 }}
      className="card-elevated rounded-xl p-5 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {href && <ArrowUpRight className="w-4 h-4" style={{ color: "var(--admin-text-muted)" }} />}
      </div>
      <div className="text-3xl font-semibold mb-1" style={{ color: "var(--admin-text)", fontFamily: "var(--font-cormorant)" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
        {label}
      </div>
      {hint && <div className="text-[10px] mt-2" style={{ color: accent }}>{hint}</div>}
    </motion.div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const site = getSite(siteId);
  const { items: rsvp } = useRsvp(siteId);
  const { items: guestbook } = useGuestbook(siteId);
  const { count: liveCount } = useLiveVisitors(siteId);
  const { items: photos } = useGallery(siteId);
  const { items: giftTx } = useGiftTransactions(siteId);

  const [now] = useState<Date | null>(() => typeof window !== "undefined" ? new Date() : null);

  const hadir = rsvp.filter((r) => r.attendance === "hadir").length;
  const tidak = rsvp.filter((r) => r.attendance === "tidak").length;
  const ragu = rsvp.filter((r) => r.attendance === "ragu").length;
  const totalGift = giftTx.reduce((s, t) => s + t.amount, 0);

  const weddingDate = siteId === "site-1" ? "2026-08-15" : "2026-09-20";
  const daysLeft = now
    ? Math.max(0, Math.ceil((new Date(weddingDate).getTime() - now.getTime()) / 86400000))
    : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(201, 162, 75, 0.15) 0%, rgba(107, 44, 85, 0.25) 100%)",
          border: "1px solid rgba(201, 162, 75, 0.3)",
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-1/3 translate-x-1/4"
             style={{ background: "radial-gradient(circle, #C9A24B 0%, transparent 70%)" }} />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--admin-gold)" }}>
            Dashboard Master Control
          </div>
          <h1 className="text-4xl font-semibold mb-2 text-gold-gradient" style={{ fontFamily: "var(--font-cormorant)" }}>
            {site.coupleNames}
          </h1>
          <p className="text-sm mb-4" style={{ color: "var(--admin-text-muted)" }}>
            {siteId === "site-1" ? "Pernikahan Wayan & Putri — Ubud, Bali" : "Pernikahan Made & Kadek — Sanur, Bali"}
          </p>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Hari Bahagia</div>
              <div className="text-xl font-semibold" style={{ color: "var(--admin-text)", fontFamily: "var(--font-cormorant)" }}>
                {daysLeft !== null ? `${daysLeft} hari lagi` : "—"}
              </div>
            </div>
            <div className="w-px h-10" style={{ background: "var(--admin-border)" }} />
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Tamu Online</div>
              <div className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--admin-text)", fontFamily: "var(--font-cormorant)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 rounded-full bg-[#4ADE80] opacity-75 live-pulse" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
                </span>
                {liveCount}
              </div>
            </div>
            <div className="w-px h-10" style={{ background: "var(--admin-border)" }} />
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Status</div>
              <div className="text-xl font-semibold" style={{ color: "#4ADE80", fontFamily: "var(--font-cormorant)" }}>Live</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Konfirmasi RSVP" value={rsvp.length} hint={`${hadir} hadir · ${ragu} ragu · ${tidak} tidak`} href="/rsvp" />
        <StatCard icon={Images} label="Foto Galeri" value={photos.length} accent="#6B2C55" href="/gallery" />
        <StatCard icon={MessageSquare} label="Ucapan Masuk" value={guestbook.length} accent="#60A5FA" href="/rsvp" />
        <StatCard icon={Gift} label="Total Kado Diterima" value={`Rp ${(totalGift / 1000).toFixed(0)}k`} accent="#4ADE80" href="/gift" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#C9A24B]" />
            <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>Aktivitas Terkini</h3>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
            {[...rsvp.slice(0, 3).map(r => ({
              type: "RSVP" as const,
              text: `${r.name} mengisi RSVP — ${r.attendance}`,
              time: r.createdAt,
              icon: CalendarCheck,
              color: r.attendance === "hadir" ? "#4ADE80" : r.attendance === "tidak" ? "#F87171" : "#C9A24B",
            })), ...guestbook.slice(0, 3).map(g => ({
              type: "Ucapan" as const,
              text: `${g.name}: "${g.message.slice(0, 60)}${g.message.length > 60 ? "…" : ""}"`,
              time: g.createdAt,
              icon: MessageSquare,
              color: "#60A5FA",
            }))].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6).map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[var(--admin-surface)] transition-colors">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                       style={{ background: `${item.color}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: "var(--admin-text)" }}>{item.text}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(item.time).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-elevated rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#C9A24B]" />
            <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>Aksi Cepat</h3>
          </div>
          <div className="space-y-2">
            <Link href="/content" className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--admin-surface-2)] transition-colors group">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#C9A24B]" />
                <span className="text-xs" style={{ color: "var(--admin-text)" }}>Edit Konten</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--admin-text-muted)" }} />
            </Link>
            <Link href="/gallery" className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--admin-surface-2)] transition-colors group">
              <div className="flex items-center gap-2.5">
                <Images className="w-4 h-4 text-[#6B2C55]" />
                <span className="text-xs" style={{ color: "var(--admin-text)" }}>Upload Foto</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--admin-text-muted)" }} />
            </Link>
            <Link href="/announcements" className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--admin-surface-2)] transition-colors group">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 text-[#4ADE80]" />
                <span className="text-xs" style={{ color: "var(--admin-text)" }}>Buat Pengumuman</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--admin-text-muted)" }} />
            </Link>
            <Link href="/analytics" className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--admin-surface-2)] transition-colors group">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-[#60A5FA]" />
                <span className="text-xs" style={{ color: "var(--admin-text)" }}>Lihat Statistik</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--admin-text-muted)" }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Multi-site overview */}
      <div className="card-elevated rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--admin-text)" }}>Ringkasan {SITES.length} Situs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SITES.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg"
                 style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: `linear-gradient(135deg, ${s.accent} 0%, ${s.accent}80 100%)` }}>
                <span className="text-xs font-bold text-[#0B0B10]">{s.id === "site-1" ? "1" : "2"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{s.coupleNames}</div>
                <div className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>{s.id === siteId ? "Aktif dikelola" : "Klik untuk pindah"}</div>
              </div>
              {s.id === siteId && <span className="w-2 h-2 rounded-full bg-[#4ADE80] live-pulse" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
