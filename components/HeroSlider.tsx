'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_url: string | null;
  media_url: string | null;
  media_type: 'image' | 'video';
  [key: string]: any; 
}

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'fallback-1',
    title: 'Timeless',
    subtitle: 'Woven for every woman',
    cta_label: 'Explore Collection',
    cta_url: '/collections',
    media_url: '/img_2601.jpeg',
    media_type: 'image',
  }
];

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const activeSlides = slides && slides.length > 0 ? slides : FALLBACK_SLIDES;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Start the first animation trigger
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Auto rotate logic
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide((currentSlide + 1) % activeSlides.length);
    }, 7000); // Slower, more cinematic
    return () => clearInterval(timer);
  }, [activeSlides.length, currentSlide]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || activeSlides.length <= 1) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 1200); // 1.2s transition
  }, [isAnimating, activeSlides.length]);

  const nextSlide = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    goToSlide((currentSlide + 1) % activeSlides.length);
  }, [currentSlide, activeSlides.length, goToSlide]);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    goToSlide((currentSlide - 1 + activeSlides.length) % activeSlides.length);
  }, [currentSlide, activeSlides.length, goToSlide]);

  const slide = activeSlides[currentSlide];

  // If we split title by space, we can italicize the last word
  const splitTitle = slide.title ? slide.title.split(' ') : [];
  let mainTitle = '';
  let italicWord = '';
  if (splitTitle.length > 1) {
    italicWord = splitTitle.pop() || '';
    mainTitle = splitTitle.join(' ');
  } else {
    mainTitle = slide.title || '';
  }

  return (
    <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-samara-void">
      {/* BACKGROUNDS */}
      {activeSlides.map((s, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all duration-[1200ms] cubic-bezier(0.22, 0.61, 0.21, 1) ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {s.media_url ? (
              s.media_type === 'video' ? (
                <video
                  src={s.media_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className={`w-full h-full object-cover transition-transform duration-[1200ms] ${
                    hasMounted && isActive ? 'scale-100' : 'scale-110'
                  }`}
                />
              ) : (
                <div className={`w-full h-full overflow-hidden ${hasMounted ? '' : '[clip-path:inset(10%)]'} transition-[clip-path] duration-[1500ms] cubic-bezier(0.22, 0.61, 0.21, 1)`}>
                  <img
                    src={s.media_url}
                    alt={s.title}
                    className={`w-full h-full object-cover object-top transition-transform duration-[10000ms] ease-out ${
                      hasMounted && isActive ? 'scale-100' : 'scale-110'
                    }`}
                  />
                </div>
              )
            ) : (
              <div className="w-full h-full bg-samara-void flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-samara-gold/20" />
              </div>
            )}
            
            {/* Soft gradient overlay for text readability only at bottom center */}
            <div className="absolute inset-0 bg-gradient-to-t from-samara-void/80 via-transparent to-samara-void/30 pointer-events-none" />
          </div>
        );
      })}

      {/* TEXT CONTENT - Centered Editorial Layout */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end md:justify-center text-center pb-24 md:pb-0 px-6">
        
        {/* SMALL LOGO OR IDENTIFIER (Optional) */}
        <div className={`overflow-hidden mb-6 transition-all duration-[800ms] delay-300 ${hasMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="text-[10px] font-sans tracking-[0.4em] uppercase text-samara-gold">Samara</span>
        </div>

        {/* HERO TITLE */}
        <div className="overflow-hidden mb-6">
          <h1
            key={`title-${currentSlide}`}
            className={`font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[8rem] text-samara-ivory leading-[0.9] tracking-tight transition-all duration-[1000ms] cubic-bezier(0.22, 0.61, 0.21, 1) ${
              hasMounted && !isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[20%]'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            {mainTitle} <br className="hidden md:block" /><em className="italic font-light text-samara-gold pr-2">{italicWord}</em>
          </h1>
        </div>

        {/* SUBTITLE */}
        {slide.subtitle && (
          <div className="overflow-hidden mb-10 max-w-md mx-auto">
            <p
              key={`sub-${currentSlide}`}
              className={`text-sm md:text-base font-sans text-samara-ivory/80 tracking-wide leading-relaxed transition-all duration-[800ms] cubic-bezier(0.22, 0.61, 0.21, 1) ${
                hasMounted && !isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              {slide.subtitle}
            </p>
          </div>
        )}

        {/* CTA BUTTON */}
        {slide.cta_label && slide.cta_url && (
          <div
            key={`cta-${currentSlide}`}
            className={`transition-all duration-[800ms] cubic-bezier(0.22, 0.61, 0.21, 1) ${
              hasMounted && !isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '800ms' }}
          >
            <Link
              href={slide.cta_url}
              className="inline-block border-b border-samara-gold text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory hover:text-samara-gold pb-1 transition-colors"
            >
              {slide.cta_label}
            </Link>
          </div>
        )}

        {/* SCROLL INDICATOR */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-all duration-1000 delay-1000 ${hasMounted ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[9px] font-sans tracking-[0.3em] uppercase text-samara-ivory/40">Scroll</span>
          <div className="w-[1px] h-8 bg-samara-ivory/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-samara-gold animate-[scrollDown_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      {/* NAVIGATION INDICATORS - Side dots if more than 1 slide */}
      {activeSlides.length > 1 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-[2px] transition-all duration-500 ${
                index === currentSlide ? 'h-8 bg-samara-gold' : 'h-3 bg-samara-ivory/20 hover:bg-samara-ivory/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollDown {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
      `}} />
    </section>
  );
}