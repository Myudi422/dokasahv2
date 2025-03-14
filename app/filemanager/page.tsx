"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  Plus,
  Search,
  Pencil,
  ArrowLeft,
  X,
  Folder as FolderIcon,
  File as FileIcon,
} from "lucide-react";
import { useParams } from "next/navigation"; // untuk menangkap slug dari URL
import { useAuth } from "@/components/AuthContext";

interface FileItem {
  key: string;
  lastModified: string;
  size: number;
  storageClass: string;
  url: string;
}

interface FolderItem {
  slug: string;
  name: string;
}

interface FolderData {
  files: FileItem[];
  folders: FolderItem[];
}

function highlightText(text: string, query: string): JSX.Element {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function FileManagerPage() {
  const { user, isAuthLoaded, token } = useAuth();
  const params = useParams();
  const initialFolderPath = params?.slug
    ? Array.isArray(params.slug)
      ? params.slug[0]
      : params.slug
    : "";
  const [folderPath, setFolderPath] = useState<string>(initialFolderPath);
  const [data, setData] = useState<FolderData>({ files: [], folders: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State upload
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [fieldName, setFieldName] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  // State modal & search
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State preview file
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // State untuk rename folder (khusus admin)
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [renameSlug, setRenameSlug] = useState<string>("");
  const [renameName, setRenameName] = useState<string>("");
  const [renameMessage, setRenameMessage] = useState<string>("");
  const [renaming, setRenaming] = useState<boolean>(false);

  // Fungsi untuk mengambil data folder dari API
  const fetchFolderData = async (path: string, query?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = path
        ? `https://dev.dokasah.web.id/files/dokasah/berkas/${path}`
        : "https://dev.dokasah.web.id/files/dokasah/berkas";
      if (query) {
        url += `?q=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Gagal mengambil data folder");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Error fetching folder contents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolderData(folderPath);
  }, [folderPath]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadMessage("");

    const uploadSlug = folderPath || slug;

    if (!fileUpload || !uploadSlug || !fieldName) {
      setUploadMessage("Semua field wajib diisi.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileUpload);
    formData.append("slug", uploadSlug);
    formData.append("fieldName", fieldName);

    setUploading(true);

    const endpoint = folderPath
      ? "https://dev.dokasah.web.id/api/upload-file"
      : "https://dev.dokasah.web.id/api/upload";

    try {
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok) {
        setUploadMessage("File berhasil diupload.");
        fetchFolderData(folderPath);
        setShowUploadModal(false);
        setFileUpload(null);
        if (!folderPath) {
          setSlug("");
        }
        setFieldName("");
      } else {
        setUploadMessage(json.message || "Upload gagal.");
      }
    } catch (err) {
      setUploadMessage("Terjadi error saat upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchFolderData(folderPath, searchQuery);
    setShowSearchModal(false);
  };

  const enterFolder = (folderSlug: string) => {
    const newPath = folderPath ? `${folderPath}/${folderSlug}` : folderSlug;
    setFolderPath(newPath);
  };

  const goBack = () => {
    if (folderPath) {
      const parts = folderPath.split("/");
      parts.pop();
      setFolderPath(parts.join("/"));
    }
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  const isPreviewable = (file: FileItem): boolean => {
    const ext = getFileExtension(file.key);
    return ["png", "jpg", "jpeg", "gif", "bmp", "mp4", "webm", "ogg", "pdf", "doc", "docx"].includes(ext);
  };

  const handlePreview = (file: FileItem) => {
    if (isPreviewable(file)) {
      setPreviewFile(file);
    } else {
      window.open(file.url, "_blank");
    }
  };

  const handleRenameFolder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRenameMessage("");
    setRenaming(true);
    try {
      const res = await fetch("https://dev.dokasah.web.id/api/rename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: renameSlug, name: renameName }),
      });
      const json = await res.json();
      if (res.ok) {
        setRenameMessage("Folder name updated successfully");
        fetchFolderData(folderPath);
        setShowRenameModal(false);
      } else {
        setRenameMessage(json.message || "Failed to update folder name");
      }
    } catch (err: any) {
      setRenameMessage(err.message || "Error updating folder name");
    } finally {
      setRenaming(false);
    }
  };

  const isEmpty = data.folders.length === 0 && data.files.length === 0;

  if (!isAuthLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">My Drive</h1>
        <div className="flex items-center gap-2">
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            title="Upload"
          >
            <Plus size={24} />
          </button>)}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded bg-gray-200 hover:bg-gray-300"
            title="Search"
          >
            <Search size={24} className="text-gray-700" />
          </button>
          <button
            onClick={goBack}
            disabled={!folderPath}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50 flex items-center gap-1"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>
      </div>

      {/* Loading & Error */}
      {loading && <p className="mb-4">Memuat data...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Jika tidak ada file & folder */}
      {isEmpty && !loading && !error && (
        <p className="text-gray-500 mb-10">tidak ada file & folder yang tersedia</p>
      )}

      {/* Folder Section */}
      {data.folders.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-medium mb-4">Folders</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {data.folders.map((folder) => (
              <div key={folder.slug} className="relative">
                <div
                  onClick={() => enterFolder(folder.slug)}
                  className="cursor-pointer p-4 border rounded-lg hover:shadow-md transition duration-200 flex flex-col items-center"
                >
                  <FolderIcon size={48} className="text-yellow-500 mb-2" />
                  <span className="text-center text-sm font-medium truncate w-full overflow-hidden whitespace-nowrap">
                    {highlightText(folder.name, searchQuery)}
                  </span>
                </div>
                {/* Tampilkan tombol rename hanya untuk admin */}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowRenameModal(true);
                      setRenameSlug(folder.slug);
                      setRenameName(folder.name);
                    }}
                    className="absolute top-2 right-2 bg-gray-100 p-1 rounded"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* File Section */}
      {data.files.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-medium mb-4">Files</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {data.files.map((file) => (
              <div
                key={file.key}
                onClick={() => handlePreview(file)}
                className="cursor-pointer p-4 border rounded-lg hover:shadow-md transition duration-200 flex items-center space-x-4"
              >
                <FileIcon size={32} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <span className="block text-blue-600 hover:underline font-medium">
                    {highlightText(file.key, searchQuery)}
                  </span>
                  <span className="text-xs text-gray-500">{file.size} bytes</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Upload File</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Pilih File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {folderPath ? (
                <div className="mb-4">
                  <span className="text-sm text-gray-700">
                    Upload ke folder: <strong>{folderPath}</strong>
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block mb-2 font-medium">Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Masukkan slug"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>
              )}
              <div>
                <label className="block mb-2 font-medium">Field Name</label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="Masukkan field name"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Mengupload..." : "Upload"}
              </button>
              {uploadMessage && (
                <p className="mt-2 text-sm text-green-600">{uploadMessage}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Search</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block mb-2">Search Query</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan kata kunci"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal (hanya untuk admin) */}
      {showRenameModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Rename Folder</h3>
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRenameFolder} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Folder Name</label>
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="Masukkan nama folder baru"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <button
                type="submit"
                disabled={renaming}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {renaming ? "Updating..." : "Update Name"}
              </button>
              {renameMessage && (
                <p className="mt-2 text-sm text-green-600">{renameMessage}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl w-full relative">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              title="Close Preview"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-semibold mb-4">{previewFile.key}</h3>
            <div className="flex justify-center items-center">
              {(() => {
                const ext = getFileExtension(previewFile.key);
                if (["png", "jpg", "jpeg", "gif", "bmp"].includes(ext)) {
                  return (
                    <img
                      src={previewFile.url}
                      alt={previewFile.key}
                      className="max-w-full max-h-[80vh]"
                    />
                  );
                } else if (["mp4", "webm", "ogg"].includes(ext)) {
                  return (
                    <video
                      src={previewFile.url}
                      controls
                      className="max-w-full max-h-[80vh]"
                    />
                  );
                } else if (ext === "pdf") {
                  return (
                    <iframe
                      src={previewFile.url}
                      title={previewFile.key}
                      className="w-full h-[80vh]"
                    />
                  );
                } else if (["doc", "docx"].includes(ext)) {
                  return (
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(
                        previewFile.url
                      )}&embedded=true`}
                      title={previewFile.key}
                      className="w-full h-[80vh]"
                    />
                  );
                } else {
                  return <p>Preview tidak tersedia untuk file ini.</p>;
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
