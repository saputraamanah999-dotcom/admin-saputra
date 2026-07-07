// app/api/public/announcements/route.ts
// GET /api/public/announcements?siteId=site-1
// Endpoint PUBLIK — website tamu ambil daftar pengumuman aktif (untuk tampilkan banner).

import { NextRequest, NextResponse } from "next/server";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ data: [], demo: true });
  }

  // Hanya ambil pengumuman aktif, urut terbaru
  const snap = await adminDb
    .collection(`sites/${siteId}/announcements`)
    .where("active", "==", true)
    .orderBy("createdAt", "desc")
    .get();

  return NextResponse.json({
    data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
}
