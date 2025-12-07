'use client';

import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

export function AITryOn() {
  return (
    <section className="py-24 md:py-32 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tighter">
              AI Powered Try-On
            </h2>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              See how the saree looks on you before you buy. Use your camera to virtually try on any saree from our collection instantly. Experience the perfect blend of tradition and technology.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-6 text-lg hover:scale-105 transition-all duration-300"
            >
              <Camera className="mr-2 h-5 w-5" />
              Try With Camera
            </Button>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-lg border-2 border-[#D4AF37]/30 bg-gradient-to-br from-[#0b0b0b] to-black hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 mb-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Camera className="h-12 w-12 text-[#D4AF37]" />
              </div>
              <p className="text-[#D4AF37] font-serif text-2xl font-semibold">Camera Ready</p>
              <p className="text-gray-400 text-center mt-3">
                Click the button to start your virtual try-on experience
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
