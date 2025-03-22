"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchArticles = async (page: number) => {
    try {
      const response = await fetch(
        `https://dev.dokasah.web.id/api/blog?page=${page}&limit=${itemsPerPage}`
      );
      const result = await response.json();
      
      // Pastikan response memiliki struktur yang benar
      if (result.data && Array.isArray(result.data)) {
        setArticles(result.data);
        setTotalPages(Math.ceil(result.total / itemsPerPage));
      } else {
        setArticles([]); // Fallback ke array kosong
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      setArticles([]); // Fallback ke array kosong
    }
  };

  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage]);

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
      try {
        await fetch(`https://dev.dokasah.web.id/api/blog/${id}`, {
          method: "DELETE",
        });
        fetchArticles(currentPage);
      } catch (error) {
        console.error("Error deleting article:", error);
      }
    }
  };
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog Admin</h1>
        <Button onClick={() => setIsModalOpen(true)} variant="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Buat Artikel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {articles.map((article) => (
          <div key={article.id} className="border p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-semibold">{article.title}</h2>
                <p className="text-gray-500 text-sm">{article.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/blog-admin/${article.slug}`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(article.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
            {article.image && (
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-32 object-cover rounded"
              />
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
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