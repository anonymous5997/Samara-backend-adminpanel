'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  title: string;
  subtitle: string;
  primaryCta: { label: string; url: string };
  secondaryCta: { label: string; url: string };
  backgroundImage: string;
}

const slides: HeroSlide[] = [
  {
    title: 'Timeless Elegance',
    subtitle: 'Discover handcrafted sarees that blend tradition with modern sophistication',
    primaryCta: { label: 'Shop Now', url: '/sarees' },
    secondaryCta: { label: 'View Collections', url: '/collections' },
    backgroundImage: 'https://images.pexels.com/photos/8533402/pexels-photo-8533402.jpeg?auto=compress&cs=tinysrgb&w=1920',
  },
  {
    title: 'Festive Collection',
    subtitle: 'Celebrate special moments with our curated festive sarees',
    primaryCta: { label: 'Explore', url: '/festive-edit' },
    secondaryCta: { label: 'View All', url: '/sarees' },
    backgroundImage: 'https://images.pexels.com/photos/10214695/pexels-photo-10214695.jpeg?auto=compress&cs=tinysrgb&w=1920',
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
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${slide.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />

      <div className="relative z-20 container mx-auto px-4 md:px-8 h-full flex items-center">
        <div className="max-w-4xl animate-fade-in">
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tighter leading-tight drop-shadow-2xl">
            {slide.title}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl mb-12 text-gray-100 leading-relaxed max-w-2xl drop-shadow-lg">
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-7 text-lg transition-all duration-300 border-0 hover:scale-105"
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
              className="border-2 border-[#D4AF37] bg-black/40 backdrop-blur-sm hover:bg-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/40 text-[#D4AF37] font-bold px-10 py-7 text-lg transition-all duration-300 hover:scale-105"
            >
              <Link href={slide.secondaryCta.url}>
                {slide.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] hover:scale-110 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6 text-[#D4AF37]" />
          </button>
          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] hover:scale-110 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            <ChevronRight className="h-6 w-6 text-[#D4AF37]" />
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
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-12 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
