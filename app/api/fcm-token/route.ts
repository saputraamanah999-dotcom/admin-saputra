// app/api/fcm-token/route.ts
// POST /api/fcm-token
// Body: { siteId, token, guestSlug? }
// Endpoint PUBLIK — dipanggil website tamu saat tamu klik "Allow notifications".
// Token disimpan di Firestore sites/{siteId}/fcmTokens/{token} supaya admin bisa
// kirim push notification kemudian via /api/notify.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

const schema = z.object({
  siteId: z.string().min(1),
  token: z.string().min(10),
  guestSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  const { siteId, token, guestSlug } = parsed.data;

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({
      ok: true,
      demo: true,
      note: "Demo mode: FCM token tidak persist (Firebase Admin belum dikonfigurasi).",
    });
  }

  // Simpan token sebagai doc ID (supaya unik & mudah di-dedupe)
  await adminDb.doc(`sites/${siteId}/fcmTokens/${token}`).set({
    token,
    guestSlug: guestSlug ?? null,
    platform: "web",
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
