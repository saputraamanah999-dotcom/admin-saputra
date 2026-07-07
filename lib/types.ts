// lib/mock-store.ts
// In-browser mock store untuk demo mode (sandbox preview tanpa Firebase/Supabase asli).
// Data persist di localStorage, realtime updates via custom event emitter.
// ❗ File ini HANYA dipakai jika firebaseConfigured === false.
// Di production dengan Firebase/Supabase asli, pakai lib/firebase/* dan lib/supabase/*.

import { collection, doc, setDoc, deleteDoc, getDoc, getDocs, onSnapshot, query, orderBy, where, type Unsubscribe } from "firebase/firestore";
import { db, firebaseConfigured } from "./firebase/client";

// Type definitions for mock data
export interface GalleryPhoto {
  id: string;
  url: string;
  title: string;
  orientation: "left" | "right";
  order: number;
  storagePath?: string;
  createdAt: string;
}

export interface RsvpEntry {
  id: string;
  name: string;
  attendance: "hadir" | "tidak" | "ragu";
  guestCount: number;
  message: string;
  guestSlug?: string;
  createdAt: string;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  guestSlug?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: string;
}

export interface LiveVisitor {
  id: string;
  guestSlug?: string;
  joinedAt: string;
  lastSeen: string;
}

export interface GiftTransaction {
  id: string;
  sender: string;
  amount: number;
  message: string;
  method: string;
  createdAt: string;
}

export interface SiteConfig {
  coupleNames: string;
  weddingDate: string | null;
  akadTime: string;
  receptionTime: string;
  venue: string;
  mapsEmbed: string;
  mapsLink: string;
  quotes: string;
  musicUrl: string;
  preweddingCoverUrl: string;
  gapuraUrl: string;
  themeColor: string;
  shareMessageTemplate: string;
  primaryBtnText: string;
  secondaryBtnText: string;
}

export interface GuestRow {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  invited_count: number;
  created_at: string;
}

export interface GiftConfig {
  qrisImageUrl: string;
  banks: Array<{ id: string; bank: string; accountNumber: string; accountName: string }>;
}

export interface DevCreditConfig {
  enabled: boolean;
  message: string;
  contactLink: string;
  animate: boolean;
}

export interface AdminSettings {
  allowedEmails: string[];
  devCredit: DevCreditConfig;
}
