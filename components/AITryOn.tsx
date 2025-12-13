'use client';

import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { AITryOnModal } from '@/components/AITryOnModal';

export function AITryOn() {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-b from-[#000000] via-[#050505] to-[#000000]">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#D4AF37] heading-line-height tracking-tight">
              AI Powered Try-On
            </h2>
            <p className="text-lg text-[#F5F5F5] leading-[150%] max-w-xl">
              See how the saree looks on you before you buy. Use your camera to virtually try on any saree from our collection instantly.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-6 text-lg hover:scale-105 transition-all duration-300"
            >
              <Camera className="mr-2 h-5 w-5" />
              Try With Camera
            </Button>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="w-[400px] h-[500px] rounded-2xl bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/50 transition-all duration-500 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center">
                <Camera className="h-10 w-10 text-[#D4AF37]/60" />
              </div>
              <p className="text-[#D4AF37]/70 font-serif text-xl font-semibold">Camera Ready</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

