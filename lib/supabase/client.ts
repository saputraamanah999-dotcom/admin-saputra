// lib/supabase/client.ts
// Supabase client (anon key) — aman untuk browser.
// Hanya untuk baca data publik (mis. daftar tamu yang visible, dll).
// ❌ JANGAN pakai service_role key di sini.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url) && Boolean(anonKey);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  : null;
