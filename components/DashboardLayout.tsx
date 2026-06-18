"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Folder,
  NotepadText,
  LogOut,
  Menu,
  ChevronRight,
  User,
  Settings,
  Bell,
  HelpCircle
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth, useAuthRedirect } from "@/components/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthLoaded, setToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Redirect to login page if there's no token (after auth loaded)
  useAuthRedirect();

  if (!isAuthLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400 font-medium">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setToken(null);
    router.push("/login");
  };

  const menuItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/filemanager", icon: Folder, label: "File Manager" },
    ...(user?.role === "admin"
      ? [{ href: "/blog-admin", icon: NotepadText, label: "Artikel Manager" }]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-50">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 text-slate-300 shadow-xl overflow-hidden z-20">
        {/* Logo Section */}
        <div 
          className="p-6 flex items-center gap-3 border-b border-slate-800 cursor-pointer group"
          onClick={() => (window.location.href = "https://dokasah.web.id")}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-black text-base tracking-wider">D</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base tracking-tight leading-none">Dokasah</span>
            <span className="text-[10px] text-slate-500 mt-0.5 tracking-wider uppercase font-semibold">Management</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive}
              />
            );
          })}
        </nav>

        {/* Footer User Info Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/30 border border-slate-800/50 hover:bg-slate-850 transition-colors duration-200">
            <Avatar className="w-9 h-9 ring-2 ring-slate-800 ring-offset-2 ring-offset-slate-900">
              <AvatarImage src={user?.profile_pictures || undefined} alt={user?.name || "User"} />
              <AvatarFallback className="bg-blue-600/20 text-blue-400 text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-none mb-0.5">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate leading-none">{user?.email}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-slate-900 border-slate-800 text-slate-200 shadow-xl">
                <DropdownMenuLabel className="text-slate-400 font-normal text-xs px-2.5 py-1.5">Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem className="focus:bg-slate-800 focus:text-white py-2 cursor-pointer gap-2">
                  <User className="h-4 w-4 text-slate-400" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-slate-800 focus:text-white py-2 cursor-pointer gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 text-red-400" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 sm:px-6 shadow-sm">
          {/* Left Area (Hamburger for Mobile) */}
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-slate-900 border-slate-800 text-slate-300 flex flex-col h-full">
                  <SheetHeader className="p-6 border-b border-slate-800 text-left">
                    <SheetTitle className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-black text-base">D</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-base leading-none">Dokasah</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 tracking-wider uppercase font-semibold">Management</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  {/* Navigation in Mobile */}
                  <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <NavItem
                          key={item.href}
                          href={item.href}
                          icon={item.icon}
                          label={item.label}
                          active={isActive}
                          onClick={() => setIsMobileOpen(false)}
                        />
                      );
                    })}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="p-4 border-t border-slate-800 bg-slate-950/40 mt-auto">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/30 border border-slate-800/50">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={user?.profile_pictures || undefined} />
                        <AvatarFallback className="bg-blue-600/20 text-blue-400 text-sm font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate leading-none mb-0.5">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate leading-none">{user?.email}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Desktop Brand / Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer">Sistem</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-100 font-semibold capitalize">
                {pathname.split("/")[1] || "dashboard"}
              </span>
            </div>
          </div>

          {/* Right Area (Actions & Avatar) */}
          <div className="flex items-center gap-3">
            {/* Notification Button */}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-xl p-0 hover:bg-slate-100 dark:hover:bg-slate-900" size="icon">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.profile_pictures || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-1.5 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal px-2.5 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-850 dark:text-slate-200">{user?.name}</p>
                    <p className="text-xs leading-none text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem className="py-2 cursor-pointer gap-2 text-slate-600 dark:text-slate-350 focus:bg-slate-100 dark:focus:bg-slate-800 dark:focus:text-white">
                  <User className="h-4 w-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2 cursor-pointer gap-2 text-slate-600 dark:text-slate-350 focus:bg-slate-100 dark:focus:bg-slate-800 dark:focus:text-white">
                  <Settings className="h-4 w-4" /> Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                <DropdownMenuItem className="py-2 cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-600 dark:focus:text-red-400 font-medium" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <Button
        variant="ghost"
        className={`w-full justify-start gap-3 h-10.5 px-3.5 text-sm font-medium transition-all duration-200 rounded-xl relative group ${
          active
            ? "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white"
            : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
        }`}
      >
        <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
        <span className="truncate">{label}</span>
        {active && (
          <span className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></span>
        )}
      </Button>
    </Link>
  );
}
