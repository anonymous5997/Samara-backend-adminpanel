import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';
import { HOME_COPY } from '@/config/homepage';
import { getSiteImage } from '@/lib/site-images';
import { SiteImageBackdrop } from '@/components/site-images/SiteImageBackdrop';

/** Original ornament: a fine diamond between two small lozenges and hairlines. */
function Ornament() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 20"
      className="h-5 w-40 text-samara-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
    >
      <line x1="0" y1="10" x2="62" y2="10" opacity="0.5" />
      <line x1="98" y1="10" x2="160" y2="10" opacity="0.5" />
      <path d="M80 1 L89 10 L80 19 L71 10 Z" />
      <path d="M64 10 L67 7 L70 10 L67 13 Z" opacity="0.7" />
      <path d="M90 10 L93 7 L96 10 L93 13 Z" opacity="0.7" />
      <circle cx="80" cy="10" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Quiet closing line before the footer. Optional background photo from the
 * `closing` Site Images slot, under a strong dark overlay.
 */
export async function ClosingStatement() {
  const { lead, accent } = HOME_COPY.closing;
  const image = await getSiteImage('closing');

  return (
    <section
      aria-label="Closing statement"
      className={cn(
        'bg-gradient-to-b from-samara-forest to-samara-black py-[clamp(6rem,14vw,13rem)]',
        image && 'relative overflow-hidden',
      )}
    >
      {image && (
        <SiteImageBackdrop
          image={image}
          sizes="100vw"
          overlayClassName="bg-gradient-to-b from-samara-forest/85 via-samara-black/75 to-samara-black/95"
        />
      )}
      <div className={cn('sm-container flex flex-col items-center text-center', image && 'relative')}>
        <Reveal variant="fade">
          <Ornament />
        </Reveal>
        <Reveal variant="mask" delay={120} className="mt-10 md:mt-14">
          <p className="sm-display-l font-light">
            {lead} <span className="sm-accent">{accent}</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
