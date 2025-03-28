"use client";
import React, { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/components/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function FormLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthLoaded && (!user || user.role !== "admin")) {
      router.replace("/dashboard");
    }
  }, [isAuthLoaded, user, router, pathname]);

  if (!isAuthLoaded) {
    return <div>Loading...</div>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
