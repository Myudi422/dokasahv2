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
      fetch("http://localhost:3001/api/protected", {
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
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-full pl-8 bg-background" />
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
          <NavItem href="/cases" icon={FileText} label="Cases" badge="12" active={pathname === "/cases"} />
          <NavItem href="/documents" icon={Folder} label="Documents" active={pathname === "/documents"} />
          <NavItem href="/calendar" icon={Calendar} label="Calendar" active={pathname === "/calendar"} />
          <NavItem href="/clients" icon={Users} label="Clients" active={pathname === "/clients"} />
          <NavItem href="/messages" icon={MessageSquare} label="Messages" badge="5" active={pathname === "/messages"} />
          <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={pathname === "/analytics"} />
          <NavItem href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} />
        </nav>
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john.doe@example.com</p>
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
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
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
          <Gavel className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Dokasah Legal</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={pathname === "/dashboard"} />
          <NavItem href="/cases" icon={FileText} label="Cases" badge="12" active={pathname === "/cases"} />
          <NavItem href="/documents" icon={Folder} label="Documents" active={pathname === "/documents"} />
          <NavItem href="/calendar" icon={Calendar} label="Calendar" active={pathname === "/calendar"} />
          <NavItem href="/clients" icon={Users} label="Clients" active={pathname === "/clients"} />
          <NavItem href="/messages" icon={MessageSquare} label="Messages" badge="5" active={pathname === "/messages"} />
          <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={pathname === "/analytics"} />
          <NavItem href="/settings" icon={Settings} label="Settings" active={pathname === "/settings"} />
        </nav>
      </SheetContent>
    </Sheet>
  </div>

  {/* Konten Header Utama */}
  <div className="flex items-center justify-between w-full">
    {/* Search Bar */}
    <form className="hidden md:block flex-1 md:flex-initial">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search cases, documents..."
          className="pl-8 md:w-[200px] lg:w-[300px]"
        />
      </div>
    </form>

    {/* Notifikasi dan Profil Picture */}
    <div className="flex items-center gap-4">

      {/* Profil Picture */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
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
          <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Salam Hangat 🙌, {user?.name}</p>
              </div>
              <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
          <CreateFormModal />
      )}
              </div>
            </div>
            <div>
    </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Formulir Pending"
                value="2"
                description="Formulir yang belum diisi, wajib followup"
                icon={<FileArchive className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Formulir Selesai"
                value="2"
                description="Formulir yang sudah di submit, wajib dicek"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              />
              
              <StatCard
                title="Dalam Proses"
                value="2"
                description="Berkas dalam tahap proses"
                icon={<LoaderIcon className="h-4 w-4 text-muted-foreground" />}
              />
              <StatCard
                title="Review"
                value="8"
                description="Followup client, untuk menyelesaikan"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="cases" className="space-y-4">
              <TabsList>
                <TabsTrigger value="cases">Formulir Terkini</TabsTrigger>
                <TabsTrigger value="documents">Recent Documents</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cases" className="space-y-4">
                <Card>
                  <CardHeader className="px-6">
                    <CardTitle>Recent Cases</CardTitle>
                    <CardDescription>You have 24 active cases</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case Number</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead className="hidden md:table-cell">Type</TableHead>
                          <TableHead className="hidden md:table-cell">Status</TableHead>
                          <TableHead className="hidden md:table-cell">Deadline</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentCases.map((caseItem) => (
                          <TableRow key={caseItem.id}>
                            <TableCell className="font-medium">{caseItem.number}</TableCell>
                            <TableCell>{caseItem.client}</TableCell>
                            <TableCell className="hidden md:table-cell">{caseItem.type}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant={getStatusVariant(caseItem.status)}>{caseItem.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{caseItem.deadline}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View details</DropdownMenuItem>
                                  <DropdownMenuItem>Edit case</DropdownMenuItem>
                                  <DropdownMenuItem>Add document</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline">Previous</Button>
                    <Button variant="outline">Next</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader className="px-6">
                    <CardTitle>Recent Documents</CardTitle>
                    <CardDescription>You have 42 documents</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Name</TableHead>
                          <TableHead className="hidden md:table-cell">Case</TableHead>
                          <TableHead className="hidden md:table-cell">Type</TableHead>
                          <TableHead className="hidden md:table-cell">Date Modified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{doc.case}</TableCell>
                            <TableCell className="hidden md:table-cell">{doc.type}</TableCell>
                            <TableCell className="hidden md:table-cell">{doc.modified}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View document</DropdownMenuItem>
                                  <DropdownMenuItem>Download</DropdownMenuItem>
                                  <DropdownMenuItem>Share</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline">Previous</Button>
                    <Button variant="outline">Next</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="activities" className="space-y-4">
                <Card>
                  <CardHeader className="px-6">
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Your recent actions and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="mt-1 rounded-full bg-primary/10 p-2">
                            {activity.icon}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Your next 5 deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground">Case: {deadline.case}</p>
                        </div>
                        <div className="text-sm font-medium">
                          <Badge variant={getDeadlineVariant(deadline.daysLeft)}>
                            {deadline.daysLeft === 0 ? "Today" : `${deadline.daysLeft} days`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Case Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Case Progress</CardTitle>
                  <CardDescription>Your active cases progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {caseProgress.map((caseItem, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{caseItem.title}</p>
                            <p className="text-xs text-muted-foreground">{caseItem.client}</p>
                          </div>
                          <div className="text-sm font-medium">{caseItem.progress}%</div>
                        </div>
                        <Progress value={caseItem.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
