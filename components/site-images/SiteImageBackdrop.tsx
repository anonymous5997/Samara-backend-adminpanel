import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { SiteImage } from '@/lib/site-images/slots';

interface SiteImageBackdropProps {
  image: SiteImage;
  /** next/image `sizes` for the rendered width of the backdrop. */
  sizes: string;
  /** Only for header bands above the fold. */
  priority?: boolean;
  /** Tailwind classes for the legibility overlay drawn over the photo. */
  overlayClassName: string;
  className?: string;
}

/**
 * Decorative full-bleed photo from a Site Images slot, with an overlay so the
 * copy on top stays legible. The parent must be `relative` (and usually
 * `overflow-hidden`); content above it needs `relative` to stack on top.
 */
export function SiteImageBackdrop({
  image,
  sizes,
  priority = false,
  overlayClassName,
  className,
}: SiteImageBackdropProps) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      <Image
        src={image.url}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className="object-cover"
      />
      <div className={cn('absolute inset-0', overlayClassName)} />
    </div>
  );
}

/** Dark forest gradient used behind page titles on listing/catalog headers. */
export const HEADER_BAND_OVERLAY =
  'bg-gradient-to-t from-samara-forest via-samara-forest/80 to-samara-black/50';
