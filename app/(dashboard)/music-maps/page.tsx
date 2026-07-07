// app/(dashboard)/music-maps/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { useSiteConfig } from "@/lib/use-realtime";
import { saveContent } from "@/lib/data-service";
import { toast } from "sonner";
import { Save, Music, MapPin, RefreshCw, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContentForm } from "@/lib/schemas";

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

export default function MusicMapsPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const { config, loading } = useSiteConfig<ContentForm>(siteId, DEFAULT);
  const [form, setForm] = useState<ContentForm>(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && config) setForm(config);
  }, [config, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveContent(siteId, form);
      toast.success("Music & Maps disimpan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Music & Maps
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Atur lagu background & embed Google Maps untuk lokasi acara.
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving || loading} className="btn-gold border-0">
          <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>

      {loading ? (
        <div className="card-elevated rounded-xl p-12 text-center">
          <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-[#C9A24B]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Music */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated rounded-xl p-5"
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <Music className="w-4 h-4 text-[#C9A24B]" /> Lagu Background
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>URL File Audio (MP3/OGG)</Label>
                <Input
                  value={form.musicUrl}
                  onChange={(e) => setForm({ ...form, musicUrl: e.target.value })}
                  placeholder="https://example.com/song.mp3"
                  className="input-admin h-9 text-sm mt-1"
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--admin-text-muted)" }}>
                  Disarankan: file MP3 di-host di Supabase Storage atau CDN. Hindara Google Drive direct link (sering berubah).
                </p>
              </div>
              {form.musicUrl && (
                <div className="p-3 rounded-lg" style={{ background: "var(--admin-surface)" }}>
                  <p className="text-[10px] mb-2" style={{ color: "var(--admin-text-muted)" }}>Preview</p>
                  <audio controls src={form.musicUrl} className="w-full h-8" style={{ filter: "invert(0.9)" }} />
                </div>
              )}
            </div>
          </motion.section>

          {/* Maps */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elevated rounded-xl p-5"
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <MapPin className="w-4 h-4 text-[#6B2C55]" /> Lokasi Acara
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Nama Venue</Label>
                <Input
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="Puri Tirta Spiritual, Ubud, Bali"
                  className="input-admin h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Google Maps Embed URL</Label>
                <Textarea
                  value={form.mapsEmbed}
                  onChange={(e) => setForm({ ...form, mapsEmbed: e.target.value })}
                  rows={3}
                  placeholder="https://www.google.com/maps/embed?pb=…"
                  className="input-admin text-xs mt-1"
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--admin-text-muted)" }}>
                  Buka Google Maps → Share → Embed a map → copy bagian src= URL.
                </p>
              </div>
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Link Google Maps (untuk tombol "Lihat Lokasi")</Label>
                <Input
                  value={form.mapsLink}
                  onChange={(e) => setForm({ ...form, mapsLink: e.target.value })}
                  placeholder="https://maps.google.com/?q=…"
                  className="input-admin h-9 text-sm mt-1"
                />
              </div>
              {form.mapsLink && (
                <a href={form.mapsLink} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1.5 text-xs text-[#C9A24B] hover:underline">
                  <ExternalLink className="w-3 h-3" /> Test link
                </a>
              )}
              {form.mapsEmbed && (
                <div className="rounded-lg overflow-hidden" style={{ background: "var(--admin-surface)" }}>
                  <iframe
                    src={form.mapsEmbed}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Maps Preview"
                  />
                </div>
              )}
            </div>
          </motion.section>
        </div>
      )}
    </div>
  );
}
