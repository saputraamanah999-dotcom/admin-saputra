// app/api/public/gallery/route.ts
// GET /api/public/gallery?siteId=site-1
// Endpoint PUBLIK — website tamu ambil daftar foto galeri (urut by order).

import { NextRequest, NextResponse } from "next/server";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ data: [], demo: true });
  }

  const snap = await adminDb.collection(`sites/${siteId}/gallery`).orderBy("order", "asc").get();
  return NextResponse.json({
    data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
}
