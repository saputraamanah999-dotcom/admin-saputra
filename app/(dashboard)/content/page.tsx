// app/(dashboard)/content/page.tsx
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentSchema, type ContentForm } from "@/lib/schemas";
import { useSiteStore } from "@/lib/site-store";
import { useSiteConfig } from "@/lib/use-realtime";
import { saveContent } from "@/lib/data-service";
import { toast } from "sonner";
import { Save, RotateCcw, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DEFAULT: ContentForm = {
  coupleNames: "",
  weddingDate: "",
  akadTime: "08:00",
  receptionTime: "11:00",
  venue: "",
  mapsEmbed: "",
  mapsLink: "",
  quotes: "Om Swastyastu",
  musicUrl: "",
  preweddingCoverUrl: "",
  gapuraUrl: "",
  themeColor: "#C9A24B",
  shareMessageTemplate: "Dengan penuh sukacita, kami mengundang {guestName} — {link}",
  primaryBtnText: "Buka Undangan",
  secondaryBtnText: "Lihat Lokasi",
};

export default function ContentPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const { config, loading } = useSiteConfig<ContentForm>(siteId, DEFAULT);
  const [saving, setSaving] = useState(false);

  const form = useForm<ContentForm>({
    resolver: zodResolver(contentSchema),
    defaultValues: DEFAULT,
  });

  // Sync form ketika config load berubah
  useEffect(() => {
    if (!loading && config) {
      form.reset(config);
    }
  }, [config, loading, form]);

  const onSubmit = async (data: ContentForm) => {
    setSaving(true);
    try {
      await saveContent(siteId, data);
      toast.success("Konten tersimpan — website tamu langsung update realtime.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof ContentForm, label: string, type: string = "text", placeholder?: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{label}</Label>
      <Input
        type={type}
        {...form.register(name)}
        placeholder={placeholder}
        className="input-admin h-9 text-sm"
      />
      {form.formState.errors[name] && (
        <p className="text-[10px] text-[#F87171]">{form.formState.errors[name]?.message as string}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Content Editor
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Ubah seluruh teks, tanggal, dan link undangan. Perubahan langsung sinkron ke website tamu tanpa redeploy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => form.reset(config)} className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={saving || loading} className="btn-gold border-0">
            <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="card-elevated rounded-xl p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#C9A24B] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Memuat konfigurasi…</p>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Identitas Pasangan */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated rounded-xl p-5 lg:col-span-2"
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <span className="w-1 h-4 bg-[#C9A24B] rounded-full" /> Identitas Pasangan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("coupleNames", "Nama Pasangan", "text", "Wayan & Putri")}
              {field("weddingDate", "Tanggal Pernikahan", "date")}
              {field("akadTime", "Jam Akad", "time")}
              {field("receptionTime", "Jam Resepsi", "time")}
              <div className="sm:col-span-2">
                {field("venue", "Lokasi Acara", "text", "Puri Tirta Spiritual, Ubud, Bali")}
              </div>
              <div className="sm:col-span-2">
                {field("mapsEmbed", "Google Maps Embed URL", "url", "https://www.google.com/maps/embed?pb=…")}
              </div>
              <div className="sm:col-span-2">
                {field("mapsLink", "Link Google Maps", "url", "https://maps.google.com/?q=…")}
              </div>
            </div>
          </motion.section>

          {/* Tema & Aksen */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elevated rounded-xl p-5"
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <span className="w-1 h-4 bg-[#6B2C55] rounded-full" /> Tema & Aksen
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Warna Tema</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.watch("themeColor")}
                    onChange={(e) => form.setValue("themeColor", e.target.value)}
                    className="w-12 h-9 rounded-md cursor-pointer"
                    style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
                  />
                  <Input {...form.register("themeColor")} className="input-admin h-9 text-sm flex-1" />
                </div>
                {form.formState.errors.themeColor && (
                  <p className="text-[10px] text-[#F87171]">{form.formState.errors.themeColor.message as string}</p>
                )}
              </div>
              {field("quotes", "Salam / Quotes", "text", "Om Swastyastu")}
              {field("primaryBtnText", "Teks Tombol Utama", "text", "Buka Undangan")}
              {field("secondaryBtnText", "Teks Tombol Sekunder", "text", "Lihat Lokasi")}
            </div>
          </motion.section>

          {/* Media */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated rounded-xl p-5 lg:col-span-2"
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <span className="w-1 h-4 bg-[#C9A24B] rounded-full" /> Media & Aset
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("musicUrl", "URL Lagu Background", "url", "https://…/song.mp3")}
              {field("preweddingCoverUrl", "URL Foto Cover Prewedding", "url", "https://…/cover.jpg")}
              <div className="sm:col-span-2">
                {field("gapuraUrl", "URL Foto Gapura (Bali Gate)", "url", "https://…/gapura.jpg")}
              </div>
            </div>
            {(form.watch("preweddingCoverUrl") || form.watch("gapuraUrl")) && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {form.watch("preweddingCoverUrl") && (
                  <div className="rounded-lg overflow-hidden aspect-video" style={{ background: "var(--admin-surface)" }}>
                    { }
                    <img src={form.watch("preweddingCoverUrl")} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>
                )}
                {form.watch("gapuraUrl") && (
                  <div className="rounded-lg overflow-hidden aspect-video" style={{ background: "var(--admin-surface)" }}>
                    { }
                    <img src={form.watch("gapuraUrl")} alt="Gapura preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </motion.section>

          {/* Share Template */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-elevated rounded-xl p-5"
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <span className="w-1 h-4 bg-[#6B2C55] rounded-full" /> Template Share
            </h3>
            <div className="space-y-3">
              <Textarea
                {...form.register("shareMessageTemplate")}
                rows={5}
                className="input-admin text-sm"
                placeholder="Dengan penuh sukacita, kami mengundang {guestName} — {link}"
              />
              {form.formState.errors.shareMessageTemplate && (
                <p className="text-[10px] text-[#F87171]">{form.formState.errors.shareMessageTemplate.message as string}</p>
              )}
              <div className="text-[10px] space-y-1" style={{ color: "var(--admin-text-muted)" }}>
                <p>Variabel yang tersedia:</p>
                <ul className="space-y-0.5 ml-3">
                  <li><code className="text-[#C9A24B]">{"{guestName}"}</code> — Nama tamu (otomatis dari slug)</li>
                  <li><code className="text-[#C9A24B]">{"{link}"}</code> — URL undangan personal</li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Hidden submit for Enter key */}
          <button type="submit" className="hidden" />
        </form>
      )}
    </div>
  );
}
