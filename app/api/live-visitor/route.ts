// app/api/live-visitor/route.ts
// POST /api/live-visitor
// Body: { siteId, action: "join" | "heartbeat" | "leave", sessionId, guestSlug? }
// Endpoint PUBLIK — dipanggil website tamu untuk track siapa yang sedang online.
// Doc ID = sessionId supaya 1 sesi = 1 doc (di-update, bukan di-create baru).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

const schema = z.object({
  siteId: z.string().min(1),
  action: z.enum(["join", "heartbeat", "leave"]),
  sessionId: z.string().min(1),
  guestSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  const { siteId, action, sessionId, guestSlug } = parsed.data;

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const docRef = adminDb.doc(`sites/${siteId}/liveVisitors/${sessionId}`);
  const now = new Date().toISOString();

  if (action === "leave") {
    await docRef.delete();
    return NextResponse.json({ ok: true, action: "left" });
  }

  // join atau heartbeat — upsert doc
  await docRef.set({
    sessionId,
    guestSlug: guestSlug ?? null,
    joinedAt: action === "join" ? now : (await docRef.get()).data()?.joinedAt ?? now,
    lastSeen: now,
  }, { merge: true });

  return NextResponse.json({ ok: true, action });
}
