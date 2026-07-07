// app/api/visit-log/route.ts
// POST /api/visit-log
// Body: { siteId, guestSlug?, userAgent?, referrer? }
// Endpoint PUBLIK — dipanggil website tamu setiap kali halaman dibuka.
//
// Data disimpan di Firestore: sites/{siteId}/visitLogs/{auto-id}
// (sebelumnya pakai Supabase, dipindah ke Firestore supaya admin panel bisa
// subscribe realtime via onSnapshot untuk chart analytics).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

const schema = z.object({
  siteId: z.string().min(1),
  guestSlug: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  const { siteId, guestSlug, userAgent, referrer } = parsed.data;

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ ok: true, demo: true, note: "Demo mode: visit tidak di-log." });
  }

  // Tulis ke Firestore — auto-generate doc ID
  await adminDb.collection(`sites/${siteId}/visitLogs`).add({
    siteId,
    guestSlug: guestSlug ?? null,
    userAgent: userAgent ?? null,
    referrer: referrer ?? null,
    visitedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
