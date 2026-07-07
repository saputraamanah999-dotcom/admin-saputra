// lib/use-realtime.ts
// Hooks realtime yang otomatis pakai Firestore onSnapshot jika terkonfigurasi.
// Sumber data UTAMA: Firestore. Tidak ada WebSocket. Tidak ada Supabase untuk realtime.
// Saat env Firebase belum diset (sandbox preview), fallback ke mock store (localStorage + event emitter).

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
} from "firebase/firestore";
import { db, firebaseConfigured } from "./firebase/client";
import {
  listCollection,
  subscribe,
  getDocOnce,
  subscribeDoc,
  initSeeds,
  getGlobalSettings,
  subscribeSettings,
} from "./mock-store";
import type { GalleryPhoto, RsvpEntry, GuestbookEntry, Announcement, LiveVisitor } from "./types";
import type { GuestRow } from "./types";

// Init seeds once on client
if (typeof window !== "undefined") {
  initSeeds();
}

// Helper: subscribe to a collection (Firestore or mock)
function useCollection<T extends { id: string }>(
  siteId: string,
  collectionName: string,
  sortFn: (a: T, b: T) => number,
  buildQuery?: () => ReturnType<typeof query>
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (firebaseConfigured && db && buildQuery) {
      unsub = onSnapshot(buildQuery(), (snap) => {
        setItems(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, "id">) }))
        );
        setLoading(false);
      });
    } else {
      const refresh = () => {
        setItems(listCollection<T>(siteId, collectionName, sortFn));
        setLoading(false);
      };
      refresh();
      unsub = subscribe(siteId, collectionName, refresh);
    }

    return () => unsub?.();
     
  }, [siteId]);

  return { items, loading };
}

export function useGallery(siteId: string) {
  return useCollection<GalleryPhoto>(
    siteId,
    "gallery",
    (a, b) => a.order - b.order,
    () => (firebaseConfigured && db ? query(collection(db, `sites/${siteId}/gallery`), orderBy("order", "asc")) : null as never)
  );
}

export function useRsvp(siteId: string) {
  return useCollection<RsvpEntry>(
    siteId,
    "rsvp",
    (a, b) => b.createdAt.localeCompare(a.createdAt),
    () => (firebaseConfigured && db ? query(collection(db, `sites/${siteId}/rsvp`), orderBy("createdAt", "desc")) : null as never)
  );
}

export function useGuestbook(siteId: string) {
  return useCollection<GuestbookEntry>(
    siteId,
    "guestbook",
    (a, b) => b.createdAt.localeCompare(a.createdAt),
    () => (firebaseConfigured && db ? query(collection(db, `sites/${siteId}/guestbook`), orderBy("createdAt", "desc")) : null as never)
  );
}

export function useAnnouncements(siteId: string) {
  return useCollection<Announcement>(
    siteId,
    "announcements",
    (a, b) => b.createdAt.localeCompare(a.createdAt),
    () => (firebaseConfigured && db ? query(collection(db, `sites/${siteId}/announcements`), orderBy("createdAt", "desc")) : null as never)
  );
}

export function useLiveVisitors(siteId: string): { count: number; loading: boolean } {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;

    if (firebaseConfigured && db) {
      const q = query(collection(db, `sites/${siteId}/liveVisitors`));
      unsub = onSnapshot(q, (snap) => {
        const now = Date.now();
        const active = snap.docs.filter((d) => {
          const data = d.data() as LiveVisitor;
          return now - new Date(data.lastSeen).getTime() < 60000;
        }).length;
        setCount(active);
        setLoading(false);
      });
    } else {
      const refresh = () => {
        const items = listCollection<LiveVisitor>(siteId, "liveVisitors");
        const now = Date.now();
        const active = items.filter(
          (v) => now - new Date(v.lastSeen).getTime() < 60000
        ).length;
        // Simulate slight live variation for demo feel
        setCount(active + Math.floor(Math.random() * 3));
        setLoading(false);
      };
      refresh();
      unsub = subscribe(siteId, "liveVisitors", refresh);
      interval = setInterval(refresh, 5000);
    }

    return () => {
      unsub?.();
      if (interval) clearInterval(interval);
    };
  }, [siteId]);

  return { count, loading };
}

export function useSiteConfig<T>(siteId: string, defaultValue: T): {
  config: T;
  loading: boolean;
} {
  const [config, setConfig] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (firebaseConfigured && db) {
      unsub = onSnapshot(doc(db, `sites/${siteId}/config/main`), (snap) => {
        if (snap.exists()) {
          setConfig({ ...defaultValue, ...snap.data() } as T);
        }
        setLoading(false);
      });
    } else {
      const refresh = () => {
        setConfig({ ...defaultValue, ...getDocOnce<T>(siteId, "config", defaultValue) });
        setLoading(false);
      };
      refresh();
      unsub = subscribeDoc(siteId, "config", refresh);
    }

    return () => unsub?.();
     
  }, [siteId]);

  return { config, loading };
}

export function useGiftConfig<T>(siteId: string, defaultValue: T): {
  config: T;
  loading: boolean;
} {
  const [config, setConfig] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (firebaseConfigured && db) {
      unsub = onSnapshot(doc(db, `sites/${siteId}/config/gift`), (snap) => {
        if (snap.exists()) {
          setConfig({ ...defaultValue, ...snap.data() } as T);
        }
        setLoading(false);
      });
    } else {
      const refresh = () => {
        setConfig({ ...defaultValue, ...getDocOnce<T>(siteId, "gift", defaultValue) });
        setLoading(false);
      };
      refresh();
      unsub = subscribeDoc(siteId, "gift", refresh);
    }

    return () => unsub?.();
     
  }, [siteId]);

  return { config, loading };
}

export function useGiftTransactions(siteId: string) {
  return useCollection<{ id: string; sender: string; amount: number; message: string; method: string; createdAt: string }>(
    siteId,
    "giftTransactions",
    (a, b) => b.createdAt.localeCompare(a.createdAt),
    () => (firebaseConfigured && db ? query(collection(db, `sites/${siteId}/giftTransactions`), orderBy("createdAt", "desc")) : null as never)
  );
}

/**
 * Hook realtime untuk daftar tamu.
 * Path Firestore: sites/{siteId}/guests (orderBy createdAt desc).
 * Sebelumnya pakai Supabase — sekarang dipindah ke Firestore supaya bisa onSnapshot realtime.
 */
export function useGuests(siteId: string) {
  return useCollection<GuestRow>(
    siteId,
    "guests",
    (a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    () => (firebaseConfigured && db ? query(collection(db, `sites/${siteId}/guests`), orderBy("created_at", "desc")) : null as never)
  );
}

/**
 * Hook realtime untuk global settings (allowlist email admin + dev credit config).
 * Path Firestore: global/settings (single document).
 */
export function useGlobalSettings<T>(defaultValue: T): { settings: T; loading: boolean } {
  const [settings, setSettings] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (firebaseConfigured && db) {
      // Subscribe ke global/settings — konsisten dengan /api/settings route
      unsub = onSnapshot(doc(db, "global/settings"), (snap) => {
        if (snap.exists()) {
          setSettings({ ...defaultValue, ...snap.data() } as T);
        }
        setLoading(false);
      });
    } else {
      // Demo fallback: localStorage + event emitter
      const refresh = () => {
        setSettings({ ...defaultValue, ...getGlobalSettings() } as unknown as T);
        setLoading(false);
      };
      refresh();
      unsub = subscribeSettings(refresh);
    }

    return () => unsub?.();
     
  }, []);

  return { settings, loading };
}

/**
 * Hook realtime untuk visit logs (analytics chart).
 * Path Firestore: sites/{siteId}/visitLogs (orderBy visitedAt desc).
 * Dikelompokkan per hari untuk chart 14 hari terakhir.
 */
export function useVisitLogs(siteId: string, rangeDays: number = 14): {
  daily: { date: string; count: number }[];
  total: number;
  loading: boolean;
} {
  const [daily, setDaily] = useState<{ date: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (firebaseConfigured && db) {
      const q = query(
        collection(db, `sites/${siteId}/visitLogs`),
        orderBy("visitedAt", "desc")
      );
      unsub = onSnapshot(q, (snap) => {
        const now = new Date();
        const byDay = new Map<string, number>();
        // Init semua hari dalam range dengan 0
        for (let i = rangeDays - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          byDay.set(d.toISOString().slice(0, 10), 0);
        }
        let count = 0;
        snap.docs.forEach((d) => {
          const data = d.data() as { visitedAt?: string };
          const day = (data.visitedAt ?? "").slice(0, 10);
          if (byDay.has(day)) {
            byDay.set(day, (byDay.get(day) ?? 0) + 1);
            count++;
          }
        });
        setDaily(Array.from(byDay.entries()).map(([date, c]) => ({ date, count: c })));
        setTotal(count);
        setLoading(false);
      });
    } else {
      // Demo fallback: mock visit logs
      const refresh = () => {
        const today = new Date();
        const days: { date: string; count: number }[] = [];
        let total = 0;
        for (let i = rangeDays - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const seed = siteId.charCodeAt(siteId.length - 1) + i;
          const c = Math.floor(20 + (Math.sin(seed) + 1) * 30 + Math.random() * 20);
          days.push({ date: dateStr, count: c });
          total += c;
        }
        setDaily(days);
        setTotal(total);
        setLoading(false);
      };
      refresh();
      unsub = subscribe(siteId, "visitLogs", refresh);
    }

    return () => unsub?.();
  }, [siteId, rangeDays]);

  return { daily, total, loading };
}
