// lib/firebase/admin-verify.ts
// Verifikasi Firebase ID Token di server.
// Dipakai di setiap route API sebagai gerbang keamanan.
//
// WAJIB: Firebase Admin SDK harus dikonfigurasi (FIREBASE_ADMIN_PROJECT_ID,
// FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY di .env).
// Tanpa itu, semua API route akan return 500 — admin panel tidak bisa dipakai.

import "server-only";
import { firebaseAdminConfigured, adminAuth } from "./admin";

/**
 * Allowlist email admin — sumber kebenaran tunggal.
 * Bisa di-override via env: ADMIN_ALLOWED_EMAILS=email1@x.com,email2@y.com
 * Default: hanya saputraamanah999@gmail.com yang diizinkan.
 */
export function getAllowedEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS ?? "";
  const defaults = ["saputraamanah999@gmail.com"];
  const parsed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : defaults;
}

export interface VerifiedAdmin {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Verifikasi token Bearer dari header Authorization.
 * Throw error kalau:
 * - Header tidak ada / bukan Bearer
 * - Firebase Admin belum dikonfigurasi
 * - Token invalid / kedaluwarsa
 * - Email tidak ada di allowlist
 */
export async function verifyAdminToken(authHeader: string | null): Promise<VerifiedAdmin> {
  if (!firebaseAdminConfigured) {
    throw new Error(
      "Firebase Admin SDK belum dikonfigurasi. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY di file .env. Lihat tutorial di SETUP.md."
    );
  }

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header. Harus format: 'Bearer <Firebase_ID_Token>'");
  }
  const token = authHeader.slice(7);

  // Verifikasi token via Firebase Admin SDK
  const decoded = await adminAuth.verifyIdToken(token);
  const allowed = getAllowedEmails();
  const email = (decoded.email ?? "").toLowerCase();

  if (!allowed.includes(email)) {
    throw new Error(`Email ${email} tidak ada di allowlist admin. Hanya ${allowed.join(", ")} yang diizinkan.`);
  }

  return {
    uid: decoded.uid,
    email,
    emailVerified: decoded.email_verified ?? false,
    name: decoded.name,
    picture: decoded.picture,
  };
}

/**
 * Helper untuk route handler: return Response 401 kalau verifikasi gagal.
 */
export async function requireAdmin(authHeader: string | null): Promise<
  { ok: true; admin: VerifiedAdmin } | { ok: false; response: Response }
> {
  try {
    const admin = await verifyAdminToken(authHeader);
    return { ok: true, admin };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return {
      ok: false,
      response: Response.json({ error: message }, { status: 401 }),
    };
  }
}
