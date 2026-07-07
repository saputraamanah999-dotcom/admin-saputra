// app/api/rsvp/[id]/route.ts
// DELETE /api/rsvp/{id}?siteId=site-1 → hapus RSVP entry (admin only, tamu hanya create)

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/rsvp/${id}`).delete();
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}
