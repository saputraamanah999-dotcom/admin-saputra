// app/api/notify/route.ts
// POST /api/notify?siteId=site-1
// Body: { title, body }
// Kirim FCM push notification ke semua token di sites/{siteId}/fcmTokens.
// Hanya admin yang boleh memanggil.
//
// Untuk broadcast ke kedua site, client (data-service) memanggil endpoint ini 2x:
// POST /api/notify?siteId=site-1 dan POST /api/notify?siteId=site-2.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb, adminMessaging } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });
  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const { title, body } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title dan body wajib" }, { status: 400 });
  }

  if (!firebaseAdminConfigured || !adminDb || !adminMessaging) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      demo: true,
      note: "Demo mode: FCM tidak aktif. Banner pengumuman tetap muncul realtime di website tamu via Firestore listener.",
    });
  }

  // Ambil semua FCM tokens untuk site ini
  const tokensSnap = await adminDb.collection(`sites/${siteId}/fcmTokens`).get();
  const tokens = tokensSnap.docs.map((d) => d.id);

  if (tokens.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: `Belum ada tamu yang subscribe notifikasi di ${siteId}.`,
    });
  }

  // Update lastSeen untuk semua token (housekeeping)
  const batch = adminDb.batch();
  tokensSnap.docs.forEach((doc) => {
    batch.update(doc.ref, { lastSeen: new Date().toISOString() });
  });
  await batch.commit();

  // Kirim multicast
  const res = await adminMessaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      notification: {
        title,
        body,
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        tag: `ann-${siteId}-${Date.now()}`,
        requireInteraction: false,
        data: { siteId, url: "/" },
      },
    },
  });

  // Hapus token yang invalid (token dari device yang sudah uninstall/unsubscribe)
  const invalidTokens = res.responses
    .map((r, i) => ({ ok: r.success, token: tokens[i], error: r.error }))
    .filter((t) => !t.ok && (t.error?.code === "messaging/invalid-registration-token" || t.error?.code === "messaging/registration-token-not-registered"));

  if (invalidTokens.length > 0) {
    const delBatch = adminDb.batch();
    invalidTokens.forEach((t) => {
      delBatch.delete(adminDb.doc(`sites/${siteId}/fcmTokens/${t.token}`));
    });
    await delBatch.commit();
  }

  return NextResponse.json({
    sent: res.successCount,
    failed: res.failureCount,
    cleanedInvalidTokens: invalidTokens.length,
  });
}
