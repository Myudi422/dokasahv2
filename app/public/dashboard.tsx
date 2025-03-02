// frontend/pages/dashboard.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "../public/firebase.config";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold">Selamat Datang di Dashboard!</h1>
      <p className="mt-4">Anda berhasil login.</p>
    </div>
  );
}