// app/api/gallery/reorder/route.ts
// PUT /api/gallery/reorder?siteId=site-1
// Body: { orderedIds: string[] }
// Bulk update field `order` untuk semua foto sekaligus (batch write).

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function PUT(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const { orderedIds } = await req.json();
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds harus array" }, { status: 400 });
  }

  if (firebaseAdminConfigured && adminDb) {
    const batch = adminDb.batch();
    orderedIds.forEach((id: string, idx: number) => {
      batch.update(adminDb.doc(`sites/${siteId}/gallery/${id}`), { order: idx });
    });
    await batch.commit();
  }

  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured, count: orderedIds.length });
}
