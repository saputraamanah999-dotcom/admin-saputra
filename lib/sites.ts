// lib/sites.ts
// Daftar site_id yang dikelola admin panel ini.
// Edit sesuai nama pasangan untuk masing-masing site.
//
// Untuk menambah site ke-3, ke-4, dst:
// 1. Tambahkan entri baru di array SITES di bawah
// 2. Tambahkan env NEXT_PUBLIC_WEDDING_SITE_BASE_URL_SITE_3
// 3. Panggil /api/provision untuk auto-buat config default

export interface SiteInfo {
  id: string;
  label: string;
  coupleNames: string;
  accent: string;
}

export const SITES: SiteInfo[] = [
  {
    id: "site-1",
    label: "Website 1 — Wayan & Putri",
    coupleNames: "Wayan & Putri",
    accent: "#C9A24B",
  },
  {
    id: "site-2",
    label: "Website 2 — Made & Kadek",
    coupleNames: "Made & Kadek",
    accent: "#6B2C55",
  },
];

export function getSite(id: string): SiteInfo {
  return SITES.find((s) => s.id === id) ?? SITES[0];
}

/**
 * Build URL tamu untuk slug tertentu.
 * Base URL diambil dari env NEXT_PUBLIC_WEDDING_SITE_BASE_URL_<UPPER>
 * (mis. NEXT_PUBLIC_WEDDING_SITE_BASE_URL_SITE_1).
 */
export function getSiteBaseUrl(siteId: string): string {
  const envKey = `WEDDING_SITE_BASE_URL_${siteId.toUpperCase().replace(/-/g, "_")}`;
  return process.env[`NEXT_PUBLIC_${envKey}`] ?? process.env[envKey] ?? "https://undangan.example.com";
}

export function buildGuestUrl(siteId: string, slug: string): string {
  const base = getSiteBaseUrl(siteId);
  return `${base}/?to=${encodeURIComponent(slug)}`;
}
