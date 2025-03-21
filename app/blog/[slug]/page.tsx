// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import BlogArticleContent from "./BlogArticleClient";

interface BlogArticle {
  title: string;
  content: string;
  created_at: string;
  images: Array<{
    image_url: string;
    caption?: string;
  }>;
}

async function getArticle(slug: string): Promise<BlogArticle | null> {
  try {
    const res = await fetch(`https://dev.dokasah.web.id/api/blog/${slug}`, {
      cache: "no-cache",
    });
    return res.ok ? await res.json() : null;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  return {
    title: article?.title || "Artikel Tidak Ditemukan - Dokasah",
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  // Process content and TOC
  let modifiedContent = article.content;
  article.images.forEach((img, index) => {
    const imgTag = `<img src='${img.image_url}' alt='${img.caption || article.title}' class='article-image' />`;
    modifiedContent = modifiedContent.replace(`[IMAGE_${index + 1}]`, imgTag);
  });

  modifiedContent = modifiedContent.replace(
    /<(h[12])>(.*?)<\/\1>/gi,
    (match, tag, text) => {
      const id = text.replace(/\s+/g, "-").toLowerCase();
      return `<${tag} id="${id}">${text}</${tag}>`;
    }
  );

  const tocItems = [];
  const regex = /<(h[12]) id="(.*?)">(.*?)<\/\1>/gi;
  let match;
  while ((match = regex.exec(modifiedContent)) !== null) {
    tocItems.push({ level: match[1], id: match[2], text: match[3] });
  }

  return (
    <BlogArticleContent 
      article={{ ...article, content: modifiedContent }}
      toc={tocItems}
    />
  );
}