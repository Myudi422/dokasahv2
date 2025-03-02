"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/AuthContext'; // Import useAuth
import { useRouter } from "next/navigation"; // Gunakan next/navigation

export default function CreateFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [formType, setFormType] = useState('pt_perorangan');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth(); // Ambil token dari context
  const router = useRouter(); // Panggil useRouter di dalam komponen

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('https://improved-lamp-vq6j9gjvjpxfp6jx-3001.app.github.dev/api/forms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Tambahkan token di header
        },
        body: JSON.stringify({ email, formType })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsOpen(false);
        alert(`Form berhasil dibuat!\nLink: ${data.link}`);
        router.push(data.link); // Pastikan router sudah tersedia di client
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat membuat form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Buat Formulir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Formulir Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm">Email Pengguna</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm">Jenis Formulir</label>
            <select 
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="pt_perorangan">PT Perorangan</option>
            </select>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Membuat...' : 'Buat Formulir'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
