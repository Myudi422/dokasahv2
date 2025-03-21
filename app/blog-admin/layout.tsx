// app/form/layout.tsx
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";

export default function FormLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
