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
  image: string;
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  const fetchBlogPosts = async (page: number) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://dev.dokasah.web.id/api/blog?page=${page}&limit=${itemsPerPage}`
      );

      if (!res.ok) {
        throw new Error(`Gagal memuat artikel (Status: ${res.status})`);
      }

      const result = await res.json();

      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Format data tidak valid");
      }

      setBlogPosts(result.data);
      setTotalPages(Math.ceil(result.total / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts(currentPage);
  }, [currentPage]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white">
              D
            </div>
            Dokasah
          </div>

          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Beranda
            </Link>
            <Link href="/layanan" className="text-sm font-medium hover:text-primary transition-colors">
              Layanan
            </Link>
            <Link href="/tentang-kami" className="text-sm font-medium hover:text-primary transition-colors">
              Tentang Kami
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" className="hover:bg-primary/10">
                Login
              </Button>
            </Link>
            <Button
              onClick={() => window.open(
                "https://wa.me/6287767518217?text=Saya%20ingin%20konsultasi%20tentang%20layanan%20Dokasah%2C%20bisa%20dibantu%3F",
                "_blank"
              )}
              variant="ghost"
              size="icon"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="space-y-4 text-center mb-12">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Blog
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Artikel Terbaru
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="animate-pulse text-muted-foreground">Memuat artikel...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-destructive">{error}</p>
              <Button 
                variant="outline"
                onClick={() => fetchBlogPosts(currentPage)}
              >
                Coba Lagi
              </Button>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Belum ada artikel tersedia</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group relative rounded-xl shadow-sm hover:shadow-md transition-shadow bg-card"
                  >
                    <Link href={`/blog/${post.slug}`} className="block h-full">
                      <div className="relative aspect-video overflow-hidden rounded-t-xl">
                        {post.image ? (
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted">
                            <span className="text-muted-foreground">Tidak ada gambar</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h2 className="text-xl font-semibold line-clamp-2">
                          {post.title}
                        </h2>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      size="sm"
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-8 px-4 md:px-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dokasah. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}