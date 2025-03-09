import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";

export default function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Hanya lakukan fetch jika ada query
    if (!query) {
      setSuggestions([]);
      return;
    }
    const fetchLocations = async () => {
      try {
        const res = await fetch(`https://api-pos-roan.vercel.app/search/?q=${query}`);
        const json = await res.json();
        // Pastikan respons API sesuai (misalnya: json.data)
        setSuggestions(json.data || []);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    // Gunakan debounce agar tidak fetch setiap karakter yang diketik
    const debounce = setTimeout(() => {
      fetchLocations();
    }, 500);

    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="relative">
      <Input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari lokasi..."
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((loc) => (
            <li
              key={`${loc.code}-${loc.village}`}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                // Saat lokasi dipilih, panggil callback onSelect dengan data lokasi
                onSelect(loc);
                // Set query dengan tampilan lokasi yang terpilih
                setQuery(`${loc.village}, ${loc.district}, ${loc.regency}, ${loc.province}`);
                setSuggestions([]);
              }}
            >
              {loc.village}, {loc.district}, {loc.regency}, {loc.province}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
