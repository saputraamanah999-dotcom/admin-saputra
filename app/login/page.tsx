// app/login/page.tsx
'use client';

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/admin/AuthProvider";
import { loginWithGoogle, firebaseConfigured } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { SITES } from "@/lib/sites";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  // Kalau sudah login, redirect ke dashboard
  useEffect(() => {
    if (!loading && user) {
      const redirect = search.get("redirect") ?? "/dashboard";
      router.replace(redirect);
    }
  }, [user, loading, router]);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
      toast.success("Login berhasil — selamat datang, Admin.");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ background: "radial-gradient(ellipse at top, rgba(107, 44, 85, 0.18) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(201, 162, 75, 0.12) 0%, transparent 50%), #0B0B10" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo / Crown */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
               style={{ background: "linear-gradient(135deg, #C9A24B 0%, #6B2C55 100%)", boxShadow: "0 8px 32px -8px rgba(201, 162, 75, 0.5)" }}>
            <Crown className="w-10 h-10 text-[#0B0B10]" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-semibold text-gold-gradient mb-2" style={{ fontFamily: "var(--font-cormorant)" }}>
            Master Control
          </h1>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Admin Panel Wedding Invitation CMS
          </p>
        </div>

        {/* Card */}
        <div className="card-elevated rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-[#C9A24B]" />
            <span className="text-xs uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
              Akses Terbatas
            </span>
          </div>

          <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-cormorant)", color: "var(--admin-text)" }}>
            Masuk sebagai Admin
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--admin-text-muted)" }}>
            Hanya email terdaftar di allowlist yang dapat mengakses panel ini. Login dibatasi ke {SITES.length} situs undangan.
          </p>

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            disabled={busy || !firebaseConfigured}
            className="btn-gold w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#0B0B10" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#0B0B10" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#0B0B10" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#0B0B10" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {firebaseConfigured ? "Masuk dengan Google" : "Google Auth Belum Dikonfigurasi"}
          </button>

          {!firebaseConfigured && (
            <div className="rounded-lg p-3 mt-4 flex gap-2 text-xs"
                 style={{ background: "rgba(201, 162, 75, 0.08)", border: "1px solid rgba(201, 162, 75, 0.25)", color: "var(--admin-text)" }}>
              <AlertCircle className="w-4 h-4 text-[#C9A24B] shrink-0" />
              <div>
                <p className="font-medium mb-1">Firebase belum dikonfigurasi</p>
                <p style={{ color: "var(--admin-text-muted)" }}>
                  Set <code className="text-[#C9A24B]">NEXT_PUBLIC_FIREBASE_*</code> di file <code className="text-[#C9A24B]">.env</code> untuk mengaktifkan login Google.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-center mt-6" style={{ color: "var(--admin-text-muted)" }}>
            Hanya email <span className="text-[#C9A24B]">saputraamanah999@gmail.com</span> yang diizinkan
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--admin-text-muted)" }}>
          Dipersembahkan oleh <span className="text-[#C9A24B]">Saputra Developer</span>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B10]" />}>
      <LoginInner />
    </Suspense>
  );
}
