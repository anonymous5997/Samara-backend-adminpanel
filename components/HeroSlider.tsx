'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

// Define interface for the slide data
export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_url: string | null;
  media_url: string | null;
  media_type: 'image' | 'video';
  // Allow flexible properties from DB
  [key: string]: any; 
}

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Auto rotate logic
  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent link navigation when clicking controls
    e?.stopPropagation();
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent link navigation when clicking controls
    e?.stopPropagation();
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  // Safe Fallback
  if (slides.length === 0) {
    return (
      <section className="h-[70vh] bg-black flex items-center justify-center">
        <div className="text-[#D4AF37] font-serif text-xl">
          Loading...
        </div>
      </section>
    );
  }

  const slide = slides[currentSlide];

  // Helper to render the inner content so we don't duplicate code
  const HeroContent = () => (
    <>
      {/* LEFT: Text */}
      <div
        className="space-y-8 transition-opacity duration-700 ease-in-out lg:pl-24 lg:pt-20 lg:max-w-[540px]"
      >
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#D4AF37] tracking-tight">
          {slide.title}
        </h1>

        {slide.subtitle && (
          <p className="text-lg md:text-xl text-[#F5F5F5] leading-[150%] max-w-xl">
            {slide.subtitle}
          </p>
        )}

        {slide.cta_label && slide.cta_url && (
          // We use a div here instead of a Link to avoid nested <a> tags if the parent is a Link
          // The parent Link handles the navigation
          <div className="inline-block">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-6 text-lg transition-all duration-300 hover:scale-105 pointer-events-none" // pointer-events-none allows clicks to pass through to parent Link
            >
              {slide.cta_label}
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT: Image / Video */}
      <div className="relative flex justify-center lg:justify-end lg:ml-20">
        {/* Added active:scale for touch feedback */}
        <div className="w-full max-w-[420px] h-[420px] sm:h-[520px] md:h-[600px] rounded-2xl bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30 overflow-hidden flex items-center justify-center transition-transform active:scale-[0.98] duration-200">

          {slide.media_url ? (
            slide.media_type === 'video' ? (
              <video
                src={slide.media_url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <img
                src={slide.media_url}
                alt={slide.title}
                className="w-full h-full object-cover rounded-2xl"
              />
            )
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-[#D4AF37]/60" />
              </div>
              <p className="text-[#D4AF37]/70 font-serif text-xl font-semibold">
                Hero Media
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );

  return (
    <section className="relative bg-[#000000] overflow-hidden pt-20 md:pt-24 lg:pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* ✅ FIX: Wrap grid in Link if URL exists */}
        {slide.cta_url ? (
          <Link href={slide.cta_url} className="block group">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-12 lg:gap-24 items-center max-w-7xl mx-auto cursor-pointer">
              <HeroContent />
            </div>
          </Link>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-12 lg:gap-24 items-center max-w-7xl mx-auto">
            <HeroContent />
          </div>
        )}

        {/* Controls - Added z-index to stay above the Link wrapper */}
        <div className="relative z-10 flex items-center justify-between mt-12 max-w-7xl mx-auto px-4">
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <ChevronLeft className="h-6 w-6 text-[#D4AF37]" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentSlide(index);
                    setTimeout(() => setIsAnimating(false), 600);
                  }
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-[#D4AF37]'
                    : 'w-2 bg-[#D4AF37]/30'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <ChevronRight className="h-6 w-6 text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </section>
  );
}