// frontend/pages/login.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { auth, provider, signInWithPopup } from "../public/firebase.config";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Kirim data pengguna ke backend
      const response = await fetch("http://localhost:3001/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
        }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError("Gagal menyimpan data pengguna.");
      }
    } catch (err) {
      setError("Login gagal. Silakan coba lagi.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Login dengan Google
        </button>
      </div>
    </div>
  );
}