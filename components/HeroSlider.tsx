'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface HeroSlide {
  title: string;
  subtitle: string;
  primaryCta: { label: string; url: string };
  secondaryCta: { label: string; url: string };
}

const slides: HeroSlide[] = [
  {
    title: 'Woven For Every Woman',
    subtitle: 'Discover our premium collection of handcrafted sarees that celebrate elegance and tradition with modern grace',
    primaryCta: { label: 'Shop The Edit', url: '/sarees' },
    secondaryCta: { label: 'View All', url: '/collections' },
  },
  {
    title: 'Festive Elegance',
    subtitle: 'Celebrate every moment with our exclusive festive collection designed for the modern woman',
    primaryCta: { label: 'Shop The Edit', url: '/festive-edit' },
    secondaryCta: { label: 'View All', url: '/sarees' },
  },
  {
    title: 'Contemporary Grace',
    subtitle: 'Modern designs that honor traditional craftsmanship, perfect for today\'s confident woman',
    primaryCta: { label: 'Shop The Edit', url: '/sarees' },
    secondaryCta: { label: 'View All', url: '/collections' },
  },
  {
    title: 'Premium Collections',
    subtitle: 'Exquisite handpicked sarees crafted with the finest fabrics and intricate detailing',
    primaryCta: { label: 'Shop The Edit', url: '/collections' },
    secondaryCta: { label: 'View All', url: '/sarees' },
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative bg-black overflow-hidden py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          <div className="space-y-8 transition-opacity duration-700 ease-in-out" key={currentSlide}>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tight leading-tight">
              {slide.title}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-xl">
              {slide.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-6 text-lg transition-all duration-300 border-0 hover:scale-105 rounded-full"
              >
                <Link href={slide.primaryCta.url}>
                  {slide.primaryCta.label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10 hover:shadow-lg hover:shadow-[#D4AF37]/30 text-[#D4AF37] font-bold px-10 py-6 text-lg transition-all duration-300 hover:scale-105 rounded-full"
              >
                <Link href={slide.secondaryCta.url}>
                  {slide.secondaryCta.label}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-black border-2 border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:shadow-[#D4AF37]/40 transition-all duration-500 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-[#D4AF37]/60" />
              </div>
              <p className="text-[#D4AF37]/60 font-serif text-xl font-semibold">Hero Image</p>
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-black/80 backdrop-blur-sm border-2 border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:scale-110 transition-all duration-300 flex items-center justify-center disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20"
          >
            <ChevronLeft className="h-7 w-7 text-[#D4AF37]" />
          </button>
          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-full bg-black/80 backdrop-blur-sm border-2 border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:scale-110 transition-all duration-300 flex items-center justify-center disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20"
          >
            <ChevronRight className="h-7 w-7 text-[#D4AF37]" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentSlide(index);
                    setTimeout(() => setIsAnimating(false), 600);
                  }
                }}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-14 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50'
                    : 'w-2.5 bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
