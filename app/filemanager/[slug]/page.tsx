"use client";

import React from "react";
import FileManagerPage from "../page"; // pastikan path ini sesuai dengan lokasi FileManagerPage

export default function FileManagerSlug() {
  // Karena FileManagerPage sudah menggunakan hook useParams untuk mengambil slug dari URL,
  // kita cukup me-render komponen tersebut.
  return <FileManagerPage />;
}
