// app/api/content/route.ts
// GET /api/content?siteId=site-1 → baca config
// PUT /api/content?siteId=site-1 → simpan config (admin only)
//
// Config disimpan di Firestore: sites/{siteId}/config/main
// Website tamu bisa baca via /api/public/config atau langsung subscribe Firestore onSnapshot.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { contentSchema } from "@/lib/schemas";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });

  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  if (firebaseAdminConfigured && adminDb) {
    const snap = await adminDb.doc(`sites/${siteId}/config/main`).get();
    return NextResponse.json({ data: snap.exists() ? snap.data() : null });
  }

  return NextResponse.json({
    data: null,
    demo: true,
    note: "Demo mode: data persist di localStorage browser. Set FIREBASE_ADMIN_* untuk produksi.",
  });
}

export async function PUT(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });

  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  if (firebaseAdminConfigured && adminDb) {
    // merge: true supaya field yang tidak di-set tetap (mis. createdAt)
    await adminDb.doc(`sites/${siteId}/config/main`).set(parsed.data, { merge: true });
    return NextResponse.json({
      ok: true,
      message: "Config tersimpan. Website tamu akan langsung update realtime via Firestore onSnapshot.",
    });
  }

  return NextResponse.json({
    ok: true,
    demo: true,
    note: "Demo mode: client akan persist ke localStorage.",
  });
}
