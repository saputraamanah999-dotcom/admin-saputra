// app/api/public/config/route.ts
// GET /api/public/config?siteId=site-1
// Endpoint PUBLIK — dipanggil website tamu untuk ambil config utama
// (nama pasangan, tanggal, venue, maps, music, dll).
// Tidak butuh auth karena Firestore rules mengizinkan read publik untuk sites/{siteId}/config.

import { NextRequest, NextResponse } from "next/server";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({
      data: null,
      demo: true,
      note: "Demo mode. Set FIREBASE_ADMIN_* untuk produksi.",
    });
  }

  const snap = await adminDb.doc(`sites/${siteId}/config/main`).get();
  return NextResponse.json({ data: snap.exists() ? snap.data() : null });
}
