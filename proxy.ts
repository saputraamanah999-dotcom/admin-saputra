// proxy.ts (Next.js 16 — pengganti middleware.ts yang sudah deprecated)
// Lindungi semua route admin dari pengunjung tanpa sesi.
//
// Strategi:
// - Route publik (lihat PUBLIC_PATHS) → allow tanpa auth
// - Route admin & API admin → butuh cookie 'admin-session'
// - Verifikasi token sungguhan dilakukan di setiap API route via verifyAdminToken
//
// Next.js 16 edge runtime tidak bisa pakai Firebase Admin SDK,
// jadi verifikasi kedaluwarsa token dilakukan server-side di route handler.

import { NextResponse, type NextRequest } from "next/server";

// Route-route yang TIDAK butuh auth:
const PUBLIC_PATHS = [
  "/login",
  "/api/public/",
  "/api/rsvp/submit",
  "/api/guestbook/submit",
  "/api/fcm-token",
  "/api/visit-log",
  "/api/live-visitor",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

// Next.js 16: export function "proxy" (sebelumnya "middleware" di Next.js 15)
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Allow static / Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Cek session cookie
  const session = req.cookies.get("admin-session")?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
