// app/(dashboard)/analytics/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import {
  useRsvp,
  useLiveVisitors,
  useGallery,
  useGuestbook,
  useVisitLogs,
} from "@/lib/use-realtime";
import { getSite } from "@/lib/sites";
import { motion } from "framer-motion";
import { Eye, Users, CalendarCheck, TrendingUp, Activity, MessageSquare } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

export default function AnalyticsPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const site = getSite(siteId);
  // 🔔 Semua hook realtime via Firestore onSnapshot
  const { items: rsvp } = useRsvp(siteId);
  const { items: guestbook } = useGuestbook(siteId);
  const { count: liveCount } = useLiveVisitors(siteId);
  const { items: photos } = useGallery(siteId);
  const { daily: visits, total: totalVisits } = useVisitLogs(siteId, 14);

  const hadir = rsvp.filter((r) => r.attendance === "hadir").length;
  const tidak = rsvp.filter((r) => r.attendance === "tidak").length;
  const ragu = rsvp.filter((r) => r.attendance === "ragu").length;

  const rsvpPie = [
    { name: "Hadir", value: hadir, color: "#4ADE80" },
    { name: "Ragu", value: ragu, color: "#C9A24B" },
    { name: "Tidak", value: tidak, color: "#F87171" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
          Analytics
        </h1>
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          Statistik kunjungan & RSVP untuk <span style={{ color: "var(--admin-gold)" }}>{site.coupleNames}</span>.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon={Eye} label="Tamu Online" value={liveCount} color="#4ADE80" pulse />
        <StatBox icon={TrendingUp} label="Total Kunjungan (14 hari)" value={totalVisits} color="#C9A24B" />
        <StatBox icon={CalendarCheck} label="Konfirmasi RSVP" value={rsvp.length} color="#6B2C55" />
        <StatBox icon={MessageSquare} label="Ucapan Masuk" value={guestbook.length} color="#60A5FA" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Visit chart */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated rounded-xl p-5 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#C9A24B]" />
            <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>Kunjungan Harian (14 hari terakhir)</h3>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visits}>
                <defs>
                  <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A24B" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#C9A24B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9A968A", fontSize: 10 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  axisLine={{ stroke: "#2A2A33" }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#9A968A", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#16161D",
                    border: "1px solid #2A2A33",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#9A968A" }}
                  itemStyle={{ color: "#F4F1EA" }}
                  labelFormatter={(d) => new Date(d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                />
                <Area type="monotone" dataKey="count" stroke="#C9A24B" strokeWidth={2} fill="url(#visitsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* RSVP pie */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-elevated rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="w-4 h-4 text-[#6B2C55]" />
            <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>Distribusi Kehadiran</h3>
          </div>
          {rsvpPie.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Belum ada data RSVP</p>
            </div>
          ) : (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rsvpPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {rsvpPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="#0B0B10" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#16161D",
                      border: "1px solid #2A2A33",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "#F4F1EA" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, color: "#9A968A" }}
                    formatter={(v) => <span style={{ color: "#F4F1EA" }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.section>

        {/* Site Info */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated rounded-xl p-5 lg:col-span-3"
        >
          <h3 className="text-sm font-medium mb-4" style={{ color: "var(--admin-text)" }}>Ringkasan Konten {site.coupleNames}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoTile label="Foto Galeri" value={photos.length} color="#C9A24B" icon={Users} />
            <InfoTile label="Tamu Konfirmasi Hadir" value={hadir} color="#4ADE80" icon={CalendarCheck} />
            <InfoTile label="Tamu Ragu" value={ragu} color="#C9A24B" icon={CalendarCheck} />
            <InfoTile label="Tamu Tidak Hadir" value={tidak} color="#F87171" icon={CalendarCheck} />
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color, pulse }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 rounded-full opacity-75 live-pulse" style={{ background: color }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold mb-0.5" style={{ color: "var(--admin-text)", fontFamily: "var(--font-cormorant)" }}>{value}</div>
      <div className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>{label}</div>
    </motion.div>
  );
}

function InfoTile({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>{label}</span>
      </div>
      <div className="text-xl font-semibold" style={{ color, fontFamily: "var(--font-cormorant)" }}>{value}</div>
    </div>
  );
}
