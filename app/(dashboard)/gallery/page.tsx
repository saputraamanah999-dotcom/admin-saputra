// app/(dashboard)/gallery/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { useGallery } from "@/lib/use-realtime";
import { addPhoto, updatePhoto, deletePhoto, reorderPhotos } from "@/lib/data-service";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { Upload, Trash2, ArrowUp, ArrowDown, RefreshCw, ImageIcon, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function GalleryPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const { items: photos, loading } = useGallery(siteId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string; title: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newOrient, setNewOrient] = useState<"left" | "right">("left");
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = [...photos].sort((a, b) => a.order - b.order);

  const handleAdd = async () => {
    if (!newUrl || !newTitle) {
      toast.error("URL dan judul wajib diisi");
      return;
    }
    try {
      await addPhoto(siteId, {
        url: newUrl,
        title: newTitle,
        orientation: newOrient,
        order: photos.length,
      });
      toast.success("Foto ditambahkan ke galeri.");
      setAddOpen(false);
      setNewUrl("");
      setNewTitle("");
      setNewOrient("left");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah foto");
    }
  };

  const handleDelete = async () => {
    if (!target) return;
    try {
      await deletePhoto(siteId, target.id);
      toast.success(`Foto "${target.title}" dihapus dari galeri & storage.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDialogOpen(false);
      setTarget(null);
    }
  };

  const handleToggleOrient = async (id: string, current: "left" | "right") => {
    const next = current === "left" ? "right" : "left";
    try {
      await updatePhoto(siteId, id, { orientation: next });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update");
    }
  };

  const handleMove = async (index: number, dir: "up" | "down") => {
    const swapWith = dir === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const newOrder = sorted.map((p) => p.id);
    [newOrder[index], newOrder[swapWith]] = [newOrder[swapWith], newOrder[index]];
    try {
      await reorderPhotos(siteId, newOrder);
      toast.success("Urutan diperbarui.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal reorder");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to data URL for demo (in production: upload to Supabase Storage, get URL)
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      try {
        await addPhoto(siteId, {
          url,
          title: file.name.replace(/\.[^.]+$/, ""),
          orientation: "left",
          order: photos.length,
        });
        toast.success("Foto diupload & ditambahkan ke galeri.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal upload");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Gallery Manager
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Upload foto prewedding, atur urutan swipe, dan tandai foto untuk baris kiri/kanan. Perubahan realtime ke website tamu.
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload File
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="btn-gold border-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah URL
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="card-elevated rounded-xl p-12 text-center">
          <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#C9A24B]" />
          <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Memuat galeri…</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="card-elevated rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--admin-text-muted)" }} />
          <p className="text-sm mb-1" style={{ color: "var(--admin-text)" }}>Belum ada foto galeri</p>
          <p className="text-xs mb-4" style={{ color: "var(--admin-text-muted)" }}>Upload foto pertama untuk mulai.</p>
          <Button size="sm" onClick={() => fileRef.current?.click()} className="btn-gold border-0">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sorted.map((photo, idx) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-elevated rounded-xl overflow-hidden group"
              >
                <div className="relative aspect-[4/3]" style={{ background: "var(--admin-surface)" }}>
                  { }
                  <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold"
                       style={{ background: photo.orientation === "left" ? "#C9A24B" : "#6B2C55", color: "#0B0B10" }}>
                    {photo.orientation === "left" ? "KIRI" : "KANAN"}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px]"
                       style={{ background: "rgba(11, 11, 16, 0.8)", color: "#F4F1EA" }}>
                    #{idx + 1}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleMove(idx, "up")} disabled={idx === 0}
                            className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-2)]">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMove(idx, "down")} disabled={idx === sorted.length - 1}
                            className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-2)]">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleOrient(photo.id, photo.orientation)}
                            className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-2)]">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline"
                            onClick={() => {
                              setTarget({ id: photo.id, title: photo.title });
                              setDialogOpen(true);
                            }}
                            className="bg-[#F87171]/20 border-[#F87171]/40 text-[#F87171] hover:bg-[#F87171]/30">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--admin-text)" }}>{photo.title}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--admin-text-muted)" }}>{photo.url.slice(0, 50)}…</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add URL Dialog */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
             onClick={() => setAddOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl p-6"
            style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
          >
            <h3 className="text-xl mb-4" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
              Tambah Foto via URL
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>URL Foto</Label>
                <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://images.unsplash.com/photo-…" className="input-admin h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Judul</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Prewedding di Pantai" className="input-admin h-9 text-sm mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Baris Kanan (default: Kiri)</Label>
                <Switch checked={newOrient === "right"} onCheckedChange={(v) => setNewOrient(v ? "right" : "left")} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}
                      className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
                Batal
              </Button>
              <Button size="sm" onClick={handleAdd} className="btn-gold border-0">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setTarget(null);
        }}
        title={`Hapus foto "${target?.title ?? ""}"?`}
        description="Foto akan dihapus permanen dari Firestore dan file aslinya di Storage. Tidak bisa dibatalkan. Tamu yang sedang melihat galeri akan langsung tidak melihat foto ini lagi."
        onConfirm={handleDelete}
      />
    </div>
  );
}
