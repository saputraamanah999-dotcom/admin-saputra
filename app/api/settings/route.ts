// app/api/settings/route.ts
// GET /api/settings → ambil global settings (allowlist, dev credit)
// PUT /api/settings → simpan global settings
//
// Disimpan di Firestore: global/settings (1 dokumen untuk semua site).
// Catatan: allowlist email di sini adalah OVERRIDE Tambahan —
// sumber utama tetap env vars ADMIN_ALLOWED_EMAILS yang dicek di verifyAdminToken.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";
import { devCreditSchema } from "@/lib/schemas";
import { z } from "zod";

const settingsSchema = z.object({
  allowedEmails: z.array(z.string().email()).min(1, "Minimal 1 email admin"),
  devCredit: devCreditSchema,
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  if (firebaseAdminConfigured && adminDb) {
    const snap = await adminDb.doc("global/settings").get();
    return NextResponse.json({ data: snap.exists() ? snap.data() : null });
  }

  // Default fallback
  return NextResponse.json({
    data: {
      allowedEmails: ["saputraamanah999@gmail.com"],
      devCredit: {
        enabled: true,
        message: "Dipersembahkan oleh Saputra Developer",
        contactLink: "https://wa.me/6281234567890",
        animate: true,
      },
    },
    demo: true,
    note: "Demo mode: settings dari localStorage browser. Set FIREBASE_ADMIN_* untuk produksi.",
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten() }, { status: 400 });
  }

  if (firebaseAdminConfigured && adminDb) {
    await adminDb.doc("global/settings").set(parsed.data, { merge: true });
  }

  return NextResponse.json({
    ok: true,
    demo: !firebaseAdminConfigured,
    note: "Catatan: untuk menambah email admin baru yang benar-benar bisa login, update juga env vars ADMIN_ALLOWED_EMAILS di Vercel + deploy ulang firestore.rules.",
  });
}
