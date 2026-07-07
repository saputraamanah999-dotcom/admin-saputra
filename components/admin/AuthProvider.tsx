// components/admin/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAdminAuthChanged, signOut as doSignOut, type AdminUser, firebaseConfigured } from "@/lib/firebase/auth";

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAdminAuthChanged((u) => {
      setUser(u);
      setLoading(false);

      // Set cookie supaya middleware ikut mengizinkan akses.
      if (u) {
        document.cookie = `admin-session=active; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      } else {
        document.cookie = "admin-session=; path=/; max-age=0";
      }
    });
    return unsub;
  }, []);

  const signOut = async () => {
    await doSignOut();
    document.cookie = "admin-session=; path=/; max-age=0";
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}

// Re-export supaya komponen lain bisa cek tanpa import dari 2 tempat
export { firebaseConfigured };
