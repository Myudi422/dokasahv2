// components/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const API_BASE = "/api/php";

interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
  profile_pictures?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  isAuthLoaded: boolean;
  apiBase: string;
}

// ─── Fix: handle URL-safe base64 dari PHP (- → +, _ → /, tambah padding) ─────
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function userFromToken(token: string): User | null {
  const decoded = parseJwt(token);
  if (!decoded) return null;
  // Cek token tidak expired
  if (decoded.exp && (decoded.exp as number) * 1000 < Date.now()) return null;
  return {
    id: decoded.id as number,
    email: decoded.email as string,
    name: decoded.name as string,
    role: decoded.role as "admin" | "user",
    profile_pictures: (decoded.profile_pictures as string | null) ?? null,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, _setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const router = useRouter();

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      // ─── Langsung set user dari JWT payload ─────────────────────────────────
      const u = userFromToken(newToken);
      setUser(u);
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
    _setToken(newToken);
  }, []);

  // ── Muat token dari localStorage saat pertama kali render ──────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const u = userFromToken(storedToken);
      if (!u) {
        // Token expired atau tidak valid
        localStorage.removeItem("token");
      } else {
        _setToken(storedToken);
        setUser(u);
      }
    }
    setIsAuthLoaded(true);
  }, []);

  // ── Background: refresh user dari server (opsional, tidak wajib) ───────────
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/auth/me.php`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        // Hanya logout jika server eksplisit bilang unauthorized
        if (res.status === 401 || res.status === 403) {
          setToken(null);
          router.replace("/login");
          return null;
        }
        if (!res.ok) return null; // Server error — abaikan, pakai data JWT
        return res.json();
      })
      .then((data) => {
        if (data?.success && data.user) {
          setUser(data.user); // Update dengan data terbaru dari server
        }
      })
      .catch(() => {
        // Network / CORS error — JANGAN logout, user tetap aktif dari JWT
      });
  }, [token, setToken, router]);

  return (
    <AuthContext.Provider value={{ token, user, setToken, isAuthLoaded, apiBase: API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function useAuthRedirect() {
  const { token, isAuthLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthLoaded && !token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoaded, token, router, pathname]);
}