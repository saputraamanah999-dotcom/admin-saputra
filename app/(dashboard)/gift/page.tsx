// app/(dashboard)/gift/page.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { useGiftConfig, useGiftTransactions } from "@/lib/use-realtime";
import { saveGiftConfig } from "@/lib/data-service";
import { toast } from "sonner";
import { Save, Plus, Trash2, QrCode, Building2, Gift as GiftIcon, RefreshCw, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { GiftForm } from "@/lib/schemas";

const DEFAULT: GiftForm = {
  qrisImageUrl: "",
  banks: [],
};

export default function GiftPage() {
  const siteId = useSiteStore((s) => s.siteId);
  const { config, loading } = useGiftConfig<GiftForm>(siteId, DEFAULT);
  const { items: transactions } = useGiftTransactions(siteId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<GiftForm>(DEFAULT);
  const [delBank, setDelBank] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && config) setForm(config);
  }, [config, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveGiftConfig(siteId, form);
      toast.success("Konfigurasi gift tersimpan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const addBank = () => {
    setForm({
      ...form,
      banks: [...form.banks, { id: `b-${Date.now()}`, bank: "", accountNumber: "", accountName: "" }],
    });
  };

  const removeBank = (id: string) => {
    setForm({ ...form, banks: form.banks.filter((b) => b.id !== id) });
    setDelBank(null);
  };

  const updateBank = (id: string, field: keyof typeof form.banks[0], value: string) => {
    setForm({
      ...form,
      banks: form.banks.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    });
  };

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Gift & QRIS
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Atur QRIS statis & daftar rekening. Tamu akan melihat info ini di section gift website.
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
          {/* QRIS */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated rounded-xl p-5"
          >
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <QrCode className="w-4 h-4 text-[#C9A24B]" /> QRIS Statis
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs" style={{ color: "var(--admin-text-muted)" }}>URL Gambar QRIS</Label>
                <Input
                  value={form.qrisImageUrl}
                  onChange={(e) => setForm({ ...form, qrisImageUrl: e.target.value })}
                  placeholder="https://…/qris.png"
                  className="input-admin h-9 text-sm mt-1"
                />
              </div>
              {form.qrisImageUrl && (
                <div className="rounded-lg overflow-hidden p-4 flex justify-center" style={{ background: "var(--admin-surface)" }}>
                  { }
                  <img src={form.qrisImageUrl} alt="QRIS Preview" className="w-48 h-48 object-contain" />
                </div>
              )}
              <div className="rounded-lg p-3 text-xs flex gap-2"
                   style={{ background: "rgba(201, 162, 75, 0.08)", border: "1px solid rgba(201, 162, 75, 0.25)", color: "var(--admin-text)" }}>
                <DollarSign className="w-4 h-4 text-[#C9A24B] shrink-0" />
                <div>
                  <p className="font-medium mb-0.5">Catatan Pengembangan Lanjutan</p>
                  <p style={{ color: "var(--admin-text-muted)" }}>
                    QRIS statis tidak bisa otomatis konfirmasi pembayaran. Untuk konfirmasi otomatis, integrasikan Midtrans/Xendit untuk generate QRIS dinamis per transaksi.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Rekening */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elevated rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
                <Building2 className="w-4 h-4 text-[#6B2C55]" /> Daftar Rekening
              </h3>
              <Button size="sm" variant="outline" onClick={addBank}
                      className="border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
              </Button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {form.banks.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--admin-text-muted)" }}>
                  Belum ada rekening. Klik "Tambah" untuk menambah.
                </p>
              ) : (
                form.banks.map((b) => (
                  <div key={b.id} className="p-3 rounded-lg space-y-2"
                       style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: "var(--admin-text)" }}>{b.bank || "Bank Baru"}</span>
                      <Button size="sm" variant="ghost" onClick={() => setDelBank(b.id)}
                              className="h-6 w-6 p-0 text-[#F87171] hover:bg-[#F87171]/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={b.bank} onChange={(e) => updateBank(b.id, "bank", e.target.value)} placeholder="BCA" className="input-admin h-8 text-xs" />
                      <Input value={b.accountNumber} onChange={(e) => updateBank(b.id, "accountNumber", e.target.value)} placeholder="0123456789" className="input-admin h-8 text-xs" />
                      <Input value={b.accountName} onChange={(e) => updateBank(b.id, "accountName", e.target.value)} placeholder="Nama Pemilik" className="input-admin h-8 text-xs col-span-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.section>

          {/* Transactions */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated rounded-xl p-5 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
                <GiftIcon className="w-4 h-4 text-[#4ADE80]" /> Transaksi Kado Masuk
              </h3>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>Total Terkumpul</div>
                <div className="text-lg font-semibold" style={{ color: "#4ADE80", fontFamily: "var(--font-cormorant)" }}>
                  Rp {totalAmount.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--admin-text-muted)" }}>Belum ada transaksi.</p>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "var(--admin-surface)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: "rgba(74, 222, 128, 0.15)" }}>
                      <GiftIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--admin-text)" }}>{t.sender}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--admin-text-muted)" }}>{t.message}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold" style={{ color: "#4ADE80" }}>Rp {t.amount.toLocaleString("id-ID")}</div>
                      <div className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>{t.method}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.section>
        </div>
      )}

      <ConfirmDialog
        open={delBank !== null}
        onOpenChange={(o) => !o && setDelBank(null)}
        title="Hapus rekening ini?"
        description="Rekening akan dihapus dari daftar. Klik Simpan untuk permanen menyimpan perubahan."
        confirmLabel="Hapus"
        onConfirm={() => delBank && removeBank(delBank)}
      />
    </div>
  );
}
