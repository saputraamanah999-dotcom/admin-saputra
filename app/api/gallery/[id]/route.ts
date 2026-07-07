// app/api/gallery/[id]/route.ts
// DELETE /api/gallery/{id}?siteId=site-1&storagePath=...

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";
import { supabaseAdmin, supabaseAdminConfigured } from "@/lib/supabase/admin";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siteId = req.nextUrl.searchParams.get("siteId");
  const storagePath = req.nextUrl.searchParams.get("storagePath");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });

  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/gallery/${id}`).delete();
  }

  if (storagePath && supabaseAdminConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.storage.from("gallery").remove([storagePath]);
    if (error) {
      console.warn("Gagal hapus file storage:", error.message);
    }
  }

  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}
