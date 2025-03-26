// components/AuthContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  token: string | null;
  user: any;
  setToken: (token: string | null) => void;
  isAuthLoaded: boolean;
}

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, _setToken] = useState<string | null>(null);
  const [user, setUser ] = useState<any>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const router = useRouter();

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    _setToken(newToken);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const decodedToken = parseJwt(storedToken);
      if (decodedToken?.exp && decodedToken.exp * 1000 < Date.now()) {
        // Token kadaluarsa, hapus dari localStorage dan redirect ke login
        localStorage.removeItem('token');
        _setToken(null);
        router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else {
        _setToken(storedToken);
      }
    }
    setIsAuthLoaded(true);
  }, [router]);

  useEffect(() => {
    if (token) {
      fetch('https://dev.dokasah.web.id/api/protected', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 403 || res.status === 401) {
              throw new Error('Unauthorized');
            }
          }
          return res.json();
        })
        .then(data => setUser (data.user))
        .catch(() => {
          // Hapus token jika terjadi error 403/401 dan redirect ke login
          setToken(null);
          router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
        });
    }
  }, [token, router]);

  return (
    <AuthContext.Provider value={{ token, user, setToken, isAuthLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isAuthLoaded } = useAuth();

  useEffect(() => {
    if (isAuthLoaded && !token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoaded, token, router, pathname]);
}