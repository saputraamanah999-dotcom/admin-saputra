// app/api/announcements/route.ts
// POST /api/announcements?siteId=site-1 → buat pengumuman baru (admin only)
// PUT /api/announcements?siteId=site-1 → update (mis. toggle active)
//
// Body POST: { id, title, body, active, createdAt }
// Pengumuman ditulis ke sites/{siteId}/announcements/{id}.
// Untuk broadcast ke kedua site, client memanggil endpoint ini 2x (site-1, site-2)
// atau memanggil /api/notify dengan multi-site.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { announcementSchema } from "@/lib/schemas";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = announcementSchema.safeParse({
    title: body.title,
    body: body.body,
    active: body.active ?? true,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/announcements/${body.id}`).set({
      ...parsed.data,
      createdAt: body.createdAt ?? new Date().toISOString(),
    });
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured, siteId });
}

export async function PUT(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();
  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/announcements/${body.id}`).set(body.patch ?? body, { merge: true });
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}
