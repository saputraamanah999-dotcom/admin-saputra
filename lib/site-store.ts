// lib/site-store.ts
// Zustand store untuk siteId yang sedang aktif.
// Disimpan ke localStorage supaya konsisten antar tab/halaman.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SITES } from "./sites";

interface SiteState {
  siteId: string;
  setSiteId: (id: string) => void;
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set) => ({
      siteId: SITES[0].id,
      setSiteId: (id) => set({ siteId: id }),
    }),
    {
      name: "admin-active-site",
      version: 1,
    }
  )
);
