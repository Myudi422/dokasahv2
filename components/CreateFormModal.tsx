"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function CreateFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [formType, setFormType] = useState('pt_perorangan');
  const [isLoading, setIsLoading] = useState(false);
  const [formLink, setFormLink] = useState(null);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('https://dev.dokasah.web.id/api/forms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, formType })
      });
        
      if (response.ok) {
        const data = await response.json();
        setFormLink(`https://dokasah.web.id/form/${data.link.replace(/^https?:\/\/[^/]+\/form\//, '')}`);
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

  const handleCopy = () => {
    if (formLink) {
      navigator.clipboard.writeText(formLink);
      alert("Link disalin ke clipboard!");
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
        {!formLink ? (
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
                <option value="npwp_pribadi">Pembuatan NPWP PRIBADI</option>
              </select>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Membuat...' : 'Buat Formulir'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">Form berhasil dibuat! Berikut linknya:</p>
            <div className="p-2 bg-gray-100 border rounded-md text-sm break-all">{formLink}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCopy}>Salin</Button>
              <Button variant="default" onClick={() => setIsOpen(false)}>OK</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}