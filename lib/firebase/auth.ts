// lib/firebase/auth.ts
// Helper client-side untuk login Google.
// HANYA login Google yang didukung — tidak ada demo login.

import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { auth, firebaseConfigured } from "./client";

// Re-export supaya konsumen tinggal import dari sini
export { firebaseConfigured };

const ALLOWED_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Default allowlist jika env belum diset — hanya 1 email yang diizinkan
const DEFAULT_ALLOWED = ["saputraamanah999@gmail.com"];

function isAllowed(email: string): boolean {
  const list = ALLOWED_EMAILS.length > 0 ? ALLOWED_EMAILS : DEFAULT_ALLOWED;
  return list.includes(email.toLowerCase());
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Login dengan Google popup.
 * Setelah dapat user, cek allowlist di client (defense in depth — server juga cek lagi).
 * Jika tidak diizinkan, signOut + throw.
 */
export async function loginWithGoogle(): Promise<AdminUser> {
  if (!firebaseConfigured || !auth) {
    throw new Error("Firebase belum dikonfigurasi. Set NEXT_PUBLIC_FIREBASE_* di file .env terlebih dahulu.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const email = user.email ?? "";

  if (!isAllowed(email)) {
    await auth.signOut();
    throw new Error(`Email ${email} tidak diizinkan mengakses admin panel. Hanya ${DEFAULT_ALLOWED.join(", ")} yang diizinkan.`);
  }

  return {
    uid: user.uid,
    email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

/**
 * Ambil Firebase ID Token untuk dikirim ke API sebagai Bearer.
 * Return null kalau user belum login.
 */
export async function getIdToken(): Promise<string | null> {
  if (!firebaseConfigured || !auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

/**
 * Subscribe ke perubahan auth state Firebase.
 * Otomatis signOut kalau email di luar allowlist.
 */
export function onAdminAuthChanged(cb: (user: AdminUser | null) => void): () => void {
  if (!firebaseConfigured || !auth) {
    // Tidak ada Firebase → tidak ada user. Redirect ke login lewat middleware.
    cb(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user: User | null) => {
    if (!user) {
      cb(null);
      return;
    }
    const email = user.email ?? "";
    if (!isAllowed(email)) {
      // Email tidak diizinkan — signOut
      auth!.signOut();
      cb(null);
      return;
    }
    cb({
      uid: user.uid,
      email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  });
}

export async function signOut(): Promise<void> {
  if (firebaseConfigured && auth) {
    await fbSignOut(auth);
  }
}
