'use client';

import { Camera } from 'lucide-react';
import AITryOnModal from '@/components/AITryOnModal';

interface AITryOnButtonProps {
  onClick: () => void;
}

export function AITryOnButton({ onClick }: AITryOnButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group/btn"
      aria-label="AI Try-On"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] rounded-full blur-xl opacity-60 group-hover/btn:opacity-100 animate-pulse"></div>

        <div className="relative w-20 h-20 bg-gradient-to-br from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] rounded-full flex items-center justify-center shadow-2xl shadow-[#D4AF37]/50 border-4 border-black/20 group-hover/btn:scale-110 transition-transform duration-300">
          <Camera className="h-9 w-9 text-black" />
        </div>

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
          <div className="bg-black/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#D4AF37]/50">
            <p className="text-[#D4AF37] font-semibold text-sm">AI Try-On</p>
          </div>
        </div>
      </div>
    </button>
  );
}

