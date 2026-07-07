// app/(dashboard)/announcements/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { useAnnouncements } from "@/lib/use-realtime";
import { createAnnouncement, toggleAnnouncement, deleteAnnouncement, type AnnouncementTarget } from "@/lib/data-service";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, Bell, RefreshCw, Send, Globe2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SITES } from "@/lib/sites";

export default function AnnouncementsPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const { items, loading } = useAnnouncements(siteId);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);
  const [target, setTarget] = useState<AnnouncementTarget>(siteId as AnnouncementTarget);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title || !body) {
      toast.error("Judul dan isi wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const result = await createAnnouncement(siteId, { title, body, active }, target);
      const sitesLabel = result.sentTo.length === 2 ? "kedua website" : `website ${result.sentTo[0]}`;

      if (active) {
        toast.success(
          `Pengumuman dikirim ke ${sitesLabel}. Banner realtime aktif. Push notif: ${result.fcmSent} terkirim${result.fcmFailed > 0 ? `, ${result.fcmFailed} gagal` : ""}.`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Pengumuman dibuat (nonaktif) di ${sitesLabel}.`);
      }

      setFormOpen(false);
      setTitle("");
      setBody("");
      setActive(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat pengumuman");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleAnnouncement(siteId, id, !current);
      toast.success(`Pengumuman ${!current ? "diaktifkan" : "dinonaktifkan"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal toggle");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAnnouncement(siteId, deleteTarget);
      toast.success("Pengumuman dihapus permanen. Banner di website tamu akan hilang otomatis (realtime).");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Pengumuman
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Banner pengumuman tampil realtime di website tamu. Bisa kirim ke 1 site atau <span style={{ color: "var(--admin-gold)" }}>kedua website sekaligus</span>. Push notification (FCM) dikirim ke tamu yang sudah subscribe.
          </p>
        </div>
        <Button size="sm" onClick={() => { setTarget(siteId as AnnouncementTarget); setFormOpen(true); }} className="btn-gold border-0">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Buat Pengumuman
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-lg p-4 flex items-start gap-3"
           style={{ background: "linear-gradient(135deg, rgba(201, 162, 75, 0.08) 0%, rgba(107, 44, 85, 0.08) 100%)", border: "1px solid rgba(201, 162, 75, 0.25)" }}>
        <Globe2 className="w-5 h-5 text-[#C9A24B] shrink-0 mt-0.5" />
        <div className="text-xs" style={{ color: "var(--admin-text)" }}>
          <p className="font-medium mb-1">Fitur Broadcast Multi-Site</p>
          <p style={{ color: "var(--admin-text-muted)" }}>
            Saat membuat pengumuman, pilih target: <span style={{ color: "var(--admin-text)" }}>Website 1 saja</span>, <span style={{ color: "var(--admin-text)" }}>Website 2 saja</span>, atau <span style={{ color: "var(--admin-gold)" }}>Kedua Website Sekaligus</span>. Pengumuman akan ditulis ke koleksi Firestore masing-masing site dan FCM dikirim ke token dari semua site target.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card-elevated rounded-xl p-12 text-center">
          <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#C9A24B]" />
        </div>
      ) : items.length === 0 ? (
        <div className="card-elevated rounded-xl p-12 text-center">
          <Megaphone className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--admin-text-muted)" }} />
          <p className="text-sm mb-1" style={{ color: "var(--admin-text)" }}>Belum ada pengumuman di {SITES.find(s => s.id === siteId)?.coupleNames}</p>
          <p className="text-xs mb-4" style={{ color: "var(--admin-text-muted)" }}>Buat pengumuman pertama untuk tamu.</p>
          <Button size="sm" onClick={() => setFormOpen(true)} className="btn-gold border-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Buat Pengumuman
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="card-elevated rounded-xl p-4"
                style={{
                  borderLeft: item.active ? "3px solid #C9A24B" : "3px solid var(--admin-border)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 shrink-0" style={{ color: item.active ? "#C9A24B" : "var(--admin-text-muted)" }} />
                      <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{item.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: item.active ? "rgba(74, 222, 128, 0.15)" : "var(--admin-surface-2)",
                              color: item.active ? "#4ADE80" : "var(--admin-text-muted)",
                            }}>
                        {item.active ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: "var(--admin-text-muted)" }}>{item.body}</p>
                    <p className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>
                      Dibuat {new Date(item.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {" · "}site: <code style={{ color: "var(--admin-gold)" }}>{siteId}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3 h-3" style={{ color: "var(--admin-text-muted)" }} />
                      <Switch checked={item.active} onCheckedChange={() => handleToggle(item.id, item.active)} />
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(item.id)}
                            className="h-7 w-7 p-0 text-[#F87171] hover:bg-[#F87171]/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setFormOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl p-6"
            style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #C9A24B 0%, #6B2C55 100%)" }}>
                <Megaphone className="w-4 h-4 text-[#0B0B10]" />
              </div>
              <div>
                <h3 className="text-xl" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>Buat Pengumuman</h3>
                <p className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>Banner realtime + push notification (FCM)</p>
              </div>
            </div>
            <div className="space-y-3">
              {/* TARGET SELECTOR — BROADCAST FEATURE */}
              <div>
                <Label className="text-xs mb-2 block" style={{ color: "var(--admin-text-muted)" }}>Target Website</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SITES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTarget(s.id as AnnouncementTarget)}
                      className="p-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: target === s.id ? "rgba(201, 162, 75, 0.12)" : "var(--admin-surface)",
                        border: target === s.id ? "1px solid #C9A24B" : "1px solid var(--admin-border)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-widest" style={{ color: target === s.id ? "#C9A24B" : "var(--admin-text-muted)" }}>
                          {s.id === "site-1" ? "Website 1" : "Website 2"}
                        </span>
                        {target === s.id && <CheckCircle2 className="w-3 h-3 text-[#C9A24B]" />}
                      </div>
                      <div className="text-xs font-medium truncate" style={{ color: "var(--admin-text)" }}>{s.coupleNames}</div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTarget("both")}
                    className="p-2.5 rounded-lg text-left transition-all"
                    style={{
                      background: target === "both" ? "linear-gradient(135deg, rgba(201, 162, 75, 0.15) 0%, rgba(107, 44, 85, 0.15) 100%)" : "var(--admin-surface)",
                      border: target === "both" ? "1px solid #C9A24B" : "1px solid var(--admin-border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: target === "both" ? "#C9A24B" : "var(--admin-text-muted)" }}>
                        Kedua
                      </span>
                      {target === "both" && <CheckCircle2 className="w-3 h-3 text-[#C9A24B]" />}
                    </div>
                    <div className="text-xs font-medium" style={{ color: "var(--admin-text)" }}>Broadcast</div>
                  </button>
                </div>
                {target === "both" && (
                  <div className="mt-2 rounded-md p-2 flex gap-2 text-[10px]"
                       style={{ background: "rgba(201, 162, 75, 0.08)", color: "var(--admin-text)" }}>
                    <Globe2 className="w-3 h-3 text-[#C9A24B] shrink-0 mt-0.5" />
                    <span>Pengumuman akan dikirim ke <strong>kedua website</strong> sekaligus. Firestore write + FCM dikirim ke token dari kedua site.</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Judul</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Perubahan Jadwal Acara" className="input-admin h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Isi Pengumuman</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Mohon maaf, acara resepsi dimajukan 30 menit menjadi 10:30 WITA." className="input-admin text-sm mt-1" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--admin-surface-2)" }}>
                <div className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-[#C9A24B]" />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--admin-text)" }}>Aktifkan segera + kirim push notif</p>
                    <p className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>Banner tampil + FCM dikirim ke tamu yang subscribe</p>
                  </div>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}
                      className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
                Batal
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving} className="btn-gold border-0">
                {saving ? "Mengirim…" : target === "both" ? "Broadcast ke 2 Website" : "Kirim Pengumuman"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus pengumuman ini permanen?"
        description="Pengumuman akan dihapus dari Firestore. Banner yang sedang tampil di website tamu akan langsung hilang (realtime). Tidak bisa dibatalkan."
        confirmLabel="Hapus Permanen"
        onConfirm={handleDelete}
      />
    </div>
  );
}
