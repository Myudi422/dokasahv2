"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Upload,
  Clock,
  Instagram,
  Eye,
  Trash2,
  AlertCircle,
  FileImage,
  FileVideo,
  ListFilter,
  CheckCircle2,
  Calendar as CalendarIcon
} from "lucide-react";

const API_BASE = "/api/php";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.56 4.26 1.12 1.4 2.7 2.29 4.45 2.56v3.92c-1.88.06-3.71-.57-5.19-1.75-.15-.12-.3-.26-.45-.4v6.86c.03 2.64-1.14 5.16-3.21 6.81-2.45 1.96-5.85 2.39-8.73 1.11-2.91-1.3-4.83-4.42-4.83-7.63.02-3.66 2.59-6.93 6.13-7.85v3.93c-1.81.42-3.08 2.01-3.06 3.87.02 2.14 1.77 3.86 3.91 3.84 2.36-.02 3.96-2.2 3.51-4.52l-.01-14.39h3.97z" />
    </svg>
  );
}

interface SocialAccount {
  id: number;
  platform: "instagram" | "tiktok";
  username: string;
  display_name: string | null;
  profile_picture: string | null;
  is_active: number;
}

interface PostMedia {
  id: number;
  media_url: string;
  media_type: "image" | "video";
  original_name: string;
  sort_order: number;
}

interface PostTarget {
  id: number;
  account_id: number;
  platform: "instagram" | "tiktok";
  username: string;
  profile_picture: string | null;
  status: "pending" | "publishing" | "published" | "failed";
  error_message: string | null;
}

interface SMPost {
  id: number;
  caption: string;
  post_type: "image" | "carousel" | "video" | "reel";
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  media: PostMedia[];
  targets: PostTarget[];
}

export default function ContentPlannerPage() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [postsByDate, setPostsByDate] = React.useState<Record<string, SMPost[]>>({});
  const [allPosts, setAllPosts] = React.useState<SMPost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">("calendar");

  // Modal Creation States
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedAccounts, setSelectedAccounts] = React.useState<number[]>([]);
  const [caption, setCaption] = React.useState("");
  const [postType, setPostType] = React.useState<"image" | "video">("image");
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [scheduledTime, setScheduledTime] = React.useState("");
  const [isScheduled, setIsScheduled] = React.useState(false);
  const [tempMediaFiles, setTempMediaFiles] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewPlatform, setPreviewPlatform] = React.useState<"instagram" | "tiktok">("instagram");

  // TikTok Platform Settings
  const [tiktokTitle, setTiktokTitle] = React.useState("");
  const [tiktokVisibility, setTiktokVisibility] = React.useState("PUBLIC");
  const [tiktokAllowComment, setTiktokAllowComment] = React.useState(true);
  const [tiktokAllowDuet, setTiktokAllowDuet] = React.useState(true);
  const [tiktokAllowStitch, setTiktokAllowStitch] = React.useState(true);

  // Selected Post Details (for quick view)
  const [selectedPost, setSelectedPost] = React.useState<SMPost | null>(null);

  const fetchAccounts = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/social-media/accounts.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error("Gagal memuat akun sosmed:", e);
    }
  }, [token]);

  const fetchCalendarPosts = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    try {
      const res = await fetch(`${API_BASE}/api/social-media/calendar.php?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPostsByDate(data.posts || {});
        }
      }
    } catch (e) {
      console.error("Gagal memuat posts:", e);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentDate]);

  const fetchAllPosts = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/social-media/posts.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAllPosts(data.posts || []);
        }
      }
    } catch (e) {
      console.error("Gagal memuat semua posts:", e);
    }
  }, [token]);

  React.useEffect(() => {
    if (token) {
      fetchAccounts();
      fetchCalendarPosts();
      fetchAllPosts();
    }
  }, [token, currentDate, fetchAccounts, fetchCalendarPosts, fetchAllPosts]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setTempMediaFiles((prev) => [...prev, ...filesArray]);

    const newUrls = filesArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const removeSelectedFile = (index: number) => {
    setTempMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedAccounts([]);
    setCaption("");
    setPostType("image");
    setScheduledDate("");
    setScheduledTime("");
    setIsScheduled(false);
    setTempMediaFiles([]);
    setPreviewUrls([]);
    setTiktokTitle("");
    setTiktokVisibility("PUBLIC");
    setTiktokAllowComment(true);
    setTiktokAllowDuet(true);
    setTiktokAllowStitch(true);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (selectedAccounts.length === 0) {
      alert("Pilih minimal satu akun target publish.");
      return;
    }

    if (tempMediaFiles.length === 0) {
      alert("Harap sertakan minimal satu media.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create main post entry
      let scheduledAtStr = "";
      if (isScheduled && scheduledDate && scheduledTime) {
        scheduledAtStr = `${scheduledDate} ${scheduledTime}:00`;
      }

      const postRes = await fetch(`${API_BASE}/api/social-media/posts.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          caption,
          post_type: postType === "video" ? "video" : (tempMediaFiles.length > 1 ? "carousel" : "image"),
          scheduled_at: scheduledAtStr,
          account_ids: selectedAccounts
        })
      });

      if (!postRes.ok) {
        throw new Error("Gagal membuat data post di server.");
      }

      const postData = await postRes.json();
      if (!postData.success) {
        throw new Error(postData.message || "Gagal membuat data post.");
      }

      const postId = postData.id;

      // 2. Upload files locally
      const formData = new FormData();
      formData.append("post_id", postId);
      tempMediaFiles.forEach((file) => {
        formData.append("files[]", file);
      });

      const uploadRes = await fetch(`${API_BASE}/api/social-media/media-upload.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah media.");
      }

      setIsModalOpen(false);
      resetForm();
      fetchCalendarPosts();
      fetchAllPosts();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!token) return;
    if (!confirm("Apakah Anda yakin ingin menghapus postingan ini?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/social-media/posts.php?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedPost(null);
        fetchCalendarPosts();
        fetchAllPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate days in month for calendar
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty spots for preceding month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const days = getDaysInMonth();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title / Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/85 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-500" />
            Social Media Content Planner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Buat, jadwalkan, dan publikasikan postingan langsung ke akun sosial media Anda secara terjadwal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              List Posts
            </button>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs px-4"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Buat Konten
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid Section */}
          <Card className="lg:col-span-3 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-850 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-850 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold capitalize">
                  {currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-850">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid cell dates */}
              <div className="grid grid-cols-7 bg-slate-50/50 dark:bg-slate-950/20">
                {days.map((date, idx) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[100px] border-r border-b border-slate-100 dark:border-slate-850/80 bg-slate-50/20 dark:bg-slate-950/5"
                      />
                    );
                  }

                  const dateStr = date.toISOString().slice(0, 10);
                  const dayPosts = postsByDate[dateStr] || [];

                  return (
                    <div
                      key={dateStr}
                      className="min-h-[110px] p-2 border-r border-b border-slate-100 dark:border-slate-850/80 bg-white dark:bg-slate-900 flex flex-col gap-1.5 group hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                            date.toDateString() === new Date().toDateString()
                              ? "bg-blue-600 text-white"
                              : "text-slate-700 dark:text-slate-350"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Display thumbnail posts on cell */}
                      <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[85px] scrollbar-thin">
                        {dayPosts.map((post) => {
                          const hasVideo = post.post_type === "video" || post.post_type === "reel";
                          return (
                            <div
                              key={post.id}
                              onClick={() => setSelectedPost(post)}
                              className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-1.5 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                            >
                              <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                                {post.media?.[0] ? (
                                  <img
                                    src={"/" + post.media[0].media_url}
                                    alt="thumb"
                                    className="w-full h-full object-cover"
                                  />
                                ) : hasVideo ? (
                                  <FileVideo className="h-3 w-3 text-slate-400" />
                                ) : (
                                  <FileImage className="h-3 w-3 text-slate-400" />
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate flex-1">
                                {post.caption || "(No Caption)"}
                              </span>
                              <div className="flex gap-0.5">
                                {post.targets.map((tgt) => (
                                  <span key={tgt.id}>
                                    {tgt.platform === "instagram" ? (
                                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 dark:bg-white inline-block" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick View Sidebar Panel */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-850 shadow-sm rounded-2xl p-4 flex flex-col justify-between min-h-[400px]">
            {selectedPost ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Post Detail</h3>
                    <p className="text-[11px] text-slate-400">ID Post: #{selectedPost.id}</p>
                  </div>
                  <Badge
                    className={`text-[10px] font-semibold ${
                      selectedPost.status === "published"
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-none"
                        : selectedPost.status === "scheduled"
                        ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-none"
                        : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/10 border-none"
                    }`}
                  >
                    {selectedPost.status}
                  </Badge>
                </div>

                {/* Media grid details */}
                <div className="grid grid-cols-3 gap-2">
                  {selectedPost.media.map((med) => (
                    <div key={med.id} className="aspect-square bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden relative border border-slate-200/50 dark:border-slate-800">
                      <img src={"/" + med.media_url} alt="media" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <h4 className="text-[10px] font-bold uppercase text-slate-400">Caption</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                    {selectedPost.caption || "(Tanpa caption)"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase text-slate-400">Target Akun</h4>
                  <div className="space-y-1.5">
                    {selectedPost.targets.map((tgt) => (
                      <div key={tgt.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/50">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={tgt.profile_picture || undefined} />
                            <AvatarFallback className="text-[8px] bg-blue-600/10 text-blue-500 font-bold">
                              {tgt.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-800 dark:text-slate-300 truncate max-w-[120px]">
                            @{tgt.username}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 py-0.5 border-slate-200 dark:border-slate-800">
                          {tgt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between border-t border-slate-100 dark:border-slate-850 mt-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="text-red-500 hover:bg-red-500/5 hover:text-red-600 h-8 text-xs rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <CalendarIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                <h4 className="font-semibold text-slate-700 dark:text-slate-350 text-xs">Pilih Konten</h4>
                <p className="text-[10px] text-slate-500 max-w-[180px]">
                  Klik pada item konten di kalender untuk melihat detail di sini.
                </p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* List posts mode layout */
        <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-850 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <h3 className="font-bold text-slate-950 dark:text-white text-sm">Semua Daftar Konten</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {allPosts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">Belum ada konten dibuat.</div>
            ) : (
              allPosts.map((post) => (
                <div key={post.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-slate-800">
                      {post.media?.[0] ? (
                        <img src={"/" + post.media[0].media_url} alt="thumb" className="w-full h-full object-cover" />
                      ) : (
                        <FileImage className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white max-w-lg truncate">
                        {post.caption || "(No Caption)"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-[9px] font-semibold bg-blue-600/10 text-blue-500 hover:bg-blue-600/10 border-none px-1.5 py-0.5">
                          {post.status}
                        </Badge>
                        {post.scheduled_at && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(post.scheduled_at).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {post.targets.map((tgt) => (
                        <div key={tgt.id} className="flex items-center gap-1 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-lg bg-slate-50/50 dark:bg-slate-950/30 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          {tgt.platform === "instagram" ? (
                            <Instagram className="h-3 w-3 text-pink-500" />
                          ) : (
                            <TikTokIcon className="h-3 w-3 text-slate-900 dark:text-white" />
                          )}
                          @{tgt.username}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePost(post.id)}
                      className="h-8 w-8 text-red-500 hover:bg-red-500/5 hover:text-red-600 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Creation Content Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Buat & Jadwalkan Konten</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              {/* Form Input fields */}
              <div className="flex-1 space-y-5">
                {/* 1. Target Accounts Choice */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Pilih Akun Publish</label>
                  {accounts.length === 0 ? (
                    <div className="p-3 text-xs bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                      Belum ada akun sosmed dihubungkan. Silakan hubungkan akun terlebih dahulu.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {accounts.map((acc) => {
                        const isSelected = selectedAccounts.includes(acc.id);
                        return (
                          <button
                            type="button"
                            key={acc.id}
                            onClick={() => {
                              setSelectedAccounts((prev) =>
                                isSelected ? prev.filter((id) => id !== acc.id) : [...prev, acc.id]
                              );
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-blue-600 text-white border-none shadow-lg shadow-blue-600/10"
                                : "bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            <Avatar className="w-4.5 h-4.5">
                              <AvatarImage src={acc.profile_picture || undefined} />
                              <AvatarFallback className="text-[7px]">
                                {acc.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>@{acc.username}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Media Upload section */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Upload Media (Gambar/Video)</label>
                  <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">Klik atau seret file ke sini</p>
                    <p className="text-[10px] text-slate-500 mt-1">Image JPG/PNG up to 10MB, Video MP4 up to 50MB</p>
                  </div>

                  {/* Uploaded media previews */}
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2.5 pt-2">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="aspect-square bg-slate-950 rounded-xl overflow-hidden relative group border border-slate-800">
                          <img src={url} alt="media preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="absolute top-1 right-1 size-5 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Caption field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">Caption</label>
                    <span className="text-[10px] text-slate-500 font-medium">{caption.length} / 2200</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Tulis caption postingan Anda..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* 4. Scheduling Options */}
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-850/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-blue-500" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">Jadwalkan Postingan</span>
                        <span className="text-[10px] text-slate-500">Pilih tanggal dan waktu publikasi</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white" />
                    </label>
                  </div>

                  {isScheduled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">Tanggal</label>
                        <input
                          type="date"
                          required
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">Waktu (Jam)</label>
                        <input
                          type="time"
                          required
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Live Mockup Preview Column */}
              <div className="w-full lg:w-[320px] flex flex-col gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform("instagram")}
                    className={`flex-1 py-1.5 rounded-xl border text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      previewPlatform === "instagram"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 border-none text-white shadow-lg"
                        : "bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    Instagram Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform("tiktok")}
                    className={`flex-1 py-1.5 rounded-xl border text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      previewPlatform === "tiktok"
                        ? "bg-slate-950 border-slate-800 text-white shadow-lg"
                        : "bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <TikTokIcon className="h-3.5 w-3.5" />
                    TikTok Preview
                  </button>
                </div>

                <div className="border border-slate-800 bg-slate-950 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col aspect-[9/16] max-h-[460px] mx-auto w-full max-w-[280px]">
                  {/* Preview UI details */}
                  <div className="p-2.5 border-b border-slate-900 flex items-center justify-between bg-slate-900/30 text-[10px] text-slate-400 font-semibold">
                    <span>Preview Posting</span>
                    <span>9:41</span>
                  </div>

                  {previewPlatform === "instagram" ? (
                    // Instagram mockup
                    <div className="flex-1 flex flex-col bg-slate-900">
                      <div className="p-2.5 flex items-center gap-2">
                        <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-slate-300 font-bold border border-slate-700">
                          IG
                        </div>
                        <span className="text-[10px] font-bold text-white">Instagram User</span>
                      </div>
                      <div className="flex-1 bg-slate-950 flex items-center justify-center relative min-h-[180px]">
                        {previewUrls[0] ? (
                          <img src={previewUrls[0]} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <FileImage className="h-10 w-10 text-slate-800" />
                        )}
                      </div>
                      <div className="p-3 space-y-1 bg-slate-900">
                        <div className="flex gap-2.5 text-white mb-1.5">
                          <span className="text-xs">❤️</span>
                          <span className="text-xs">💬</span>
                          <span className="text-xs">📤</span>
                        </div>
                        <p className="text-[10px] text-slate-300 line-clamp-3">
                          <span className="font-bold text-white mr-1.5">username</span>
                          {caption || "Caption preview..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // TikTok mockup
                    <div className="flex-1 bg-slate-950 relative flex flex-col justify-end text-white">
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-0">
                        {previewUrls[0] ? (
                          <img src={previewUrls[0]} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <FileVideo className="h-10 w-10 text-slate-800" />
                        )}
                      </div>

                      {/* Right icons panel */}
                      <div className="absolute right-2 bottom-20 z-10 flex flex-col items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold">
                          TT
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm">❤️</span>
                          <span className="text-[8px] font-medium text-slate-300">0</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm">💬</span>
                          <span className="text-[8px] font-medium text-slate-300">0</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm">⭐️</span>
                          <span className="text-[8px] font-medium text-slate-300">0</span>
                        </div>
                      </div>

                      {/* Info bottom details */}
                      <div className="p-3 bg-gradient-to-t from-black/80 to-transparent z-10 space-y-1">
                        <h4 className="text-[11px] font-bold">@tiktok_username</h4>
                        <p className="text-[10px] text-slate-200 line-clamp-2">
                          {caption || "Caption preview..."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-xs font-bold shadow-lg shadow-blue-600/10 mt-auto"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : isScheduled ? (
                    "Jadwalkan Konten"
                  ) : (
                    "Simpan ke Draft"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
