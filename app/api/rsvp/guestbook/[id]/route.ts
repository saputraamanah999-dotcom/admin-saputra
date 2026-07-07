// app/api/rsvp/guestbook/[id]/route.ts
// DELETE /api/rsvp/guestbook/{id}?siteId=site-1 → hapus ucapan guestbook (admin only)

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
    await adminDb.doc(`sites/${siteId}/guestbook/${id}`).delete();
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}
