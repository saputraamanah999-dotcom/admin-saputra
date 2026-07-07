// lib/supabase/admin.ts
// Supabase admin client (service_role key) — SERVER ONLY.
// ❌ JANGAN PERNAH impor file ini dari file dengan 'use client'.
// ❌ JANGAN beri prefix NEXT_PUBLIC_ pada SUPABASE_SERVICE_ROLE_KEY.
// ✅ Hanya diimpor dari: app/api/**/route.ts, server actions.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdminConfigured = Boolean(url) && Boolean(serviceRoleKey);

export const supabaseAdmin: SupabaseClient | null = supabaseAdminConfigured
  ? createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
