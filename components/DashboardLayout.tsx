"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Folder,
  LogOut,
  Menu,
  MoreHorizontal
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth, useAuthRedirect } from "@/components/AuthContext"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthLoaded, setToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect ke halaman login jika tidak ada token (setelah auth selesai dimuat)
  useAuthRedirect();

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

  const handleLogout = () => {
    setToken(null);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r bg-card overflow-y-auto">
        <div className="p-4 flex items-center gap-2 border-b">
          <span className="font-bold text-lg">Dokasah</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
          <NavItem href="/cases" icon={FileText} label="Formulir Order" active={pathname === "/cases"} />
          <NavItem href="/documents" icon={Folder} label="File Manager" active={pathname === "/documents"} />
        </nav>
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.profile_pictures} alt="User" />
              <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          {/* Menu Hamburger untuk Layar Kecil */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 flex items-center gap-2 border-b">
                  <span className="font-bold text-lg">Dokasah</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
                  <NavItem href="/cases" icon={FileText} label="Formulir Order" active={pathname === "/cases"} />
                  <NavItem href="/documents" icon={Folder} label="File Manager" active={pathname === "/documents"} />
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Konten Header Utama */}
          <div className="flex items-center justify-end w-full">
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profile_pictures || "/placeholder-user.jpg"} alt="User" />
                      <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, badge, active = false }: { href: string, icon: React.ElementType, label: string, badge?: string, active?: boolean }) {
  return (
    <Link href={href}>
      <Button variant={active ? "secondary" : "ghost"} className="w-full justify-start">
        <Icon className="mr-2 h-4 w-4" />
        {label}
        {badge && (
          <Badge className="ml-auto" variant="secondary">
            {badge}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
