"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import CreateFormModal from "@/components/CreateFormModal";
import { usePathname } from "next/navigation"
import { BarChart3, LoaderIcon ,Calendar, FileText, FileArchive, Folder, Gavel, Home, LayoutDashboard, LogOut, Menu, MessageSquare, Package2, PieChart, Search, Settings, Users, Bell, Clock, ChevronDown, MoreHorizontal, Plus } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/components/AuthContext"

export default function DashboardPage() {
  const router = useRouter()
  const { user, token } = useAuth();
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      router.push("/login")
    } else {
      fetch("https://improved-lamp-vq6j9gjvjpxfp6jx-3001.app.github.dev/api/protected", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Token tidak valid")
          setLoading(false)
        })
        .catch(() => {
          localStorage.removeItem("token")
          router.push("/login")
        })
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
        <div className="p-4 flex items-center gap-2 border-b">
          <span className="font-bold text-lg">Dokasah</span>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
          <NavItem href="/form" icon={FileText} label="Formulir Order" active={pathname === "/form"} />
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
          <NavItem href="/form" icon={FileText} label="Formulir Order" active={pathname === "/form"} />
          <NavItem href="/documents" icon={Folder} label="File Manager" active={pathname === "/documents"} />
        </nav>
      </SheetContent>
    </Sheet>
  </div>

  {/* Konten Header Utama */}
  <div className="flex items-center justify-between w-full">
    {/* Search Bar */}
    <form className="hidden md:block flex-1 md:flex-initial">
    </form>

    {/* Notifikasi dan Profil Picture */}
    <div className="flex items-center gap-4">

      {/* Profil Picture */}
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
          
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, icon: Icon, label, badge, active = false }) {
  return (
    <Link href={href}>
      <Button
        variant={active ? "secondary" : "ghost"}
        className="w-full justify-start"
      >
        <Icon className="mr-2 h-4 w-4" />
        {label}
        {badge && (
          <Badge className="ml-auto" variant="secondary">
            {badge}
          </Badge>
        )}
      </Button>
    </Link>
  )
}

function StatCard({ title, value, description, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status) {
  switch (status) {
    case "Active":
      return "default"
    case "Pending":
      return "warning"
    case "Closed":
      return "secondary"
    case "Urgent":
      return "destructive"
    default:
      return "outline"
  }
}

function getDeadlineVariant(daysLeft) {
  if (daysLeft === 0) return "destructive"
  if (daysLeft <= 3) return "warning"
  return "outline"
}

// Sample data
const recentCases = [
  {
    id: 1,
    number: "C-2023-0124",
    client: "PT Maju Bersama",
    type: "Corporate",
    status: "Active",
    deadline: "Mar 15, 2023",
  },
]

const recentDocuments = [
  {
    id: 1,
    name: "Contract Agreement - PT Maju Bersama.pdf",
    case: "C-2023-0124",
    type: "Contract",
    modified: "Mar 8, 2023",
  },
]

const activities = [
  {
    icon: <FileText className="h-4 w-4 text-primary" />,
    title: "Document Updated",
    description: "You updated 'Contract Agreement - PT Maju Bersama.pdf'",
    time: "2 hours ago",
  },
  {
    icon: <MessageSquare className="h-4 w-4 text-primary" />,
    title: "New Comment",
    description: "Ahmad Fauzi commented on case C-2023-0118",
    time: "5 hours ago",
  },
  {
    icon: <Calendar className="h-4 w-4 text-primary" />,
    title: "Meeting Scheduled",
    description: "Client meeting with Budi Santoso scheduled for tomorrow at 10:00 AM",
    time: "Yesterday",
  },
  {
    icon: <Users className="h-4 w-4 text-primary" />,
    title: "New Client",
    description: "PT Teknologi Maju was added as a new client",
    time: "2 days ago",
  },
]

const upcomingDeadlines = [
  {
    title: "File Court Response",
    case: "C-2023-0118",
    daysLeft: 2,
  },
  {
    title: "Contract Review",
    case: "C-2023-0124",
    daysLeft: 5,
  },
  {
    title: "Submit Patent Application",
    case: "C-2023-0097",
    daysLeft: 7,
  },
  {
    title: "Property Closing",
    case: "C-2023-0105",
    daysLeft: 10,
  },
  {
    title: "Partnership Agreement Signing",
    case: "C-2023-0112",
    daysLeft: 0,
  },
]

const caseProgress = [
  {
    title: "Corporate Restructuring",
    client: "PT Maju Bersama",
    progress: 75,
  },
  {
    title: "Litigation Case",
    client: "Budi Santoso",
    progress: 40,
  },
  {
    title: "Contract Negotiation",
    client: "CV Abadi Jaya",
    progress: 60,
  },
  {
    title: "Property Acquisition",
    client: "Siti Rahayu",
    progress: 90,
  },
]
