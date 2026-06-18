"use client";
import React, { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/components/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function FormAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthLoaded && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [isAuthLoaded, user, router, pathname]);

  if (!isAuthLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
