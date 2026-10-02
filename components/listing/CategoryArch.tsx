import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ARCH = 'rounded-t-[999px]';

interface CategoryArchProps {
  href: string;
  name: string;
  description?: string | null;
  index: number;
  /** categories.image_url (set in Admin → Categories); ornament when null. */
  imageUrl?: string | null;
}

/**
 * Arch-framed index card — the same language as the homepage
 * CollectionsArches (components/home/CollectionsArches.tsx): thin gold
 * outline arch, forest fill, typographic numeral ornament (no imagery is
 * queried for categories on /collections), name + one line + arrow.
 */
export function CategoryArch({ href, name, description, index, imageUrl }: CategoryArchProps) {
  const numeral = String(index + 1).padStart(2, '0');

  return (
    <Link
      href={href}
      className={cn(
        'group relative block aspect-[3/4.4] p-2 focus-visible:outline-none md:p-2.5',
        ARCH,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 border border-samara-gold/50 transition-colors duration-700 ease-editorial group-hover:border-samara-gold group-focus-visible:border-samara-gold',
          ARCH,
        )}
      />

      <span className={cn('relative block h-full w-full overflow-hidden', ARCH)}>
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,#22362A_0%,#1E3024_48%,#1B2A1F_100%)]"
        >
          <span className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_50%_28%,rgba(243,235,219,0.07),transparent_65%)]" />
          <span className={cn('absolute inset-3 border border-samara-gold/20 md:inset-4', ARCH)} />
          <span className={cn('absolute inset-[22px] border border-samara-gold/[0.08] md:inset-[26px]', ARCH)} />
          <span className="absolute inset-x-0 bottom-[40%] top-[10%] flex flex-col items-center justify-center">
            <span className="font-serif text-[clamp(6rem,10vw,9.5rem)] font-light italic leading-none text-samara-gold/[0.17] transition-colors duration-1000 ease-editorial group-hover:text-samara-gold/30">
              {numeral}
            </span>
            <span className="mt-4 h-8 w-px bg-samara-gold/30 md:h-10" />
          </span>
        </span>

        {imageUrl && (
          <span aria-hidden className="sm-zoom absolute inset-0">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          </span>
        )}

        <span
          aria-hidden
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent',
            imageUrl ? 'h-2/3 from-samara-black/[0.85]' : 'h-1/2 from-samara-black/40',
          )}
        />

        <span className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 md:p-7">
          <span className="font-serif text-[clamp(1.5rem,2.2vw,2rem)] font-normal uppercase leading-tight tracking-[0.06em] text-samara-ivory">
            {name}
          </span>
          {description && (
            <span className="mt-2 line-clamp-2 block w-full font-sans text-[0.8125rem] leading-relaxed text-samara-mute">
              {description}
            </span>
          )}
          <span className="mt-6 flex h-11 w-11 items-center justify-center rounded-full border border-samara-ivory/40 bg-samara-black/20 text-samara-ivory transition-colors duration-300 ease-editorial group-hover:border-samara-gold group-hover:bg-samara-gold group-hover:text-samara-forest">
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} />
          </span>
        </span>
      </span>
    </Link>
  );
}
