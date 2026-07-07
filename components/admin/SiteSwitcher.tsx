// components/admin/SiteSwitcher.tsx
'use client';

import { useSiteStore } from "@/lib/site-store";
import { SITES } from "@/lib/sites";
import { ChevronDown, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export function SiteSwitcher() {
  const { siteId, setSiteId } = useSiteStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = SITES.find((s) => s.id === siteId) ?? SITES[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
        style={{
          background: open ? "var(--admin-surface-2)" : "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
             style={{ background: `linear-gradient(135deg, ${active.accent} 0%, ${active.accent}80 100%)` }}>
          <Globe className="w-4 h-4 text-[#0B0B10]" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--admin-text-muted)" }}>
            Sedang Mengendalikan
          </div>
          <div className="text-sm font-medium truncate" style={{ color: "var(--admin-text)" }}>
            {active.coupleNames}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--admin-text-muted)" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl overflow-hidden"
            style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.6)" }}
          >
            <div className="text-[10px] uppercase tracking-widest px-3 pt-3 pb-2" style={{ color: "var(--admin-text-muted)" }}>
              Pilih Website
            </div>
            {SITES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSiteId(s.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--admin-surface-2)] transition-colors text-left"
                style={s.id === siteId ? { background: "var(--admin-surface-2)" } : {}}
              >
                <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                     style={{ background: `linear-gradient(135deg, ${s.accent} 0%, ${s.accent}80 100%)` }}>
                  <span className="text-xs font-bold text-[#0B0B10]">{s.id === "site-1" ? "1" : "2"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{s.coupleNames}</div>
                  <div className="text-[10px]" style={{ color: "var(--admin-text-muted)" }}>{s.id}</div>
                </div>
                {s.id === siteId && (
                  <div className="w-2 h-2 rounded-full bg-[#C9A24B] live-pulse" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
