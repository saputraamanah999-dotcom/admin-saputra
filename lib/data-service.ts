// lib/data-service.ts
// High-level service untuk operasi CRUD admin.
// - Jika Firebase terkonfigurasi: panggil API route (yang pakai Firebase Admin SDK).
// - Jika tidak (demo mode): tulis/baca langsung dari mock-store (localStorage).
//
// Client components cukup pakai service ini — tidak perlu tahu mode yang aktif.

import { apiPost, apiPut, apiDelete } from "./api-client";
import { firebaseConfigured } from "./firebase/client";
import {
  upsertDoc,
  deleteDocById,
  updateDocFields,
  setDocData,
  listCollection,
  type GalleryPhoto,
  type RsvpEntry,
  type GuestbookEntry,
  type Announcement,
  type GuestRow,
} from "./mock-store";
import { SITES } from "./sites";
import type { ContentForm, GiftForm } from "./schemas";

// ===== Content Config =====
export async function saveContent(siteId: string, data: ContentForm): Promise<void> {
  if (firebaseConfigured) {
    await apiPut(`/api/content?siteId=${siteId}`, data);
  } else {
    setDocData(siteId, "config", data);
  }
}

// ===== Gallery =====
export async function addPhoto(siteId: string, photo: Omit<GalleryPhoto, "id" | "createdAt">): Promise<void> {
  const full: GalleryPhoto = {
    ...photo,
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  if (firebaseConfigured) {
    await apiPost(`/api/gallery?siteId=${siteId}`, full);
  } else {
    upsertDoc(siteId, "gallery", full);
  }
}

export async function updatePhoto(siteId: string, id: string, patch: Partial<GalleryPhoto>): Promise<void> {
  if (firebaseConfigured) {
    await apiPut(`/api/gallery?siteId=${siteId}`, { id, patch });
  } else {
    updateDocFields<GalleryPhoto>(siteId, "gallery", id, patch);
  }
}

export async function deletePhoto(siteId: string, id: string, storagePath?: string): Promise<void> {
  if (firebaseConfigured) {
    await apiDelete(`/api/gallery/${id}?siteId=${siteId}${storagePath ? `&storagePath=${encodeURIComponent(storagePath)}` : ""}`);
  } else {
    deleteDocById(siteId, "gallery", id);
  }
}

export async function reorderPhotos(siteId: string, orderedIds: string[]): Promise<void> {
  if (firebaseConfigured) {
    await apiPut(`/api/gallery/reorder?siteId=${siteId}`, { orderedIds });
  } else {
    const photos = listCollection<GalleryPhoto>(siteId, "gallery");
    orderedIds.forEach((id, idx) => {
      const p = photos.find((p) => p.id === id);
      if (p) updateDocFields<GalleryPhoto>(siteId, "gallery", id, { order: idx });
    });
  }
}

// Alias untuk konsistensi API
export const updatePhotoOrder = reorderPhotos;

// ===== RSVP / Guestbook (admin delete only) =====
export async function deleteRsvpEntry(siteId: string, id: string): Promise<void> {
  if (firebaseConfigured) {
    await apiDelete(`/api/rsvp/${id}?siteId=${siteId}`);
  } else {
    deleteDocById(siteId, "rsvp", id);
  }
}

export async function deleteGuestbookEntry(siteId: string, id: string): Promise<void> {
  if (firebaseConfigured) {
    await apiDelete(`/api/rsvp/guestbook/${id}?siteId=${siteId}`);
  } else {
    deleteDocById(siteId, "guestbook", id);
  }
}

// ===== Announcements =====
// Fitur BROADCAST: bisa kirim pengumuman ke 1 site atau BOTH sites sekaligus.
export type AnnouncementTarget = "site-1" | "site-2" | "both";

export async function createAnnouncement(
  currentSiteId: string,
  data: { title: string; body: string; active: boolean },
  target: AnnouncementTarget = "site-1"
): Promise<{ sentTo: string[]; fcmSent: number; fcmFailed: number }> {
  // Tentukan site mana yang akan menerima pengumuman
  const targetSites: string[] = target === "both" ? SITES.map((s) => s.id) : [target];

  const announcementId = `ann-${Date.now()}`;
  const createdAt = new Date().toISOString();

  // Tulis pengumuman ke setiap site (Firestore collection terpisah per site)
  for (const siteId of targetSites) {
    const full: Announcement = {
      id: announcementId,
      ...data,
      active: data.active,
      createdAt,
    };
    if (firebaseConfigured) {
      await apiPost(`/api/announcements?siteId=${siteId}`, full);
    } else {
      upsertDoc(siteId, "announcements", full);
    }
  }

  // Trigger FCM push notification ke semua target sites
  let fcmSent = 0;
  let fcmFailed = 0;
  if (data.active) {
    for (const siteId of targetSites) {
      try {
        const res = await apiPost<{ sent?: number; failed?: number }>(`/api/notify?siteId=${siteId}`, {
          title: data.title,
          body: data.body,
        });
        fcmSent += res.sent ?? 0;
        fcmFailed += res.failed ?? 0;
      } catch {
        // Push notification gagal untuk site ini — banner tetap muncul realtime via Firestore
      }
    }
  }

  return { sentTo: targetSites, fcmSent, fcmFailed };
}

export async function toggleAnnouncement(siteId: string, id: string, active: boolean): Promise<void> {
  if (firebaseConfigured) {
    await apiPut(`/api/announcements/${id}?siteId=${siteId}`, { active });
  } else {
    updateDocFields<Announcement>(siteId, "announcements", id, { active });
  }
}

export async function deleteAnnouncement(siteId: string, id: string): Promise<void> {
  if (firebaseConfigured) {
    await apiDelete(`/api/announcements/${id}?siteId=${siteId}`);
  } else {
    deleteDocById(siteId, "announcements", id);
  }
}

// ===== Gift Config =====
export async function saveGiftConfig(siteId: string, data: GiftForm): Promise<void> {
  if (firebaseConfigured) {
    await apiPut(`/api/gift?siteId=${siteId}`, data);
  } else {
    setDocData(siteId, "gift", data);
  }
}

// ===== Guests (Firestore — sites/{siteId}/guests) =====
// Read dilakukan via useGuests hook (onSnapshot realtime) di komponen.
// Service ini hanya untuk operasi WRITE (create/update/delete) yang butuh
// validasi zod + requireAdmin di server.
export async function createGuest(siteId: string, data: Omit<GuestRow, "id" | "created_at" | "site_id">): Promise<GuestRow> {
  if (firebaseConfigured) {
    const res = await apiPost<{ data: GuestRow } | GuestRow>(`/api/guests?siteId=${siteId}`, data);
    return (res as { data: GuestRow }).data ?? (res as GuestRow);
  }
  // Demo fallback
  const full: GuestRow = {
    ...data,
    id: `guest-${Date.now()}`,
    site_id: siteId,
    created_at: new Date().toISOString(),
  };
  upsertDoc(siteId, "guests", full);
  return full;
}

export async function updateGuest(siteId: string, id: string, patch: Partial<GuestRow>): Promise<void> {
  if (firebaseConfigured) {
    await apiPut(`/api/guests/${id}?siteId=${siteId}`, patch);
  } else {
    updateDocFields<GuestRow>(siteId, "guests", id, patch);
  }
}

export async function deleteGuest(siteId: string, id: string): Promise<void> {
  if (firebaseConfigured) {
    await apiDelete(`/api/guests/${id}?siteId=${siteId}`);
  } else {
    deleteDocById(siteId, "guests", id);
  }
}

export function seedGuestsIfEmpty(siteId: string) {
  if (firebaseConfigured) return;
  const existing = listCollection<GuestRow>(siteId, "guests");
  if (existing.length === 0) {
    const seed = [
      { name: "Budi Santoso", slug: "budi", invited_count: 2 },
      { name: "Made Surya", slug: "made", invited_count: 1 },
      { name: "Kadek Ari Wibawa", slug: "kadek", invited_count: 4 },
      { name: "Rina Wijaya", slug: "rina", invited_count: 2 },
      { name: "Keluarga Besar Wangsa", slug: "kel-wangsa", invited_count: 6 },
    ];
    seed.forEach((g) => {
      const full: GuestRow = {
        ...g,
        id: `guest-seed-${g.slug}`,
        site_id: siteId,
        created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      };
      upsertDoc(siteId, "guests", full);
    });
  }
}
