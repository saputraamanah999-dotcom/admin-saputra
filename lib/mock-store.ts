// lib/mock-store.ts
// Mock realtime store pakai localStorage + event emitter.
// Dipakai saat Firebase belum dikonfigurasi (sandbox preview).
// API mirip Firestore onSnapshot supaya mudah diganti.

type Listener = () => void;

const LS_PREFIX = "wedding-cms:";

function lsKey(siteId: string, collection: string): string {
  return `${LS_PREFIX}${siteId}:${collection}`;
}

function read<T>(siteId: string, collection: string, def: T): T {
  if (typeof window === "undefined") return def;
  const raw = localStorage.getItem(lsKey(siteId, collection));
  if (!raw) return def;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return def;
  }
}

function write<T>(siteId: string, collection: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(lsKey(siteId, collection), JSON.stringify(data));
  notify(siteId, collection);
}

// Event emitter per (siteId, collection)
const listeners = new Map<string, Set<Listener>>();

function notify(siteId: string, collection: string) {
  const key = lsKey(siteId, collection);
  const set = listeners.get(key);
  if (set) set.forEach((fn) => fn());
  // Also notify global listeners
  const globalSet = listeners.get(`${siteId}:*`);
  if (globalSet) globalSet.forEach((fn) => fn());
}

export function subscribe(siteId: string, collection: string, cb: Listener): () => void {
  const key = lsKey(siteId, collection);
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => {
    listeners.get(key)?.delete(cb);
  };
}

// ===== Collection ops =====
export function listCollection<T extends { id: string }>(
  siteId: string,
  collection: string,
  sortBy?: (a: T, b: T) => number
): T[] {
  const items = read<T[]>(siteId, collection, []);
  if (sortBy) return [...items].sort(sortBy);
  return items;
}

export function upsertDoc<T extends { id: string }>(
  siteId: string,
  collection: string,
  doc: T
): void {
  const items = read<T[]>(siteId, collection, []);
  const idx = items.findIndex((d) => d.id === doc.id);
  if (idx >= 0) items[idx] = doc;
  else items.push(doc);
  write(siteId, collection, items);
}

export function deleteDocById(siteId: string, collection: string, id: string): void {
  const items = read<{ id: string }[]>(siteId, collection, []);
  const next = items.filter((d) => d.id !== id);
  write(siteId, collection, next);
}

export function updateDocFields<T>(
  siteId: string,
  collection: string,
  id: string,
  patch: Partial<T>
): void {
  const items = read<(T & { id: string })[]>(siteId, collection, []);
  const idx = items.findIndex((d) => d.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...patch };
    write(siteId, collection, items);
  }
}

// ===== Single doc ops (for config) =====
export function getDocOnce<T>(siteId: string, docName: string, def: T): T {
  return read<T>(siteId, `__doc__${docName}`, def);
}

export function setDocData<T>(siteId: string, docName: string, data: T): void {
  write(siteId, `__doc__${docName}`, data);
}

export function subscribeDoc<T>(siteId: string, docName: string, cb: () => void): () => void {
  return subscribe(siteId, `__doc__${docName}`, cb);
}

// ===== Seed default data =====
export function seedIfEmpty(siteId: string): void {
  // Config
  const existingConfig = localStorage.getItem(lsKey(siteId, "__doc__config"));
  if (!existingConfig) {
    setDocData(siteId, "config", {
      coupleNames: siteId === "site-1" ? "Wayan & Putri" : "Made & Kadek",
      weddingDate: "2026-08-15",
      akadTime: "08:00",
      receptionTime: "11:00",
      venue: "Puri Tirta Spiritual, Ubud, Bali",
      mapsEmbed: "https://www.google.com/maps/embed?pb=abc",
      mapsLink: "https://maps.google.com/?q=Ubud",
      quotes: "Om Swastyastu",
      musicUrl: "https://example.com/song.mp3",
      preweddingCoverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200",
      gapuraUrl: "https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?w=800",
      themeColor: "#C9A24B",
      shareMessageTemplate: "Dengan penuh sukacita, kami mengundang {guestName} — {link}",
      primaryBtnText: "Buka Undangan",
      secondaryBtnText: "Lihat Lokasi",
    });
  }

  // Gallery — seed 6 photos
  const existingGallery = localStorage.getItem(lsKey(siteId, "gallery"));
  if (!existingGallery) {
    const photos = [
      { url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800", title: "Prewedding 1", orientation: "left" },
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", title: "Prewedding 2", orientation: "right" },
      { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800", title: "Prewedding 3", orientation: "left" },
      { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800", title: "Prewedding 4", orientation: "right" },
      { url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", title: "Prewedding 5", orientation: "left" },
      { url: "https://images.unsplash.com/photo-1525258946800-98cfd641d0de?w=800", title: "Prewedding 6", orientation: "right" },
    ].map((p, i) => ({
      id: `seed-${i + 1}`,
      ...p,
      order: i,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));
    write(siteId, "gallery", photos);
  }

  // Gift config
  const existingGift = localStorage.getItem(lsKey(siteId, "__doc__gift"));
  if (!existingGift) {
    setDocData(siteId, "gift", {
      qrisImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226570011...",
      banks: [
        { id: "b1", bank: "BCA", accountNumber: "0123456789", accountName: "Wayan Saputra" },
        { id: "b2", bank: "Mandiri", accountNumber: "9876543210", accountName: "Putri Devi" },
      ],
    });
  }

  // Announcements
  const existingAnn = localStorage.getItem(lsKey(siteId, "announcements"));
  if (!existingAnn) {
    write(siteId, "announcements", [
      {
        id: "ann-1",
        title: "Pemberitahuan Resepsionis",
        body: "Mohon maaf, acara resepsi dimajukan 30 menit menjadi 10:30 WITA.",
        active: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }

  // RSVP
  const existingRsvp = localStorage.getItem(lsKey(siteId, "rsvp"));
  if (!existingRsvp) {
    write(siteId, "rsvp", [
      { id: "rsvp-1", name: "Budi Santoso", attendance: "hadir", guestCount: 2, message: "Selamat menempuh hidup baru!", guestSlug: "budi", createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: "rsvp-2", name: "Made Surya", attendance: "ragu", guestCount: 1, message: "Insya Allah hadir kalau tidak ada halangan.", createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "rsvp-3", name: "Anonymous", attendance: "tidak", guestCount: 0, message: "Maaf tidak bisa hadir, doa terbaik untuk kalian.", createdAt: new Date(Date.now() - 1800000).toISOString() },
    ]);
  }

  // Guestbook
  const existingGb = localStorage.getItem(lsKey(siteId, "guestbook"));
  if (!existingGb) {
    write(siteId, "guestbook", [
      { id: "gb-1", name: "Kadek Ari", message: "Barakallah lakuma, semoga sakinah mawaddah warahmah.", guestSlug: "kadek", createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: "gb-2", name: "Rina", message: "Bahagia selalu ya!", createdAt: new Date(Date.now() - 3600000).toISOString() },
    ]);
  }

  // Live visitors
  const existingLv = localStorage.getItem(lsKey(siteId, "liveVisitors"));
  if (!existingLv) {
    write(siteId, "liveVisitors", [
      { id: "lv-1", guestSlug: "budi", joinedAt: new Date(Date.now() - 60000).toISOString(), lastSeen: new Date().toISOString() },
      { id: "lv-2", joinedAt: new Date(Date.now() - 30000).toISOString(), lastSeen: new Date().toISOString() },
    ]);
  }

  // Gift transactions
  const existingGt = localStorage.getItem(lsKey(siteId, "giftTransactions"));
  if (!existingGt) {
    write(siteId, "giftTransactions", [
      { id: "gt-1", sender: "Budi Santoso", amount: 500000, message: "Selamat menikah!", method: "QRIS", createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "gt-2", sender: "Made Surya", amount: 1000000, message: "Semoga bahagia selalu.", method: "Transfer BCA", createdAt: new Date(Date.now() - 43200000).toISOString() },
    ]);
  }
}

// ===== Global settings =====
const SETTINGS_KEY = `${LS_PREFIX}__global__:settings`;

export function getGlobalSettings(): {
  allowedEmails: string[];
  devCredit: { enabled: boolean; message: string; contactLink: string; animate: boolean };
} {
  if (typeof window === "undefined") {
    return {
      allowedEmails: ["saputraamanah999@gmail.com"],
      devCredit: { enabled: true, message: "Dipersembahkan oleh Saputra Developer", contactLink: "https://wa.me/6281234567890", animate: true },
    };
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    const def = {
      allowedEmails: ["saputraamanah999@gmail.com"],
      devCredit: { enabled: true, message: "Dipersembahkan oleh Saputra Developer", contactLink: "https://wa.me/6281234567890", animate: true },
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(def));
    return def;
  }
  return JSON.parse(raw);
}

export function setGlobalSettings(data: ReturnType<typeof getGlobalSettings>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  const set = listeners.get(`${LS_PREFIX}__global__:settings`) ?? new Set();
  set.forEach((fn) => fn());
}

export function subscribeSettings(cb: Listener): () => void {
  const key = SETTINGS_KEY;
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => listeners.get(key)?.delete(cb);
}

// ===== Visit logs (for analytics chart) =====
export function getVisitLogs(siteId: string): Array<{ date: string; count: number }> {
  const today = new Date();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const seed = siteId.charCodeAt(siteId.length - 1) + i;
    const count = Math.floor(20 + (Math.sin(seed) + 1) * 30 + Math.random() * 20);
    days.push({ date: dateStr, count });
  }
  return days;
}

// Initialize seed for all sites
export function initSeeds() {
  if (typeof window === "undefined") return;
  seedIfEmpty("site-1");
  seedIfEmpty("site-2");
}
