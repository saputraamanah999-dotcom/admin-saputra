// lib/firebase/admin.ts
// Firebase Admin SDK — SERVER ONLY.
// ❌ JANGAN pernah impor file ini dari file dengan 'use client' di baris pertama.
// ✅ Hanya boleh diimpor dari: app/api/**/route.ts, server actions, middleware.ts.

import "server-only";
import admin from "firebase-admin";
import type { App as AdminApp } from "firebase-admin/app";
import type { Firestore as AdminFirestore } from "firebase-admin/firestore";
import type { Auth as AdminAuth } from "firebase-admin/auth";
import type { Messaging as AdminMessaging } from "firebase-admin/messaging";

/**
 * Cek apakah Firebase Admin SDK sudah dikonfigurasi.
 */
export const firebaseAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

let adminApp: AdminApp | null = null;
let _db: AdminFirestore | null = null;
let _auth: AdminAuth | null = null;
let _msg: AdminMessaging | null = null;

function initAdmin(): AdminApp | null {
  if (!firebaseAdminConfigured) return null;
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n");

  adminApp = admin.initializeApp(
    {
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? undefined,
    },
    "admin-panel-" + Date.now()
  );

  return adminApp;
}

function getAdmin() {
  const app = initAdmin();
  if (!app) return { db: null, auth: null, msg: null };
  if (!_db) _db = admin.firestore(app);
  if (!_auth) _auth = admin.auth(app);
  if (!_msg) _msg = admin.messaging(app);
  return { db: _db, auth: _auth, msg: _msg };
}

// Lazy proxies — throw helpful error if not configured.
export const adminDb = new Proxy({} as AdminFirestore, {
  get(_t, prop) {
    const { db } = getAdmin();
    if (!db) {
      throw new Error(
        "Firebase Admin belum dikonfigurasi. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY di environment."
      );
    }
    // @ts-expect-error — proxy passthrough
    return db[prop];
  },
});

export const adminAuth = new Proxy({} as AdminAuth, {
  get(_t, prop) {
    const { auth } = getAdmin();
    if (!auth) {
      throw new Error(
        "Firebase Admin belum dikonfigurasi. Set FIREBASE_ADMIN_* env vars."
      );
    }
    // @ts-expect-error — proxy passthrough
    return auth[prop];
  },
});

export const adminMessaging = new Proxy({} as AdminMessaging, {
  get(_t, prop) {
    const { msg } = getAdmin();
    if (!msg) {
      throw new Error(
        "Firebase Admin belum dikonfigurasi. Tidak bisa kirim FCM push notification."
      );
    }
    // @ts-expect-error — proxy passthrough
    return msg[prop];
  },
});
