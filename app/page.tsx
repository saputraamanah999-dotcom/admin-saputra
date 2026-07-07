// app/page.tsx
// Root route — redirect ke /dashboard (jika authed) atau /login (jika belum).
// Pakai client-side check supaya bisa baca demo state dari localStorage.

'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAdminAuthChanged } from "@/lib/firebase/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let settled = false;
    const unsub = onAdminAuthChanged((user) => {
      if (settled) return;
      settled = true;
      router.replace(user ? "/dashboard" : "/login");
    });

    // Fallback: setelah 2 detik, paksa ke login kalau belum dapat sinyal
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        router.replace("/login");
      }
    }, 2000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--admin-bg)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-[#C9A24B] border-t-transparent animate-spin" />
        <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Memuat Master Control…</p>
      </div>
    </div>
  );
}
