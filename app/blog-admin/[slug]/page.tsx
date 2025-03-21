"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import dynamic from "next/dynamic";

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
}

const Tiptap = dynamic(
  () => import("@/components/TiptapEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-[500px] bg-gray-100 rounded-md">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
      </div>
    )
  }
);

const EditorErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
    <h3 className="text-red-600 font-bold mb-2">Editor Error:</h3>
    <pre className="text-red-500 text-sm mb-4">{error.message}</pre>
    <button
      onClick={resetErrorBoundary}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
    >
      Coba Lagi
    </button>
  </div>
);

export default function BlogEditorPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    const fetchArticle = async () => {
      try {
        const response = await fetch(
          `https://dev.dokasah.web.id/api/blog/${slug}`,
          { signal: abortController.signal }
        );

        if (!response.ok) throw new Error("Artikel tidak ditemukan");
        
        const data = await response.json();
        setArticle(data);
        setEditorContent(data.content);
        setError("");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setError(error.message);
          console.error("Error:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();

    return () => abortController.abort();
  }, [slug]);

  const handleSave = async () => {
    try {
      const response = await fetch(`https://dev.dokasah.web.id/api/blog/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editorContent }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan artikel");
      
      alert("Artikel berhasil disimpan!");
      router.push(`/blog/${slug}`);
    } catch (error: any) {
      console.error("Save error:", error);
      alert(error.message || "Terjadi kesalahan saat menyimpan");
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h2 className="text-xl font-bold mb-2">Error!</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  if (isLoading || !article) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse h-8 bg-gray-100 rounded w-1/3 mb-4"></div>
        <div className="animate-pulse h-[500px] bg-gray-100 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Artikel: {article.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition-colors"
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>

      <ErrorBoundary
        FallbackComponent={EditorErrorFallback}
        onReset={() => setEditorContent("")}
      >
        <Tiptap 
          content={editorContent} 
          onUpdate={(content: string) => setEditorContent(content)}
        />
      </ErrorBoundary>
    </div>
  );
}