// lib/schemas.ts
// Zod schemas untuk semua form di admin panel.

import { z } from "zod";

export const contentSchema = z.object({
  coupleNames: z.string().min(1, "Nama pasangan wajib diisi"),
  weddingDate: z.string().min(1, "Tanggal pernikahan wajib diisi"),
  akadTime: z.string().min(1, "Jam akad wajib diisi"),
  receptionTime: z.string().min(1, "Jam resepsi wajib diisi"),
  venue: z.string().min(1, "Lokasi wajib diisi"),
  mapsEmbed: z.string().url("Embed Maps harus URL valid").or(z.literal("")),
  mapsLink: z.string().url("Link Maps harus URL valid").or(z.literal("")),
  quotes: z.string().min(1, "Salam/quotes wajib diisi"),
  musicUrl: z.string().url("URL lagu harus valid").or(z.literal("")),
  preweddingCoverUrl: z.string().url("URL cover harus valid").or(z.literal("")),
  gapuraUrl: z.string().url("URL gapura harus valid").or(z.literal("")),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB"),
  shareMessageTemplate: z.string().min(1, "Template pesan share wajib diisi").refine(
    (s) => s.includes("{link}"),
    "Template harus mengandung {link}"
  ),
  primaryBtnText: z.string().min(1, "Teks tombol utama wajib"),
  secondaryBtnText: z.string().min(1, "Teks tombol sekunder wajib"),
});

export const gallerySchema = z.object({
  url: z.string().url("URL foto harus valid"),
  title: z.string().min(1, "Judul wajib"),
  orientation: z.enum(["left", "right"]),
  order: z.number().int().min(0),
});

export const guestSchema = z.object({
  name: z.string().min(1, "Nama tamu wajib"),
  slug: z.string().min(1, "Slug wajib").regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  invited_count: z.number().int().min(1, "Minimal 1 tamu").max(100, "Maksimal 100 tamu"),
});

export const announcementSchema = z.object({
  title: z.string().min(1, "Judul wajib"),
  body: z.string().min(1, "Isi pengumuman wajib"),
  active: z.boolean(),
});

export const giftSchema = z.object({
  qrisImageUrl: z.string().url("URL QRIS harus valid").or(z.literal("")),
  banks: z.array(
    z.object({
      id: z.string(),
      bank: z.string().min(1, "Nama bank wajib"),
      accountNumber: z.string().min(1, "Nomor rekening wajib"),
      accountName: z.string().min(1, "Nama pemilik wajib"),
    })
  ),
});

export const devCreditSchema = z.object({
  enabled: z.boolean(),
  message: z.string().min(1, "Pesan wajib"),
  contactLink: z.string().url("Link kontak harus URL valid"),
  animate: z.boolean(),
});

export type ContentForm = z.infer<typeof contentSchema>;
export type GalleryForm = z.infer<typeof gallerySchema>;
export type GuestForm = z.infer<typeof guestSchema>;
export type AnnouncementForm = z.infer<typeof announcementSchema>;
export type GiftForm = z.infer<typeof giftSchema>;
export type DevCreditForm = z.infer<typeof devCreditSchema>;
