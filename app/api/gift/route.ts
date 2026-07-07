// app/api/gift/route.ts
// PUT /api/gift?siteId=site-1 → simpan config gift (QRIS + banks)

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { giftSchema } from "@/lib/schemas";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function PUT(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = giftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc(`sites/${siteId}/config/gift`).set(parsed.data, { merge: true });
  }
  return NextResponse.json({ ok: true, demo: !firebaseAdminConfigured });
}
