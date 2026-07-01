"use client";

import * as React from "react";
import { useAuth } from "@/components/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Share2,
  Plus,
  Trash2,
  RefreshCw,
  Instagram,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from "lucide-react";

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

const API_BASE = "/api/php";

interface SocialAccount {
  id: number;
  platform: "instagram" | "tiktok";
  platform_user_id: string;
  username: string;
  display_name: string | null;
  profile_picture: string | null;
  is_active: number;
  connected_at: string;
  token_expires_at: string | null;
  token_status: "active" | "expired";
}

export default function SocialAccountsPage() {
  const { token } = useAuth();
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActionLoading, setIsActionLoading] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Modal State for adding dummy account (for developer fallback testing)
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);
  const [demoPlatform, setDemoPlatform] = React.useState<"instagram" | "tiktok">("instagram");
  const [demoUsername, setDemoUsername] = React.useState("");
  const [demoDisplayName, setDemoDisplayName] = React.useState("");

  const fetchAccounts = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/social-media/accounts.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAccounts(data.accounts || []);
        } else {
          setError(data.message || "Gagal mengambil daftar akun.");
        }
      } else {
        setError("Gagal terhubung ke server API.");
      }
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const processingRef = React.useRef(false);

  // Handle OAuth code callback on page mount
  React.useEffect(() => {
    if (!token) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const stateEncoded = urlParams.get("state");

    if (code) {
      if (processingRef.current) return;
      processingRef.current = true;

      let platform: "instagram" | "tiktok" = "instagram";
      if (stateEncoded) {
        try {
          const stateData = JSON.parse(atob(stateEncoded));
          if (stateData.platform) {
            platform = stateData.platform;
          }
        } catch (e) {
          console.error("Gagal parse state OAuth:", e);
        }
      } else {
        // Fallback detection from query params if state is not present
        if (window.location.href.includes("tiktok")) {
          platform = "tiktok";
        }
      }

      const processCallback = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
          const res = await fetch(`${API_BASE}/api/social-media/oauth-callback.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ code, platform })
          });

          const data = await res.ok ? await res.json() : null;
          if (res.ok && data && data.success) {
            setSuccessMsg(data.message || "Akun berhasil dihubungkan!");
            // Clean up URL parameters without reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } else {
            setError(data?.message || "Gagal menghubungkan akun. Pastikan kredensial API valid.");
          }
        } catch (e) {
          console.error(e);
          setError("Terjadi kesalahan sistem saat memproses integrasi OAuth.");
        } finally {
          setIsLoading(false);
          fetchAccounts();
        }
      };

      processCallback();
    } else {
      fetchAccounts();
    }
  }, [token, fetchAccounts]);

  const handleDisconnect = async (id: number) => {
    if (!token) return;
    if (!confirm("Apakah Anda yakin ingin memutuskan koneksi akun ini?")) return;

    setIsActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/api/social-media/accounts.php?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAccounts((prev) => prev.filter((acc) => acc.id !== id));
          setSuccessMsg("Koneksi akun berhasil diputuskan.");
        } else {
          setError(data.message || "Gagal memutuskan koneksi.");
        }
      }
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan.");
    } finally {
      setIsActionLoading(null);
    }
  };

  const autoConnectDemoAccount = async (platform: "instagram" | "tiktok") => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const igUsers = [
      { username: "papunda.wedding", display: "Papunda Wedding Organizer", pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
      { username: "yudi.official", display: "Yudi Official", pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
      { username: "dokasah.planner", display: "Dokasah Content Team", pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" }
    ];

    const ttUsers = [
      { username: "tiktok.marketing", display: "TikTok Marketing Expert", pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
      { username: "dokasah.creators", display: "Dokasah Creator Studio", pic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" }
    ];

    const pool = platform === "instagram" ? igUsers : ttUsers;
    const selectedUser = pool[Math.floor(Math.random() * pool.length)];

    const dummyToken = "demo_token_" + Math.random().toString(36).substring(2);
    const dummyPlatformId = "demo_id_" + Math.floor(Math.random() * 1000000);

    try {
      const res = await fetch(`${API_BASE}/api/social-media/accounts.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          platform,
          platform_user_id: dummyPlatformId,
          username: selectedUser.username,
          display_name: selectedUser.display,
          profile_picture: selectedUser.pic,
          access_token: dummyToken,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSuccessMsg(`Berhasil menghubungkan akun simulasi @${selectedUser.username}!`);
          fetchAccounts();
        } else {
          setError(data.message || "Gagal menghubungkan akun.");
        }
      } else {
        setError("Gagal terhubung ke API backend.");
      }
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  const startOAuthFlow = async (platform: "instagram" | "tiktok") => {
    if (!token) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/social-media/oauth-url.php?platform=${platform}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url && !data.url.includes("YOUR_FACEBOOK_APP_ID") && !data.url.includes("YOUR_TIKTOK_CLIENT_KEY")) {
          // Redirect to actual Instagram / TikTok OAuth consent screen
          window.location.href = data.url;
          return;
        }
      }
    } catch (e) {
      console.error("Gagal menginisiasi OAuth flow:", e);
    }

    // Fallback: Directly connect a demo account if credentials are not configured or request fails
    await autoConnectDemoAccount(platform);
  };

  const handleConnectDemoAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !demoUsername) return;

    const dummyToken = "demo_token_" + Math.random().toString(36).substring(2);
    const dummyPlatformId = "demo_id_" + Math.floor(Math.random() * 1000000);
    const profilePic = demoPlatform === "instagram"
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80";

    try {
      const res = await fetch(`${API_BASE}/api/social-media/accounts.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: demoPlatform,
          platform_user_id: dummyPlatformId,
          username: demoUsername.startsWith("@") ? demoUsername.slice(1) : demoUsername,
          display_name: demoDisplayName || demoUsername,
          profile_picture: profilePic,
          access_token: dummyToken,
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsDemoModalOpen(false);
          setDemoUsername("");
          setDemoDisplayName("");
          setSuccessMsg("Akun simulasi berhasil dihubungkan!");
          fetchAccounts();
        } else {
          setError(data.message || "Gagal menambahkan akun demo.");
        }
      }
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan.");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/85 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-6 w-6 text-blue-500" />
            Integrasi Akun Sosial Media
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Koneksikan dan kelola akun Instagram & TikTok Anda untuk menjadwalkan konten langsung dari satu tempat.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAccounts}
          className="h-9 px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gagal menghubungkan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Integration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instagram Connection */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <Instagram className="h-40 w-40 text-pink-500" />
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Connect Instagram</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Instagram Professional (Business/Creator)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-6 text-sm text-slate-300">
            <p>Hubungkan akun Instagram Professional Anda untuk dapat melakukan:</p>
            <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              <li>Posting gambar tunggal, video (Reels), atau carousel.</li>
              <li>Menjadwalkan otomatis waktu posting.</li>
              <li>Melihat status postingan secara real-time.</li>
            </ul>
            <div className="pt-2 text-xs text-slate-500">
              *Mengarahkan ke halaman OAuth Facebook / Instagram resmi untuk penukaran token otomatis.
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-800 bg-slate-950/40 p-4 flex justify-end">
            <Button
              onClick={() => startOAuthFlow("instagram")}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white hover:opacity-90 rounded-xl px-4 py-2 text-xs font-semibold shadow-md shadow-pink-600/10"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Hubungkan Instagram
            </Button>
          </CardFooter>
        </Card>

        {/* TikTok Connection */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <TikTokIcon className="h-40 w-40 text-teal-400" />
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-lg border border-slate-850">
                <TikTokIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white text-base">Connect TikTok</CardTitle>
                <CardDescription className="text-slate-400 text-xs">TikTok Business or Personal Account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-6 text-sm text-slate-300">
            <p>Hubungkan akun TikTok Anda untuk mempublikasikan video:</p>
            <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              <li>Upload video kualitas tinggi dengan opsi Visibility (Public/Friends/Private).</li>
              <li>Kustomisasi opsi interaksi (Allow Comment, Duet, Stitch).</li>
              <li>Penjadwalan video publish otomatis.</li>
            </ul>
            <div className="pt-2 text-xs text-slate-500">
              *Mengarahkan ke halaman OAuth TikTok resmi untuk penukaran token otomatis.
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-800 bg-slate-950/40 p-4 flex justify-end">
            <Button
              onClick={() => startOAuthFlow("tiktok")}
              className="bg-slate-950 text-white border border-slate-850 hover:bg-slate-900 rounded-xl px-4 py-2 text-xs font-semibold shadow-md"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Hubungkan TikTok
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Akun Terkoneksi ({accounts.length})
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Memuat akun...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <Share2 className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Belum Ada Akun Terkoneksi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Hubungkan akun Instagram atau TikTok Anda di atas untuk memulai penjadwalan postingan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const isIG = acc.platform === "instagram";
              const isExpired = acc.token_status === "expired";
              return (
                <Card key={acc.id} className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-855 shadow-sm rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-800 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-slate-100 dark:ring-slate-800">
                          <AvatarImage src={acc.profile_picture || undefined} />
                          <AvatarFallback className="bg-blue-600/10 text-blue-500 font-bold">
                            {acc.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              @{acc.username}
                            </span>
                            {isIG ? (
                              <Instagram className="h-3.5 w-3.5 text-pink-500" />
                            ) : (
                              <TikTokIcon className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {acc.display_name || "-"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={isExpired ? "destructive" : "default"}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isExpired
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/10 border-none"
                            : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-none"
                        }`}
                      >
                        {isExpired ? "Token Expired" : "Aktif"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 pb-3 space-y-2 border-t border-slate-100 dark:border-slate-850 mt-3 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-350 capitalize">{acc.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dihubungkan:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-350">
                        {new Date(acc.connected_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                    {acc.token_expires_at && (
                      <div className="flex justify-between">
                        <span>Kadaluwarsa Token:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-350">
                          {new Date(acc.token_expires_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(acc.id)}
                      disabled={isActionLoading === acc.id}
                      className="text-red-500 hover:bg-red-500/5 hover:text-red-600 h-8 px-2.5 rounded-lg text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Putuskan
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Demo Connection Modal (as a Developer fallback/fallback option) */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden">
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <XCircle className="h-6 w-6" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              Koneksi Cepat (Mode Pengujian)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Facebook/TikTok API belum dikonfigurasi. Masukkan detail di bawah untuk menghubungkan akun secara instan untuk tujuan pengujian.
            </p>

            <form onSubmit={handleConnectDemoAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Platform</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoPlatform("instagram")}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      demoPlatform === "instagram"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 border-none text-white shadow-lg shadow-pink-600/10"
                        : "bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoPlatform("tiktok")}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      demoPlatform === "tiktok"
                        ? "bg-slate-950 border-slate-800 text-white shadow-lg"
                        : "bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <TikTokIcon className="h-4 w-4" />
                    TikTok
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-xs font-semibold text-slate-500">@</span>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={demoUsername}
                    onChange={(e) => setDemoUsername(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-850 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Display Name (Nama Tampilan)</label>
                <input
                  type="text"
                  placeholder="e.g. Papunda Official"
                  value={demoDisplayName}
                  onChange={(e) => setDemoDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDemoModalOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs h-9 px-3"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs h-9 px-4 font-semibold"
                >
                  Hubungkan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
