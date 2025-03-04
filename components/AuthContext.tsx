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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, _setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    _setToken(newToken);
  };

  useEffect(() => {
    // Ambil token dari localStorage setelah mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      _setToken(storedToken);
    }
    setIsAuthLoaded(true);
  }, []);

  useEffect(() => {
    if (token) {
      fetch('https://lv.adewahyudin.com/api/protected', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUser(data.user))
        .catch(() => {
          setToken(null);
        });
    }
  }, [token]);

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

// Hook useAuthRedirect yang menunggu hingga isAuthLoaded true
export function useAuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isAuthLoaded } = useAuth();

  useEffect(() => {
    if (isAuthLoaded && !token) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthLoaded, token, router, pathname]);
}
