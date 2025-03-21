"use client";

import { notFound } from "next/navigation";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface BlogArticle {
  title: string;
  content: string;
  created_at: string;
  images: Array<{
    image_url: string;
    caption?: string;
  }>;
}

interface TocItem {
  level: string;
  text: string;
  id: string;
}

export default function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`https://dev.dokasah.web.id/api/blog/${slug}`, {
          cache: "no-cache",
        });

        if (!res.ok) throw new Error("Artikel tidak ditemukan");

        const data = await res.json();

        // Replace [IMAGE_X] with actual image tags using custom image class
        let modifiedContent = data.content;
        data.images.forEach((img, index) => {
          const imgTag = `<img src='${img.image_url}' alt='${img.caption || data.title}' class='article-image' />`;
          modifiedContent = modifiedContent.replace(`[IMAGE_${index + 1}]`, imgTag);
        });

        // Add id attribute to <h1> and <h2> tags for TOC linking
        modifiedContent = modifiedContent.replace(/<(h[12])>(.*?)<\/\1>/gi, (match, tag, text) => {
          const id = text.replace(/\s+/g, "-").toLowerCase();
          return `<${tag} id="${id}">${text}</${tag}>`;
        });

        // Extract headings (h1 and h2) for the Table of Contents (TOC)
        const tocItems: TocItem[] = [];
        const regex = /<(h[12]) id="(.*?)">(.*?)<\/\1>/gi;
        let match;
        while ((match = regex.exec(modifiedContent)) !== null) {
          tocItems.push({ level: match[1], id: match[2], text: match[3] });
        }

        setArticle({ ...data, content: modifiedContent });
        setToc(tocItems);
      } catch (err) {
        console.error(err);
        setArticle(null);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  if (!loading && !article) {
    notFound();
  }

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
      <main className="flex-1 py-16 md:py-16">
        <div className="container px-4 md:px-6">
          {loading ? (
            <p className="text-center">Memuat artikel...</p>
          ) : (
            article && (
              <>
                <div className="space-y-4 text-center">
                  <Badge className="bg-primary/10 text-primary border-primary/20">Blog</Badge>
                  <h1 className="text-5xl font-bold text-gradient">{article.title}</h1>
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Published on {new Date(article.created_at).toLocaleDateString()}
                </p>

                {/* Desktop layout: 3 columns (Left: TOC, Middle: Content, Right: Related) */}
                <div className="grid grid-cols-1 md:grid-cols-[20%_1fr_20%] gap-8 mt-8">
                  {/* Left Column: TOC (sticky) */}
                  <aside className="hidden md:block">
  <div className="sticky top-20">
    <h2 className="text-xl font-bold mb-4">Daftar Isi</h2>
    <ul className="toc pl-4">
      {toc.map((item, index) => (
        <li key={index} className={item.level === "h1" ? "mb-2" : "mb-2 ml-4"}>
          <a href={`#${item.id}`} className="hover:underline">
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  </div>
</aside>


                  {/* Middle Column: Article Content */}
                  <article className="col-span-1">
                    <div className="prose" dangerouslySetInnerHTML={{ __html: article.content }}></div>
                  </article>

                  {/* Right Column: Related Articles (sticky) */}
                  <aside className="hidden md:block">
                    <div className="sticky top-20">
                      <h2 className="text-xl font-bold mb-4">Artikel Terkait</h2>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 border rounded">Artikel Terkait 1</div>
                        <div className="p-4 border rounded">Artikel Terkait 2</div>
                        <div className="p-4 border rounded">Artikel Terkait 3</div>
                      </div>
                    </div>
                  </aside>
                </div>
              </>
            )
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
