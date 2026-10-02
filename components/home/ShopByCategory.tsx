import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';
import type { HomeCategory } from './types';

/**
 * When neighbouring panels resolve to the same product photo (today both
 * categories fall back to one product), vary the crop so they do not read
 * as duplicates. Same image, different framing — never a different image.
 */
interface Crop {
  position: string;
  scale: number;
  origin: string;
}
const ALT_CROPS: Crop[] = [
  { position: '50% 30%', scale: 1, origin: '50% 50%' },
  { position: '50% 85%', scale: 1.5, origin: '50% 82%' },
  { position: '40% 40%', scale: 1.3, origin: '30% 40%' },
  { position: '60% 60%', scale: 1.3, origin: '70% 60%' },
];

function categoryGrid(n: number) {
  if (n === 1) return 'lg:grid-cols-1';
  if (n === 2 || n === 4) return 'lg:grid-cols-2';
  return 'lg:grid-cols-3';
}

/** With 3 columns, stretch a trailing orphan so the grid has no hole. */
function lastSpan(n: number, i: number) {
  if (n <= 3 || n === 4 || i !== n - 1) return '';
  const rem = n % 3;
  if (rem === 1) return 'lg:col-span-3';
  if (rem === 2) return 'lg:col-span-2';
  return '';
}

/**
 * Shop by category — forest intro panel, then one large image panel per
 * real category. Category images are real product photos (imageIsProduct)
 * or the category's own image; null falls back to a typographic panel.
 */
export function ShopByCategory({ categories }: { categories: HomeCategory[] }) {
  if (categories.length === 0) return null;
  const n = categories.length;

  const seen = new Map<string, number>();
  const crops = categories.map((c) => {
    if (!c.imageUrl) return undefined;
    const count = seen.get(c.imageUrl) ?? 0;
    seen.set(c.imageUrl, count + 1);
    return count === 0 && !categories.some((o) => o !== c && o.imageUrl === c.imageUrl)
      ? undefined
      : ALT_CROPS[count % ALT_CROPS.length];
  });

  return (
    <section aria-labelledby="home-categories-title" className="bg-samara-black">
      <div className="grid grid-cols-1 gap-px bg-samara-line lg:grid-cols-4">
        <Reveal
          variant="fade"
          className="flex flex-col justify-center bg-samara-forest px-[var(--sm-gutter)] py-16 md:grid md:grid-cols-2 md:items-end md:gap-x-12 md:py-20 lg:flex lg:px-[clamp(1.5rem,2.6vw,3.5rem)] lg:py-16"
        >
          <div>
            <p className="sm-eyebrow mb-6 flex items-center gap-4 text-samara-gold">
              <span>Shop by weave</span>
              <span aria-hidden className="h-px w-10 bg-samara-gold/50" />
            </p>
            <h2
              id="home-categories-title"
              className="font-serif text-[clamp(2.25rem,6vw,3rem)] font-light uppercase leading-[1.04] tracking-[0.03em] lg:text-[clamp(1.75rem,2.55vw,2.875rem)] text-samara-ivory"
            >
              Explore
              <br />
              The Collection
            </h2>
          </div>
          <div>
            <p className="mt-6 max-w-[18rem] md:mt-0 lg:mt-6 font-serif text-xl font-light italic leading-snug text-samara-ivory/80 md:text-[1.375rem]">
              Heritage weaves for the modern woman.
            </p>
            <div className="mt-10 md:mt-8 lg:mt-10">
              <Link
                href="/shop"
                className="sm-btn bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
              >
                Shop all
                <ArrowRight className="h-4 w-4" strokeWidth={1.25} aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>

        <ul
          className={cn(
            'grid grid-cols-1 gap-px md:grid-cols-2 lg:col-span-3',
            categoryGrid(n),
            n === 1 && 'md:grid-cols-1',
          )}
        >
          {categories.map((c, i) => (
            <li
              key={c.id}
              className={cn(
                'bg-samara-forest',
                // odd count on tablet: let the last panel span both columns
                n > 1 && n % 2 === 1 && i === n - 1 && 'md:col-span-2 lg:col-span-1',
                lastSpan(n, i),
              )}
            >
              <Reveal variant="fade" delay={Math.min(i, 3) * 140} className="h-full">
                <CategoryPanel category={c} crop={crops[i]} wide={n === 1} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CategoryPanel({ category: c, crop, wide }: { category: HomeCategory; crop?: Crop; wide: boolean }) {
  return (
    <Link
      href={c.href}
      className={cn(
        'group sm-zoom relative block aspect-[4/5] h-full w-full overflow-hidden bg-samara-forest focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-samara-gold lg:aspect-auto lg:min-h-[clamp(520px,42vw,680px)]',
        wide && 'md:aspect-[16/9]',
      )}
    >
      {c.imageUrl ? (
        <>
          <span
            className="absolute inset-0"
            style={
              crop && crop.scale !== 1
                ? {
                    transform: `scale(${crop.scale})`,
                    transformOrigin: crop.origin,
                  }
                : undefined
            }
          >
            <Image
              src={c.imageUrl}
              alt={c.imageIsProduct ? `${c.name} — product photograph` : c.name}
              fill
              sizes={
                wide
                  ? '(min-width: 1024px) 75vw, 100vw'
                  : '(min-width: 1024px) 38vw, (min-width: 768px) 50vw, 100vw'
              }
              className="object-cover"
              style={crop ? { objectPosition: crop.position } : undefined}
            />
          </span>
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(35deg,rgba(11,17,13,0.92)_0%,rgba(11,17,13,0.55)_32%,rgba(11,17,13,0.08)_62%,transparent_80%)]"
          />
        </>
      ) : (
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(160deg,#22362A_0%,#1B2A1F_70%)]">
          <span className="absolute inset-5 border border-samara-gold/[0.15]" />
          <span className="absolute right-8 top-6 font-serif text-[clamp(8rem,14vw,13rem)] font-light italic leading-none text-samara-gold/[0.12]">
            {c.name.trim().charAt(0).toUpperCase()}
          </span>
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 md:p-8 lg:p-10">
        <span className="max-w-[14ch] font-serif text-[clamp(2rem,2.9vw,2.75rem)] font-light uppercase leading-[1.05] tracking-[0.05em] text-samara-ivory">
          {c.name}
        </span>
        {c.description && (
          <span className="mt-3 block w-full max-w-[34ch] truncate font-sans text-sm text-samara-ivory/70">
            {c.description}
          </span>
        )}
        <span className="mt-7 flex h-11 w-11 items-center justify-center rounded-full border border-samara-ivory/50 bg-samara-black/30 text-samara-ivory transition-colors duration-300 ease-editorial group-hover:border-samara-gold group-hover:bg-samara-gold group-hover:text-samara-forest">
          <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
        </span>
      </span>
    </Link>
  );
}
