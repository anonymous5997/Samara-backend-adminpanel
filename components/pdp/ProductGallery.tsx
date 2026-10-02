'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductLightbox } from './ProductLightbox';
import { isOptimizable } from './pdp-utils';

interface GalleryImage {
  id: string;
  image_url: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Already-computed highlight lines, shown as a caption over the second photo. */
  highlights: string[];
}

function Photo({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isOptimizable(src)}
      className="object-cover"
    />
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-samara-black/90 via-samara-black/60 to-transparent px-5 pb-6 pt-24 sm:px-8 sm:pb-8">
      <p className="sm-eyebrow text-samara-gold">Key Highlights</p>
      <ul className="mt-4 space-y-2.5">
        {items.slice(0, 4).map((text, idx) => (
          <li key={idx} className="flex items-start gap-3 font-sans text-[0.8125rem] leading-snug text-samara-ivory">
            <span aria-hidden className="mt-[0.6em] h-px w-4 shrink-0 bg-samara-gold" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ name }: { name: string }) {
  return (
    <div className="relative flex aspect-[4/5] w-full items-center justify-center bg-samara-char">
      <span className="font-serif text-7xl font-light text-samara-mute/60">{name.trim().charAt(0).toUpperCase()}</span>
      <span className="sr-only">No photo available</span>
    </div>
  );
}

/**
 * Desktop (lg+): an editorial stack — the first photo full width, the rest in
 * pairs. Mobile/tablet: a full-bleed swipe gallery with a 1 / N counter.
 * Any photo opens the full-screen viewer.
 */
export function ProductGallery({ images, productName, selectedIndex, onSelect, highlights }: ProductGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const trackRef = useRef<HTMLUListElement | null>(null);
  const count = images.length;
  const showHighlights = highlights.length > 0 && count > 1;

  const open = (index: number) => {
    onSelect(index);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Mobile swipe → keep the selected photo in step (as the old thumbnails did).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const slide = el.firstElementChild as HTMLElement | null;
        if (!slide) return;
        const i = Math.round(el.scrollLeft / slide.getBoundingClientRect().width);
        const next = Math.min(count - 1, Math.max(0, i));
        if (next !== selectedIndex) onSelect(next);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [count, selectedIndex, onSelect]);

  if (count === 0) return <Empty name={productName} />;

  const label = (i: number) => `${productName}, photo ${i + 1} of ${count}`;
  const current = Math.min(selectedIndex, count - 1);

  return (
    <>
      {/* Mobile + tablet: swipe gallery */}
      <div className="relative -mx-[var(--sm-gutter)] lg:hidden">
        <ul
          ref={trackRef}
          aria-label={`${productName} photos`}
          className={cn(
            'flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            count === 1 && 'sm:justify-center sm:bg-samara-char/60',
          )}
        >
          {images.map((image, i) => (
            <li key={image.id} className="relative w-full shrink-0 snap-start sm:w-[62%]">
              <button
                type="button"
                onClick={() => open(i)}
                aria-label={`Open ${label(i)} full screen`}
                className="relative block aspect-[4/5] w-full bg-samara-char focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-4px] focus-visible:outline-samara-gold"
              >
                <Photo src={image.image_url} alt={label(i)} sizes="(min-width: 640px) 62vw, 100vw" priority={i === 0} />
                {showHighlights && i === 1 && <Highlights items={highlights} />}
              </button>
            </li>
          ))}
        </ul>
        {count > 1 && (
          <p
            aria-live="polite"
            className="pointer-events-none absolute bottom-4 right-[var(--sm-gutter)] bg-samara-black/70 px-3 py-1.5 font-sans text-[0.6875rem] tabular-nums tracking-[0.18em] text-samara-ivory"
          >
            {current + 1} / {count}
          </p>
        )}
      </div>

      {/* Desktop: editorial stack */}
      <ul aria-label={`${productName} photos`} className="hidden grid-cols-2 gap-3 lg:grid">
        {images.map((image, i) => {
          const wide = i === 0 || (i === count - 1 && (count - 1) % 2 === 1);
          return (
            <li key={image.id} className={cn(wide && 'col-span-2')}>
              <button
                type="button"
                onClick={() => open(i)}
                aria-label={`Open ${label(i)} full screen`}
                className="group relative block aspect-[4/5] w-full cursor-zoom-in bg-samara-char focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold"
              >
                <span className="sm-zoom absolute inset-0">
                  <Photo
                    src={image.image_url}
                    alt={label(i)}
                    sizes={wide ? '(min-width: 1600px) 900px, 56vw' : '(min-width: 1600px) 450px, 28vw'}
                    priority={i === 0}
                  />
                </span>
                {showHighlights && i === 1 && <Highlights items={highlights} />}
                <span
                  aria-hidden
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-samara-black/60 text-samara-ivory opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.25} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ProductLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        productName={productName}
      />
    </>
  );
}
