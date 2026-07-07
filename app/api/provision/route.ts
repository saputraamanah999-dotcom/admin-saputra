// app/api/provision/route.ts
// POST /api/provision
// Body: { siteId, coupleNames }
// Buat dokumen config default di Firestore untuk site baru.
//
// Catatan: Sebelumnya juga upsert ke Supabase sites_registry — dihapus
// karena aturan: Supabase hanya untuk auth/storage, BUKAN data aplikasi.
// Site registry sekarang tidak dipakai ( SiteSwitcher pakai hardcoded SITES
// array di src/lib/sites.ts).

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const { siteId, coupleNames } = await req.json();
  if (!siteId || !coupleNames) {
    return NextResponse.json({ error: "siteId dan coupleNames wajib" }, { status: 400 });
  }

  let firestoreOk = false;

  // Firestore: dokumen config default (semua field yang dipakai website tamu)
  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/config/main`).set({
      coupleNames,
      weddingDate: null,
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
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // Config gift default
    await adminDb.doc(`sites/${siteId}/config/gift`).set({
      qrisImageUrl: "",
      banks: [],
      createdAt: new Date().toISOString(),
    }, { merge: true });

    // Announcement welcome
    await adminDb.doc(`sites/${siteId}/announcements/welcome`).set({
      title: `Selamat Datang di ${coupleNames}`,
      body: "Website undangan sedang dipersiapkan. Pantau terus untuk pengumuman terbaru!",
      active: false,
      createdAt: new Date().toISOString(),
    });

    firestoreOk = true;
  }

  return NextResponse.json({
    ok: true,
    firestore: firestoreOk,
    demo: !firebaseAdminConfigured,
    message: `Site '${siteId}' (${coupleNames}) berhasil di-provision. Firestore: ${firestoreOk ? "OK" : "skip (Admin belum dikonfigurasi)"}.`,
  });
}
