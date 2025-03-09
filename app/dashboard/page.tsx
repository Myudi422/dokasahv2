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
  MoreHorizontal,
  FileArchive,
  LoaderIcon,
  Users,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import CreateFormModal from "@/components/CreateFormModal"

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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth, useAuthRedirect } from "@/components/AuthContext"

export default function DashboardPage() {
  const { user, isAuthLoaded, token, setToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [recentCases, setRecentCases] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 7;
  
  // State untuk sorting
  const [sortConfig, setSortConfig] = React.useState({ key: '', direction: 'ascending' });

  const [statusCounts, setStatusCounts] = React.useState({
    pending: 0,
    selesai: 0,
    proses: 0,
    review: 0,
  });
  
  // Buat fungsi fetchStatusCounts dengan useCallback agar bisa dipanggil ulang
const fetchStatusCounts = React.useCallback(async () => {
  if (!token) return;
  try {
    const response = await fetch("https://dev.dokasah.web.id/api/dashboard/status-count", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Gagal mengambil data status");
    }
    const data = await response.json();
    setStatusCounts(data.counts);
  } catch (error) {
    console.error("Error:", error);
  }
}, [token]);
  

  // Redirect ke halaman login bila token tidak ada
  useAuthRedirect();


React.useEffect(() => {
  fetchStatusCounts();
}, [fetchStatusCounts]);

const handleChangeStatus = async (slug, newStatus) => {
  try {
    const res = await fetch(`https://dev.dokasah.web.id/api/forms/${slug}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      // Refresh data formulir setelah update status
      fetchForms();
      // Refresh dashboard status count
      fetchStatusCounts();
    } else {
      console.error('Gagal mengupdate status');
    }
  } catch (error) {
    console.error(error);
  }
};
  

  // Fungsi untuk fetch data formulir
  const fetchForms = React.useCallback(async () => {
    try {
      const res = await fetch('https://dev.dokasah.web.id/api/dashboard/forms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Transformasi data agar sesuai dengan sample dan menambahkan properti updatedAt untuk sorting
        const transformedData = data.forms.map((item) => ({
          id: item.id,
          number: `F-${item.id.toString().padStart(4, '0')}`, // misalnya F-0001
          client: item.assigned_email,
          type: item.form_type,
          status: item.status || 'Not Submitted',
          deadline: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A',
          updatedAt: item.updated_at ? new Date(item.updated_at) : null,
          slug: item.slug
        }));
        setRecentCases(transformedData);
        setCurrentPage(1); // reset pagination jika data baru didapat
      } else {
        console.error('Gagal mengambil data formulir');
      }
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  // Auto refresh: fetch data saat mount dan tiap 30 detik
  React.useEffect(() => {
    if (token) {
      fetchForms();
      const interval = setInterval(fetchForms, 30000); // refresh tiap 30 detik
      return () => clearInterval(interval);
    }
  }, [token, fetchForms]);

  // Refresh data saat navigasi ke dashboard (misalnya berpindah tab di sidebar)
  React.useEffect(() => {
    if (token) {
      fetchForms();
    }
  }, [pathname, token, fetchForms]);

  // Mengurutkan data berdasarkan sortConfig menggunakan useMemo
  const sortedCases = React.useMemo(() => {
    let sortableItems = [...recentCases];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Tangani nilai null (misalnya pada tanggal)
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [recentCases, sortConfig]);

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

  // Pagination: hitung data yang akan ditampilkan dari data yang sudah diurutkan
  const totalPages = Math.ceil(sortedCases.length / itemsPerPage);
  const paginatedCases = sortedCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // Fungsi untuk navigasi ke halaman detail form berdasarkan slug
  const handleViewDetail = (slug) => {
    router.push(`/form/${slug}`);
  };

  // Fungsi handleSort untuk mengubah state sortConfig
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
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
          <NavItem href="/filemanager" icon={Folder} label="File Manager" active={pathname === "/filemanager"} />
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
          {/* Mobile Menu Hamburger */}
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
                  <NavItem href="/filemanager" icon={Folder} label="File Manager" active={pathname === "/filemanager"} />
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Header Content */}
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Salam Hangat 🙌, {user?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === 'admin' && <CreateFormModal />}
              </div>
            </div>

            {/* Overview Cards */}
            {user?.role === 'admin' && 
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Formulir Pending"
          value={statusCounts.pending}
          description="Formulir yang belum diisi, wajib follow-up"
          icon={<FileArchive className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Formulir Selesai"
          value={statusCounts.selesai}
          description="Formulir yang sudah di-submit, wajib dicek"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Dalam Proses"
          value={statusCounts.proses}
          description="Berkas dalam tahap proses"
          icon={<LoaderIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Review"
          value={statusCounts.review}
          description="Follow-up client, untuk menyelesaikan"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
              </div>
            }

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
                    <CardTitle>Formulir terkini</CardTitle>
                    <CardDescription>Terlampir formulir yang tersedia.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => handleSort('id')} className="cursor-pointer select-none">
                            Id {sortConfig.key === 'id' && (sortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                          </TableHead>
                          <TableHead onClick={() => handleSort('client')} className="cursor-pointer select-none">
                            Email Client {sortConfig.key === 'client' && (sortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                          </TableHead>
                          <TableHead onClick={() => handleSort('type')} className="hidden md:table-cell cursor-pointer select-none">
                            Tipe {sortConfig.key === 'type' && (sortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                          </TableHead>
                          <TableHead onClick={() => handleSort('status')} className="hidden md:table-cell cursor-pointer select-none">
                            Status {sortConfig.key === 'status' && (sortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                          </TableHead>
                          <TableHead onClick={() => handleSort('updatedAt')} className="hidden md:table-cell cursor-pointer select-none">
                            Update terbaru {sortConfig.key === 'updatedAt' && (sortConfig.direction === 'ascending' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCases.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">tidak ada formulir</TableCell>
                          </TableRow>
                        ) : (
                          paginatedCases.map((caseItem) => (
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
      <span className="sr-only">aksi</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleViewDetail(caseItem.slug)}>
      Lihat Detail
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push(`/filemanager/${caseItem.slug}`)}>
  Tambahkan Dokumen
</DropdownMenuItem>
    {/* Opsi status untuk admin */}
    {user?.role === 'admin' && (
      <>
        <DropdownMenuSeparator />
        {["draft", "submitted", "proses", "review", "selesai"].map((s) => {
          if (s === caseItem.status.toLowerCase()) return null;
          return (
            <DropdownMenuItem key={s} onClick={() => handleChangeStatus(caseItem.slug, s)}>
              Ganti ke {s.charAt(0).toUpperCase() + s.slice(1)}
            </DropdownMenuItem>
          );
        })}
      </>
    )}
  </DropdownMenuContent>
</DropdownMenu>

                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t p-4">
                    <Button variant="outline" onClick={handlePrev} disabled={currentPage === 1}>
                      Previous
                    </Button>
                    <Button variant="outline" onClick={handleNext} disabled={currentPage === totalPages || totalPages === 0}>
                      Next
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, badge, active = false }) {
  return (
    <Link href={href}>
      <Button variant={active ? "secondary" : "ghost"} className="w-full justify-start">
        <Icon className="mr-2 h-4 w-4" />
        {label}
        {badge && <Badge className="ml-auto" variant="secondary">{badge}</Badge>}
      </Button>
    </Link>
  );
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
  );
}

function getStatusVariant(status) {
  switch (status.toLowerCase()) {
    case "draft":
      return "draft";
    case "submitted":
      return "submitted";
    case "proses":
      return "proses";
    case "review":
      return "review";
    case "selesai":
      return "selesai";
    default:
      return "outline";
  }
}
