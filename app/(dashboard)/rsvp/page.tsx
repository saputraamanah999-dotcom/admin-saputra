// app/(dashboard)/rsvp/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { useRsvp, useGuestbook } from "@/lib/use-realtime";
import { deleteRsvpEntry, deleteGuestbookEntry } from "@/lib/data-service";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { Download, Trash2, CalendarCheck, MessageSquare, Filter, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterStatus = "all" | "hadir" | "tidak" | "ragu";

export default function RsvpPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const { items: rsvp, loading: rsvpLoading } = useRsvp(siteId);
  const { items: guestbook, loading: gbLoading } = useGuestbook(siteId);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [deleteRsvpTarget, setDeleteRsvpTarget] = useState<string | null>(null);
  const [deleteGbTarget, setDeleteGbTarget] = useState<string | null>(null);

  const filtered = filter === "all" ? rsvp : rsvp.filter((r) => r.attendance === filter);

  const hadir = rsvp.filter((r) => r.attendance === "hadir");
  const tidak = rsvp.filter((r) => r.attendance === "tidak");
  const ragu = rsvp.filter((r) => r.attendance === "ragu");
  const totalGuests = hadir.reduce((s, r) => s + r.guestCount, 0);

  const exportCSV = () => {
    const headers = ["Nama", "Kehadiran", "Jumlah Tamu", "Pesan", "Slug Tamu", "Waktu"];
    const rows = rsvp.map((r) => [
      escapeCsv(r.name),
      r.attendance,
      r.guestCount.toString(),
      escapeCsv(r.message),
      r.guestSlug ?? "",
      new Date(r.createdAt).toLocaleString("id-ID"),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    // BOM untuk Excel membaca UTF-8 dengan benar
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvp-${siteId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rsvp.length} entri RSVP ke CSV.`);
  };

  const handleDeleteRsvp = async () => {
    if (!deleteRsvpTarget) return;
    try {
      await deleteRsvpEntry(siteId, deleteRsvpTarget);
      toast.success("Entri RSVP dihapus.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleteRsvpTarget(null);
    }
  };

  const handleDeleteGb = async () => {
    if (!deleteGbTarget) return;
    try {
      await deleteGuestbookEntry(siteId, deleteGbTarget);
      toast.success("Ucapan dihapus dari guestbook.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleteGbTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            RSVP & Guestbook
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Rekap konfirmasi kehadiran & ucapan. Update realtime — hapus ucapan spam langsung hilang dari website tamu.
          </p>
        </div>
        <Button size="sm" onClick={exportCSV} disabled={rsvp.length === 0} className="btn-gold border-0">
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="w-4 h-4 text-[#4ADE80]" />
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Hadir</span>
          </div>
          <div className="text-2xl font-semibold" style={{ color: "#4ADE80", fontFamily: "var(--font-cormorant)" }}>{hadir.length}</div>
          <div className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>{totalGuests} tamu total</div>
        </div>
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="w-4 h-4 text-[#C9A24B]" />
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Ragu</span>
          </div>
          <div className="text-2xl font-semibold" style={{ color: "#C9A24B", fontFamily: "var(--font-cormorant)" }}>{ragu.length}</div>
        </div>
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="w-4 h-4 text-[#F87171]" />
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Tidak Hadir</span>
          </div>
          <div className="text-2xl font-semibold" style={{ color: "#F87171", fontFamily: "var(--font-cormorant)" }}>{tidak.length}</div>
        </div>
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-[#60A5FA]" />
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Ucapan</span>
          </div>
          <div className="text-2xl font-semibold" style={{ color: "#60A5FA", fontFamily: "var(--font-cormorant)" }}>{guestbook.length}</div>
        </div>
      </div>

      {/* RSVP List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="card-elevated rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>Daftar RSVP</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" style={{ color: "var(--admin-text-muted)" }} />
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
                <SelectTrigger className="w-32 h-8 text-xs" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="ragu">Ragu</SelectItem>
                  <SelectItem value="tidak">Tidak Hadir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {rsvpLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#C9A24B]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-center py-12" style={{ color: "var(--admin-text-muted)" }}>Belum ada RSVP.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {filtered.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="p-3 rounded-lg"
                  style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                         style={{
                           background: r.attendance === "hadir" ? "rgba(74, 222, 128, 0.15)" : r.attendance === "tidak" ? "rgba(248, 113, 113, 0.15)" : "rgba(201, 162, 75, 0.15)",
                           color: r.attendance === "hadir" ? "#4ADE80" : r.attendance === "tidak" ? "#F87171" : "#C9A24B",
                         }}>
                      {r.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{r.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                background: r.attendance === "hadir" ? "rgba(74, 222, 128, 0.15)" : r.attendance === "tidak" ? "rgba(248, 113, 113, 0.15)" : "rgba(201, 162, 75, 0.15)",
                                color: r.attendance === "hadir" ? "#4ADE80" : r.attendance === "tidak" ? "#F87171" : "#C9A24B",
                              }}>
                          {r.attendance}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>· {r.guestCount} tamu</span>
                      </div>
                      {r.message && <p className="text-xs mb-1" style={{ color: "var(--admin-text)" }}>{r.message}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>
                          {new Date(r.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {r.guestSlug && <> · slug: <code className="text-[#C9A24B]">{r.guestSlug}</code></>}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteRsvpTarget(r.id)}
                                className="h-6 w-6 p-0 text-[#F87171] hover:bg-[#F87171]/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Guestbook */}
        <section className="card-elevated rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
            <MessageSquare className="w-4 h-4 text-[#60A5FA]" /> Guestbook
          </h3>
          {gbLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#C9A24B]" />
            </div>
          ) : guestbook.length === 0 ? (
            <p className="text-xs text-center py-12" style={{ color: "var(--admin-text-muted)" }}>Belum ada ucapan.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {guestbook.map((g) => (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="p-3 rounded-lg group"
                  style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-0.5" style={{ color: "var(--admin-text)" }}>{g.name}</p>
                      <p className="text-xs mb-1" style={{ color: "var(--admin-text-muted)" }}>{g.message}</p>
                      <span className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>
                        {new Date(g.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteGbTarget(g.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-[#F87171] hover:bg-[#F87171]/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deleteRsvpTarget !== null}
        onOpenChange={(o) => !o && setDeleteRsvpTarget(null)}
        title="Hapus entri RSVP ini?"
        description="Data RSVP akan dihapus permanen dari Firestore. Penghapusan langsung terlihat di rekap admin, namun jika tamu sudah melihat konfirmasinya, mereka tidak akan dapat melihat perubahan."
        onConfirm={handleDeleteRsvp}
      />
      <ConfirmDialog
        open={deleteGbTarget !== null}
        onOpenChange={(o) => !o && setDeleteGbTarget(null)}
        title="Hapus ucapan ini dari guestbook?"
        description="Ucapan akan langsung hilang dari tampilan guestbook di website tamu (realtime). Cocok untuk membuang ucapan spam/tidak pantas."
        onConfirm={handleDeleteGb}
      />
    </div>
  );
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
