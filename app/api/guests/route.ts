// app/api/guests/route.ts
// GET /api/guests?siteId=site-1 → list tamu (Firestore, hanya admin)
// POST /api/guests?siteId=site-1 → tambah tamu (Firestore)
//
// Path Firestore: sites/{siteId}/guests/{guestId}
// Field: { name, slug, invited_count, created_at, site_id }
//
// Catatan: Sebelumnya pakai Supabase, dipindah ke Firestore supaya admin panel
// bisa subscribe realtime via onSnapshot. API route tetap dipakai untuk WRITE
// (dengan zod validation + requireAdmin auth).

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { guestSchema } from "@/lib/schemas";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({
      data: [],
      demo: true,
      note: "Demo mode: Firestore Admin belum dikonfigurasi. Client pakai mock store.",
    });
  }

  // Ambil semua tamu untuk site ini, urut created_at desc
  const snap = await adminDb
    .collection(`sites/${siteId}/guests`)
    .orderBy("created_at", "desc")
    .get();

  const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = guestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  // Cek duplikasi slug untuk site ini
  if (firebaseAdminConfigured && adminDb) {
    const existingSnap = await adminDb
      .collection(`sites/${siteId}/guests`)
      .where("slug", "==", parsed.data.slug)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: `Slug "${parsed.data.slug}" sudah dipakai tamu lain di ${siteId}` },
        { status: 400 }
      );
    }
  }

  const guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    ...parsed.data,
    site_id: siteId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/guests/${guestId}`).set(payload);
  }

  return NextResponse.json({
    data: { id: guestId, ...payload },
    demo: !firebaseAdminConfigured,
  });
}
