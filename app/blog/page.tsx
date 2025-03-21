"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  image: string; // gambar utama artikel
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        const res = await fetch("https://dev.dokasah.web.id/api/blog", {
          cache: "no-cache",
        });
        if (!res.ok) throw new Error("Gagal mengambil data artikel");
        const data = await res.json();
        // Asumsikan data berupa array artikel
        setBlogPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogPosts();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
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
                  "https://wa.me/6287822344206?text=Saya%20ingin%20konsultasi%20tentang%20layanan%20Dokasah%2C%20bisa%20dibantu%3F"
                )
              }
              className="group"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="space-y-4 text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20">Blog</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Artikel Terbaru</h2>
          </div>
          {loading ? (
            <p className="text-center mt-8">Memuat artikel...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block overflow-hidden rounded-lg shadow-lg"
                >
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 bg-white">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 text-center bg-gray-100">
        <p className="text-sm">&copy; 2024 Dokasah. All rights reserved.</p>
      </footer>
    </div>
  );
}
