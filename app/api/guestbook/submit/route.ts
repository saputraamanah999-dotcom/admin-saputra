// app/api/guestbook/submit/route.ts
// POST /api/guestbook/submit
// Body: { siteId, name, message, guestSlug? }
// Endpoint PUBLIK — dipanggil website tamu saat tamu kirim ucapan di guestbook.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

const schema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1, "Nama wajib").max(100),
  message: z.string().min(1, "Pesan wajib").max(1000),
  guestSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  const { siteId, ...data } = parsed.data;
  const id = `gb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!firebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ ok: true, demo: true, id });
  }

  await adminDb.doc(`sites/${siteId}/guestbook/${id}`).set({
    ...data,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id });
}
