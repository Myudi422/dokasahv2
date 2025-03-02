"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithPopup, auth, provider } from "../public/firebase.config";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
import { useAuth } from "@/components/AuthContext";
import { MessageCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setToken } = useAuth(); // Gunakan setToken dari context

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch("https://improved-lamp-vq6j9gjvjpxfp6jx-3001.app.github.dev/api/protected/api/protected", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (response.ok) {
            router.push("/dashboard");
          } else {
            localStorage.removeItem("token");
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const response = await fetch("https://improved-lamp-vq6j9gjvjpxfp6jx-3001.app.github.dev/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token); // Gunakan setToken dari context
        const searchParams = new URLSearchParams(window.location.search);
const redirectUrl = searchParams.get("redirect") || "/dashboard";
router.push(redirectUrl);
      } else {
        setError("Gagal menyimpan data pengguna.");
      }
    } catch (err) {
      setError("Login gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white">
              D
            </div>
            Dokasah
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Beranda
            </Link>
            <Link href="/layanan" className="text-sm font-medium hover:text-primary">
              Layanan
            </Link>
            <Link href="/tentang-kami" className="text-sm font-medium hover:text-primary">
              Tentang Kami
            </Link>
          </nav>
          <div className="flex items-center gap-2">
          <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Button
  onClick={() =>
    window.open(
      "https://wa.me/6287822344206?text=Saya%20ingin%20konsultasi%20tentang%20layanan%20Dokasah%2C%20bisa%20dibantu%3F",
    )
  }
  className="group"
>
  <MessageCircle className="h-4 w-4" /> {/* Ikon Telepon */}
</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md space-y-8 px-4 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Masuk ke Dashboard Anda
            </h2>
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="mt-8 space-y-6">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center"
            >
              {isLoading ? (
                "Memproses..."
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 backdrop-blur-sm">
        <div className="container flex flex-col gap-6 py-8 md:py-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Legalitas. Hak Cipta Dilindungi.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Syarat & Ketentuan
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}