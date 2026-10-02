'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
// ✅ STEP 1: Import rate loader
import { formatPriceSync, getCurrencyRates } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/region/client';
import { Reveal } from '@/components/motion/Reveal';
import { RAIL_ITEM, RAIL_LIST, RailControls, useRail } from '@/components/home/HomeProductCard';
import { isGalleryImage, isOptimizable, pad2 } from '@/components/pdp/pdp-utils';
import { cn } from '@/lib/utils';

interface SimilarProduct {
  id: string;
  name: string;
  slug: string;
  base_price_inr: number;
  mrp_inr?: number | null;
  primary_image_url: string | null;
  images?: { image_url: string }[];
}

interface Props {
  products: SimilarProduct[];
}

/** The product's own photos only; stock placeholder rows are skipped. */
function cardImages(product: SimilarProduct): { primary: string | null; secondary: string | null } {
  const all = (product.images ?? []).map((img) => img.image_url).filter(isGalleryImage);
  const primary = isGalleryImage(product.primary_image_url) ? product.primary_image_url : all[0] ?? null;
  const secondary = all.find((url) => url !== primary) ?? null;
  return { primary, secondary };
}

export function SimilarProductsSection({ products }: Props) {
  // Note: Similar items strictly follow the user's detected Region.
  const region = getUserRegion();
  
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});
  
  // ✅ STEP 2: State for rates
  const [rates, setRates] = useState<Record<string, number>>({});

  /* -----------------------------------------------------
     LOAD RATES ONCE
  ----------------------------------------------------- */
  useEffect(() => {
    getCurrencyRates()
      .then(setRates)
      .catch((err) => console.error("Failed to load similar product rates:", err));
  }, []);

  /* -----------------------------------------------------
     RESOLVE PRICES (STRICT REGION MODE)
  ----------------------------------------------------- */
  useEffect(() => {
    if (!products.length) return;
    
    // ✅ STEP 3: Guard - Wait for rates to exist
    if (!Object.keys(rates).length) return;

    const load = async () => {
      const map: Record<string, ResolvedPrice> = {};
      
      for (const p of products) {
        // ✅ STEP 4: Pass 'rates' and use 'undefined' for currency
        // This enforces region-based pricing (Single Source of Truth)
        map[p.id] = await resolveFinalPrice(
          p,
          region,
          undefined, // Ignore UI currency, trust Region
          rates
        );
      }
      setPriceMap(map);
    };

    load();
  }, [products, region, rates]);

  const rail = useRail(products.length);

  // Presentation: no similar products → no empty section.
  if (!products.length) return null;
  const multiple = products.length > 1;
  const sizes = '(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 38vw, 74vw';

  return (
    <section aria-labelledby="similar-title" className="bg-samara-cream py-16 text-samara-cream-ink sm:py-20 lg:py-24">
      <div className="sm-container grid gap-10 lg:grid-cols-[minmax(13rem,16rem)_1fr] lg:gap-12 xl:gap-16">
        <Reveal className="flex flex-col">
          <h2
            id="similar-title"
            className="font-serif text-[2.25rem] font-normal leading-[0.98] text-samara-cream-ink sm:text-[2.75rem] lg:text-[3rem]"
          >
            Similar Sarees <span className="sm-accent text-samara-gold-deep">You May Love</span>
          </h2>
          <span aria-hidden className="mt-7 hidden h-px w-10 bg-samara-cream-ink/30 lg:block" />
          {multiple && (
            <RailControls
              current={rail.current}
              canPrev={rail.canPrev}
              canNext={rail.canNext}
              step={rail.step}
              count={products.length}
              label="similar sarees"
              className="mt-8 lg:mt-auto lg:pt-10"
            />
          )}
        </Reveal>

        <ul ref={rail.ref} className={RAIL_LIST} aria-label="Similar sarees">
          {products.map((product, index) => {
            const price = priceMap[product.id];
            const { primary, secondary } = cardImages(product);
            const href = `/products/${product.slug}`;

            return (
              <li key={product.id} className={cn(RAIL_ITEM, !multiple && 'sm:w-[min(20rem,48%)]')}>
                <Reveal delay={Math.min(index, 4) * 110}>
                  <article className="group relative">
                    <Link
                      href={href}
                      tabIndex={-1}
                      aria-hidden
                      data-img-reveal=""
                      className="sm-zoom relative block aspect-[4/5] w-full bg-samara-cream-2"
                    >
                      {primary ? (
                        <>
                          <Image
                            src={primary}
                            alt={product.name}
                            fill
                            sizes={sizes}
                            unoptimized={!isOptimizable(primary)}
                            className="object-cover"
                          />
                          {secondary && (
                            <Image
                              src={secondary}
                              alt=""
                              fill
                              sizes={sizes}
                              unoptimized={!isOptimizable(secondary)}
                              className="hidden object-cover opacity-0 transition-opacity duration-900 ease-editorial lg:block [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
                            />
                          )}
                        </>
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center font-serif text-6xl font-light text-samara-cream-mute">
                          {product.name.trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Link>

                    <div className="mt-4 min-w-0">
                      <p className="font-sans text-[0.6875rem] tabular-nums tracking-[0.18em] text-samara-cream-mute">
                        {pad2(index + 1)}
                      </p>
                      <h3 className="mt-1.5 font-serif text-[1.1875rem] font-normal leading-snug">
                        <Link
                          href={href}
                          className="line-clamp-2 text-samara-cream-ink transition-colors duration-300 hover:text-samara-gold-deep focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-cream-ink"
                        >
                          {product.name}
                        </Link>
                      </h3>

                      {/* Price Skeleton or Value */}
                      <div className="mt-2">
                        {!price ? (
                          <span aria-hidden className="block h-4 w-16 bg-samara-cream-2" />
                        ) : (
                          <p className="flex flex-wrap items-baseline gap-x-2 font-sans text-[0.8125rem] tabular-nums">
                            <span className="text-samara-cream-ink">
                              {formatPriceSync(price.displayPrice, price.currency)}
                            </span>

                            {price.mrp && (
                              <s className="text-[0.75rem] text-samara-cream-mute">
                                <span className="sr-only">MRP </span>
                                {formatPriceSync(price.mrp, price.currency)}
                              </s>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
