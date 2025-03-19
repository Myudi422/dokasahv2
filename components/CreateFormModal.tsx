"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

// Daftar opsi formulir dengan value dan label yang sesuai.
const formOptions = [
  { value: "pt_perorangan", label: "Pendirian PT Perorangan" },
  { value: "yayasan", label: "Pendirian Yayasan" },
  { value: "pt_umum", label: "Pendirian PT UMUM" },
  { value: "perkumpulan", label: "Pendirian Perkumpulan" },
  { value: "koperasi", label: "Pendirian Koperasi" },
  { value: "cv", label: "Pendirian CV" },
  { value: "figma", label: "Pendirian Figma" },
  { value: "npwp_pribadi", label: "Pembuatan NPWP PRIBADI" },
  { value: "npwp_badan", label: "Pembuatan NPWP Badan" },
  { value: "nib_pribadi", label: "Pembuatan NIB Pribadi" },
  { value: "nib_badan", label: "Pembuatan NIB Badan" }
];

// Komponen dropdown dengan fitur pencarian dan auto-scroll
function SearchableDropdown({ options, selected, onChange }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <button 
         type="button" 
         className="w-full px-3 py-2 border rounded-md text-left"
         onClick={() => setIsOpen(!isOpen)}
      >
         {selected ? options.find(option => option.value === selected)?.label : 'Pilih jenis formulir'}
      </button>
      {isOpen && (
         <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
           <input
             type="text"
             placeholder="Cari..."
             className="w-full px-3 py-2 border-b"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
           />
           <div className="max-h-60 overflow-auto">
             {filteredOptions.length === 0 ? (
               <div className="p-2 text-sm text-gray-500">Tidak ada hasil</div>
             ) : (
               filteredOptions.map((option) => (
                 <div
                   key={option.value}
                   className="p-2 hover:bg-gray-200 cursor-pointer"
                   onClick={() => {
                     onChange(option.value);
                     setIsOpen(false);
                     setQuery('');
                   }}
                 >
                   {option.label}
                 </div>
               ))
             )}
           </div>
         </div>
      )}
    </div>
  );
}

export default function CreateFormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [formType, setFormType] = useState('');
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
              <SearchableDropdown 
                options={formOptions} 
                selected={formType}
                onChange={(value) => setFormType(value)}
              />
            </div>
            <Button type="submit" disabled={isLoading || !formType} className="w-full">
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
