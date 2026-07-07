// app/api/analytics/route.ts
// GET /api/analytics?siteId=site-1&range=14
// Ambil statistik: visit logs + live visitors + RSVP breakdown.
// Semua data dari Firestore (TIDAK pakai Supabase untuk data realtime).
// Path Firestore:
//   - sites/{siteId}/visitLogs
//   - sites/{siteId}/liveVisitors
//   - sites/{siteId}/rsvp

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/admin-verify";
import { firebaseAdminConfigured, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  const range = parseInt(req.nextUrl.searchParams.get("range") ?? "14");
  if (!siteId) return NextResponse.json({ error: "siteId wajib" }, { status: 400 });

  const auth = await requireAdmin(req.headers.get("authorization"));
  if (!auth.ok) return auth.response;

  const response: {
    daily: { date: string; count: number }[];
    totalVisits: number;
    liveCount: number;
    rsvpBreakdown: { hadir: number; ragu: number; tidak: number };
    demo?: boolean;
  } = {
    daily: [],
    totalVisits: 0,
    liveCount: 0,
    rsvpBreakdown: { hadir: 0, ragu: 0, tidak: 0 },
  };

  if (!firebaseAdminConfigured || !adminDb) {
    response.demo = true;
    return NextResponse.json(response);
  }

  // 1. Visit logs dari Firestore (bukan Supabase)
  const since = new Date();
  since.setDate(since.getDate() - range);
  const sinceIso = since.toISOString();

  const visitSnap = await adminDb
    .collection(`sites/${siteId}/visitLogs`)
    .where("visitedAt", ">=", sinceIso)
    .get();

  const byDay = new Map<string, number>();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  visitSnap.docs.forEach((d) => {
    const data = d.data() as { visitedAt?: string };
    const day = (data.visitedAt ?? "").slice(0, 10);
    if (byDay.has(day)) {
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
  });

  response.daily = Array.from(byDay.entries()).map(([date, count]) => ({ date, count }));
  response.totalVisits = visitSnap.size;

  // 2. Live visitors dari Firestore
  const now = Date.now();
  const liveSnap = await adminDb.collection(`sites/${siteId}/liveVisitors`).get();
  response.liveCount = liveSnap.docs.filter((d) => {
    const data = d.data() as { lastSeen: string };
    return now - new Date(data.lastSeen).getTime() < 60000;
  }).length;

  // 3. RSVP breakdown dari Firestore
  const rsvpSnap = await adminDb.collection(`sites/${siteId}/rsvp`).get();
  let hadir = 0, ragu = 0, tidak = 0;
  rsvpSnap.docs.forEach((d) => {
    const a = (d.data() as { attendance: string }).attendance;
    if (a === "hadir") hadir++;
    else if (a === "ragu") ragu++;
    else if (a === "tidak") tidak++;
  });
  response.rsvpBreakdown = { hadir, ragu, tidak };

  return NextResponse.json(response);
}
