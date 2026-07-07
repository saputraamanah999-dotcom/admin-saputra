// app/api/gallery/route.ts
// POST /api/gallery?siteId=site-1 → tambah foto
// PUT /api/gallery?siteId=site-1 → update foto (single field, not reorder)

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();
  if (!body.id || !body.url) {
    return NextResponse.json({ error: "id dan url wajib" }, { status: 400 });
  }

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/gallery/${body.id}`).set({
      url: body.url,
      title: body.title ?? "",
      orientation: body.orientation ?? "left",
      order: body.order ?? 0,
      storagePath: body.storagePath ?? null,
      createdAt: body.createdAt ?? new Date().toISOString(),
    });
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}

export async function PUT(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();

  // Single update (reorder dipisah ke endpoint terpisah)
  const { id, patch } = body;
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });
  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/gallery/${id}`).set(patch, { merge: true });
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}
