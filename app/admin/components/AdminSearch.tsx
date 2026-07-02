'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface AdminSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export default function AdminSearch({ searchQuery, onSearchChange, placeholder = 'Buscar usuarios, solicitudes, pagos, alertas...' }: AdminSearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/40" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/40 outline-none focus:border-[#D4AF37] transition"
      />
    </motion.div>
  );
}
