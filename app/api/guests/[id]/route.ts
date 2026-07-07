// app/api/guests/[id]/route.ts
// PUT /api/guests/{id}?siteId=site-1 → update tamu (Firestore)
// DELETE /api/guests/{id}?siteId=site-1 → hapus tamu (Firestore)

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/guests/${id}`).set(
      { ...body, updated_at: new Date().toISOString() },
      { merge: true }
    );
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/guests/${id}`).delete();
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}
