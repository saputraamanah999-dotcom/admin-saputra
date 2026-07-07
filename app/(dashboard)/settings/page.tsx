// app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from "react";
import { setGlobalSettings } from "@/lib/mock-store";
import { apiPut } from "@/lib/api-client";
import { firebaseConfigured } from "@/lib/firebase/client";
import { useGlobalSettings } from "@/lib/use-realtime";
import { toast } from "sonner";
import { Save, Shield, Mail, Plus, Trash2, Code, Sparkles, ExternalLink, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface SettingsShape {
  allowedEmails: string[];
  devCredit: {
    enabled: boolean;
    message: string;
    contactLink: string;
    animate: boolean;
  };
}

const DEFAULT_SETTINGS: SettingsShape = {
  allowedEmails: ["saputraamanah999@gmail.com"],
  devCredit: {
    enabled: true,
    message: "Dipersembahkan oleh Saputra Developer",
    contactLink: "https://wa.me/6281234567890",
    animate: true,
  },
};

export default function SettingsPage() {
  // 🔔 Realtime via Firestore onSnapshot ke global/settings
  const { settings, loading } = useGlobalSettings<SettingsShape>(DEFAULT_SETTINGS);

  const [allowedEmails, setAllowedEmails] = useState<string[]>(DEFAULT_SETTINGS.allowedEmails);
  const [newEmail, setNewEmail] = useState("");
  const [devCredit, setDevCredit] = useState(DEFAULT_SETTINGS.devCredit);
  const [saving, setSaving] = useState(false);

  // Sync dari realtime settings → local state (untuk form editing)
  useEffect(() => {
    if (!loading && settings) {
      setAllowedEmails(settings.allowedEmails ?? DEFAULT_SETTINGS.allowedEmails);
      setDevCredit(settings.devCredit ?? DEFAULT_SETTINGS.devCredit);
    }
  }, [settings, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { allowedEmails, devCredit };
      // Optimistic: update local (untuk demo mode)
      setGlobalSettings(data);
      // Push ke server (Firestore global/settings via API route)
      if (firebaseConfigured) {
        await apiPut("/api/settings", data);
      }
      toast.success("Settings disimpan. Update realtime via Firestore.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    const e = newEmail.trim().toLowerCase();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      toast.error("Format email tidak valid");
      return;
    }
    if (allowedEmails.includes(e)) {
      toast.error("Email sudah ada di allowlist");
      return;
    }
    setAllowedEmails([...allowedEmails, e]);
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    if (allowedEmails.length <= 1) {
      toast.error("Minimal 1 email admin harus ada");
      return;
    }
    setAllowedEmails(allowedEmails.filter((e) => e !== email));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Settings
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Kelola allowlist email admin & kredit developer (dipakai di kedua website).
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="btn-gold border-0">
          <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Allowlist */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#C9A24B]" />
            <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>Allowlist Email Admin</h3>
          </div>
          <div className="space-y-2 mb-3">
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmail()}
                placeholder="saputraamanah999@gmail.com"
                className="input-admin h-9 text-sm"
              />
              <Button size="sm" onClick={addEmail} className="btn-gold border-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {allowedEmails.map((e) => (
              <div key={e} className="flex items-center gap-2 p-2.5 rounded-lg"
                   style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
                <Mail className="w-3.5 h-3.5 text-[#C9A24B] shrink-0" />
                <span className="text-xs flex-1" style={{ color: "var(--admin-text)" }}>{e}</span>
                <Button size="sm" variant="ghost" onClick={() => removeEmail(e)}
                        className="h-6 w-6 p-0 text-[#F87171] hover:bg-[#F87171]/10">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg p-3 flex gap-2 text-xs"
               style={{ background: "rgba(201, 162, 75, 0.08)", border: "1px solid rgba(201, 162, 75, 0.25)", color: "var(--admin-text)" }}>
            <Info className="w-4 h-4 text-[#C9A24B] shrink-0" />
            <div>
              <p className="font-medium mb-0.5">Catatan Keamanan</p>
              <p style={{ color: "var(--admin-text-muted)" }}>
                Allowlist ini juga harus diperkuat di server: Firestore Security Rules + Custom Claims (role: admin). Di demo mode, allowlist dicek di <code className="text-[#C9A24B]">verifyAdminToken</code> route handler.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Developer Credit */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-elevated rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-4 h-4 text-[#6B2C55]" />
            <h3 className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>Kredit Developer</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--admin-surface)" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--admin-text)" }}>Tampilkan badge kredit</p>
                <p className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>Muncul di pojok kanan bawah website tamu</p>
              </div>
              <Switch checked={devCredit.enabled} onCheckedChange={(v) => setDevCredit({ ...devCredit, enabled: v })} />
            </div>

            <div>
              <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Pesan Badge</Label>
              <Input
                value={devCredit.message}
                onChange={(e) => setDevCredit({ ...devCredit, message: e.target.value })}
                placeholder="Dipersembahkan oleh Saputra Developer"
                className="input-admin h-9 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Link Kontak (WA)</Label>
              <Input
                value={devCredit.contactLink}
                onChange={(e) => setDevCredit({ ...devCredit, contactLink: e.target.value })}
                placeholder="https://wa.me/6281234567890"
                className="input-admin h-9 text-sm mt-1"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--admin-surface)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A24B]" />
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--admin-text)" }}>Animasi gradient pelangi</p>
                  <p className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>Efek gradient bergerak di badge</p>
                </div>
              </div>
              <Switch checked={devCredit.animate} onCheckedChange={(v) => setDevCredit({ ...devCredit, animate: v })} />
            </div>

            {/* Preview */}
            {devCredit.enabled && (
              <div className="pt-2">
                <Label className="text-xs mb-2 block" style={{ color: "var(--admin-text-muted)" }}>Preview</Label>
                <div className="relative rounded-lg p-4" style={{ background: "var(--admin-surface)", height: 80 }}>
                  <a
                    href={devCredit.contactLink}
                    target="_blank"
                    rel="noreferrer"
                    className={`fixed bottom-4 right-4 z-40 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg bg-[length:200%_200%] ${
                      devCredit.animate ? "animate-[gradientMove_3s_ease_infinite]" : ""
                    } bg-gradient-to-r from-pink-500 via-yellow-400 via-green-400 via-blue-400 to-purple-500`}
                    onClick={(e) => e.preventDefault()}
                  >
                    {devCredit.message}
                    <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {/* Env vars reference */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-elevated rounded-xl p-5"
      >
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
          <Shield className="w-4 h-4 text-[#4ADE80]" /> Environment Variables (untuk produksi)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg" style={{ background: "var(--admin-surface)" }}>
            <p className="font-medium mb-1 text-[#C9A24B]">Client (NEXT_PUBLIC_*)</p>
            <ul className="space-y-0.5" style={{ color: "var(--admin-text-muted)" }}>
              <li><code>NEXT_PUBLIC_FIREBASE_API_KEY</code></li>
              <li><code>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code></li>
              <li><code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code></li>
              <li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
              <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              <li><code>NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS</code></li>
            </ul>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "var(--admin-surface)" }}>
            <p className="font-medium mb-1 text-[#F87171]">Server-only (JANGAN prefix NEXT_PUBLIC_)</p>
            <ul className="space-y-0.5" style={{ color: "var(--admin-text-muted)" }}>
              <li><code>FIREBASE_ADMIN_PROJECT_ID</code></li>
              <li><code>FIREBASE_ADMIN_CLIENT_EMAIL</code></li>
              <li><code>FIREBASE_ADMIN_PRIVATE_KEY</code></li>
              <li><code>SUPABASE_SERVICE_ROLE_KEY</code></li>
              <li><code>ADMIN_ALLOWED_EMAILS</code></li>
            </ul>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
