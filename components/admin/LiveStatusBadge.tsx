// components/admin/LiveStatusBadge.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { useLiveVisitors } from "@/lib/use-realtime";
import { getSite } from "@/lib/sites";
import { Radio } from "lucide-react";

export function LiveStatusBadge() {
  const siteId = useSiteStore((s) => s.siteId);
  const { count, loading } = useLiveVisitors(siteId);
  const site = getSite(siteId);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full"
         style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
      <div className="relative">
        <span className="absolute inline-flex h-2 w-2 rounded-full bg-[#4ADE80] opacity-75 live-pulse" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
      </div>
      <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
        {loading ? "Memuat..." : (
          <>
            <span className="text-[#4ADE80] font-semibold">{count}</span> tamu online di <span style={{ color: "var(--admin-text)" }}>{site.coupleNames}</span>
          </>
        )}
      </span>
      <Radio className="w-3 h-3 text-[#4ADE80]" />
    </div>
  );
}
