"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Article {
  id: number;
  title: string;
  slug: string;
  image: string;
}

export default function BlogAdminPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // Ambil daftar artikel dari API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("https://dev.dokasah.web.id/api/blog");
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
    };

    fetchArticles();
  }, []);

  // Fungsi untuk membuat artikel baru
  const handleCreateArticle = async () => {
    if (!newTitle || !newSlug) {
      alert("Judul dan slug harus diisi");
      return;
    }

    try {
      const response = await fetch("https://dev.dokasah.web.id/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle, slug: newSlug }),
      });

      if (!response.ok) {
        throw new Error("Gagal membuat artikel");
      }

      const createdArticle = await response.json();
      // Redirect ke halaman editor artikel berdasarkan slug yang baru dibuat
      router.push(`/blog-admin/${createdArticle.slug}`);
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Terjadi kesalahan saat membuat artikel");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Blog Admin</h1>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        + Buat Artikel
      </button>

      <div>
        {articles.map((article) => (
          <div key={article.id} className="border p-4 mb-2">
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <p className="text-gray-500">{article.slug}</p>
            <button
              onClick={() => router.push(`/blog-admin/${article.slug}`)}
              className="bg-green-500 text-white px-4 py-2 rounded mt-2"
            >
              Edit Artikel
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h2 className="text-xl font-bold mb-4">Buat Artikel Baru</h2>
            <div className="mb-4">
              <label className="block mb-1">Judul</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border px-2 py-1"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Slug</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full border px-2 py-1"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="mr-2 px-4 py-2 border rounded"
              >
                Batal
              </button>
              <button
                onClick={handleCreateArticle}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
