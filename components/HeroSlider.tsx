'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  image_url: string | null;
}

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load up to 4 active slides from Supabase
  useEffect(() => {
    const fetchSlides = async () => {
      const { data, error } = await supabase
        .from('home_hero_slides')
        .select(
          'id, title, subtitle, primary_cta_label, primary_cta_url, image_url, sort_order, is_active'
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(4);

      if (error) {
        console.error('Error loading hero slides:', error);
        return;
      }

      if (data) {
        setSlides(data as HeroSlide[]);
        setCurrentSlide(0);
      }
    };

    fetchSlides();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  if (slides.length === 0) {
    // Optional: show nothing or a placeholder hero while there are no slides
    return null;
  }

  const slide = slides[currentSlide];

  return (
    <section className="relative bg-[#000000] overflow-hidden py-20 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-12 lg:gap-24 items-center max-w-7xl mx-auto">
          {/* LEFT: text */}
          <div
            className="space-y-8 transition-opacity duration-700 ease-in-out lg:pl-24 lg:pt-20 lg:max-w-[540px]"
            key={slide.id}
          >
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#D4AF37] heading-line-height tracking-tight">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="text-lg md:text-xl text-[#F5F5F5] leading-[150%] max-w-xl">
                {slide.subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {slide.primary_cta_label && slide.primary_cta_url && (
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-6 text-lg transition-all duration-300 border-0 hover:scale-105"
                >
                  <Link href={slide.primary_cta_url}>{slide.primary_cta_label}</Link>
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT: image / video */}
          <div className="relative flex justify-center lg:justify-end lg:ml-20 lg:self-center">
            <div className="w-[420px] h-[560px] md:w-[480px] md:h-[600px] rounded-2xl bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/50 transition-all duration-500 flex flex-col items-center justify-center p-2 overflow-hidden">
              {slide.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <>
                  <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-[#D4AF37]/60" />
                  </div>
                  <p className="text-[#D4AF37]/70 font-serif text-xl font-semibold">
                    Hero Image
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* controls */}
        <div className="flex items-center justify-between mt-12 max-w-7xl mx-auto px-4">
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6 text-[#D4AF37]" />
          </button>

          <div className="flex gap-2">
            {slides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => {
                  if (!isAnimating) {
                    setIsAnimating(true);
                    setCurrentSlide(index);
                    setTimeout(() => setIsAnimating(false), 600);
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-[#D4AF37] shadow-md shadow-[#D4AF37]/50'
                    : 'w-2 bg-[#D4AF37]/30 hover:bg-[#D4AF37]/50'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            <ChevronRight className="h-6 w-6 text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </section>
  );
}
