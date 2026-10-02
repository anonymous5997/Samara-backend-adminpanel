import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';
import type { SiteImage } from '@/lib/site-images/slots';
import { HEADER_BAND_OVERLAY, SiteImageBackdrop } from '@/components/site-images/SiteImageBackdrop';

interface CatalogHeaderProps {
  eyebrow: string;
  /** Title with the italic accent already marked up (see AccentTitle). */
  title: ReactNode;
  intro?: ReactNode;
  /**
   * Optional full-bleed photo behind the title (Admin → Site Images). With an
   * image the band gets a dark forest gradient; without one it is unchanged.
   */
  image?: SiteImage | null;
  className?: string;
  children?: ReactNode;
}

/** Editorial page band: eyebrow, large serif title, one muted line. */
export function CatalogHeader({ eyebrow, title, intro, image, className, children }: CatalogHeaderProps) {
  return (
    <section
      className={cn('border-b border-samara-line', image && 'relative overflow-hidden', className)}
    >
      {image && (
        <SiteImageBackdrop image={image} sizes="100vw" priority overlayClassName={HEADER_BAND_OVERLAY} />
      )}
      <div className={cn('sm-container pb-10 pt-12 md:pb-14 md:pt-20 lg:pb-16 lg:pt-24', image && 'relative')}>
        <Reveal className="lg:flex lg:items-end lg:justify-between lg:gap-16">
          <div className="min-w-0">
            <p className="sm-eyebrow flex items-center gap-4">
              {eyebrow}
              <span aria-hidden className="h-px w-10 bg-samara-mute/50" />
            </p>
            <h1 className="sm-display-l mt-5 !font-normal !tracking-[-0.015em] md:mt-6">{title}</h1>
          </div>
          {intro && <p className="sm-body mt-5 max-w-md lg:mt-0 lg:max-w-sm lg:pb-2">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

/** Sets the last word of a title in the gold italic accent. */
export function AccentTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <span className="sm-accent">{text}</span>;
  const last = words.pop();
  return (
    <>
      {words.join(' ')} <span className="sm-accent">{last}</span>
    </>
  );
}
