// app/api/rsvp/submit/route.ts
// POST /api/rsvp/submit
// Body: { siteId, name, attendance, guestCount, message?, guestSlug? }
// Endpoint PUBLIK — dipanggil website tamu saat tamu submit form RSVP.
// Tidak butuh auth (tamu anonymous), tapi ada rate-limit implicit via Firestore rules.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

const schema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1, "Nama wajib").max(100),
  attendance: z.enum(["hadir", "tidak", "ragu"]),
  guestCount: z.number().int().min(0).max(100),
  message: z.string().max(1000).optional().default(""),
  guestSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  const { siteId, ...data } = parsed.data;
  const id = `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({
      ok: true,
      demo: true,
      id,
      note: "Demo mode: RSVP tidak persist ke Firestore.",
    });
  }

  await adminDb.doc(`sites/${siteId}/rsvp/${id}`).set({
    ...data,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id });
}
