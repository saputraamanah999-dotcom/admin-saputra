// app/(dashboard)/guests/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { useEffect, useState } from "react";
import {
  createGuest, updateGuest, deleteGuest, seedGuestsIfEmpty,
} from "@/lib/data-service";
import { buildGuestUrl, getSite } from "@/lib/sites";
import { useSiteConfig, useGuests } from "@/lib/use-realtime";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { UserPlus, Copy, MessageCircle, Trash2, Pencil, Users, RefreshCw, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GuestRow } from "@/lib/types";
import type { ContentForm } from "@/lib/schemas";

export default function GuestsPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const site = getSite(siteId);
  // 🔔 Realtime via Firestore onSnapshot — data auto-update tanpa refresh
  const { items: guests, loading } = useGuests(siteId);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuestRow | null>(null);
  const [editTarget, setEditTarget] = useState<GuestRow | null>(null);
  const [search, setSearch] = useState("");
  const { config } = useSiteConfig<ContentForm>(siteId, {} as ContentForm);

  // Seed demo data sekali saat demo mode (tidak ada efek di production dengan Firestore)
  useEffect(() => {
    seedGuestsIfEmpty(siteId);
  }, [siteId]);

  const handleCopyLink = async (slug: string) => {
    const url = buildGuestUrl(siteId, slug);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link undangan disalin.");
    } catch {
      toast.error("Gagal menyalin link.");
    }
  };

  const handleSendWA = (guest: GuestRow) => {
    const url = buildGuestUrl(siteId, guest.slug);
    const template = config.shareMessageTemplate ?? "Dengan penuh sukacita, kami mengundang {guestName} — {link}";
    const message = template
      .replace(/\{guestName\}/g, guest.name)
      .replace(/\{link\}/g, url);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const filtered = guests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Daftar Tamu
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Kelola tamu resmi & generate link undangan personal. Data realtime via Firestore onSnapshot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Data tamu realtime via Firestore onSnapshot — auto-update tanpa refresh manual.")} className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }} className="btn-gold border-0">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Tambah Tamu
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#C9A24B]" />
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Total Tamu</span>
          </div>
          <div className="text-2xl font-semibold" style={{ color: "var(--admin-text)", fontFamily: "var(--font-cormorant)" }}>{guests.length}</div>
        </div>
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#6B2C55]" />
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Total Kuota</span>
          </div>
          <div className="text-2xl font-semibold" style={{ color: "var(--admin-text)", fontFamily: "var(--font-cormorant)" }}>
            {guests.reduce((s, g) => s + g.invited_count, 0)}
          </div>
        </div>
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ExternalLink className="w-4 h-4 text-[#4ADE80]" />
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Site Base URL</span>
          </div>
          <div className="text-xs truncate" style={{ color: "var(--admin-text)" }}>
            {buildGuestUrl(siteId, "").replace(/\/$/, "")}
          </div>
        </div>
      </div>

      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama atau slug…"
        className="input-admin h-9 text-sm max-w-md"
      />

      {/* Table */}
      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--admin-surface)", borderBottom: "1px solid var(--admin-border)" }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Nama</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Slug</th>
                <th className="text-center px-4 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Kuota</th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#C9A24B]" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  Tidak ada tamu. Klik "Tambah Tamu" untuk mulai.
                </td></tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((g) => (
                    <motion.tr
                      key={g.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ borderBottom: "1px solid var(--admin-border)" }}
                    >
                      <td className="px-4 py-3" style={{ color: "var(--admin-text)" }}>{g.name}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--admin-surface-2)", color: "#C9A24B" }}>
                          {g.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color: "var(--admin-text)" }}>{g.invited_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleCopyLink(g.slug)} title="Copy link"
                                  className="h-7 w-7 p-0 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleSendWA(g)} title="Kirim WhatsApp"
                                  className="h-7 w-7 p-0 text-[#4ADE80] hover:bg-[#4ADE80]/10">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditTarget(g); setFormOpen(true); }} title="Edit"
                                  className="h-7 w-7 p-0 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(g)} title="Hapus"
                                  className="h-7 w-7 p-0 text-[#F87171] hover:bg-[#F87171]/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <GuestFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditTarget(null);
        }}
        siteId={siteId}
        existing={editTarget}
        onSaved={() => {
          // Realtime via onSnapshot — tidak perlu manual refresh
          // Hook useGuests akan auto-update ketika Firestore emit change
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={`Hapus tamu "${deleteTarget?.name ?? ""}"?`}
        description="Data tamu akan dihapus permanen dari database. Catatan RSVP/ucapan yang pernah dibuat tamu ini TIDAK otomatis terhapus — silakan hapus manual di halaman RSVP jika perlu."
        confirmLabel="Hapus Permanen"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteGuest(siteId, deleteTarget.id);
            toast.success(`Tamu "${deleteTarget.name}" dihapus.`);
            setDeleteTarget(null);
            // Realtime via onSnapshot — daftar tamu auto-update tanpa refresh manual
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Gagal menghapus");
          }
        }}
      />
    </div>
  );
}

function GuestFormDialog({ open, onOpenChange, siteId, existing, onSaved }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  siteId: string;
  existing: GuestRow | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [count, setCount] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(existing?.name ?? "");
      setSlug(existing?.slug ?? "");
      setCount(existing?.invited_count ?? 1);
    }
  }, [open, existing]);

  const handleSubmit = async () => {
    if (!name || !slug) {
      toast.error("Nama dan slug wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateGuest(siteId, existing.id, { name, slug, invited_count: count });
        toast.success("Tamu diperbarui.");
      } else {
        await createGuest(siteId, { name, slug, invited_count: count });
        toast.success("Tamu ditambahkan.");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => onOpenChange(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl p-6"
        style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
      >
        <h3 className="text-xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
          {existing ? "Edit Tamu" : "Tambah Tamu Baru"}
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Nama Tamu</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Budi Santoso" className="input-admin h-9 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Slug (untuk URL ?to=slug)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="budi-santoso"
              className="input-admin h-9 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Jumlah Tamu Diundang</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="input-admin h-9 text-sm mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}
                  className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="btn-gold border-0">
            {saving ? "Menyimpan…" : existing ? "Update" : "Tambah"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
