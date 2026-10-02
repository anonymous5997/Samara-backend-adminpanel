import Image from 'next/image';
import Link from 'next/link';
import { getCollectionBySlug, getCollectionProducts } from '@/lib/content';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { getCurrencyRates } from '@/lib/currency-utils';
import { getCurrentRegion } from '@/lib/region/server';
import type { SupportedCurrency } from '@/lib/currency-utils';
import { ListingHero, PieceCount } from '@/components/listing/ListingHero';
import { ListingEmpty } from '@/components/listing/ListingEmpty';
import { LISTING_GRID, ListingProductCard } from '@/components/listing/ListingProductCard';
import { ArchOrnament } from '@/components/listing/Ornaments';

export default async function CollectionDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  // ---------------------------------------------------------
  // 1. FETCH DATA (Parallel)
  // ---------------------------------------------------------
  const [collection, products] = await Promise.all([
    getCollectionBySlug(slug),
    getCollectionProducts(slug),
  ]);

  // ---------------------------------------------------------
  // 2. HANDLE NOT FOUND
  // ---------------------------------------------------------
  if (!collection) {
    return (
      <div className="min-h-[70vh] bg-samara-black text-samara-ivory">
        <div className="sm-container py-20 md:py-28">
          <ListingEmpty
            eyebrow="Collections"
            title="Collection Not Found"
            body="The collection you're looking for doesn't exist."
            actions={[{ label: 'Browse All Collections', href: '/collections', variant: 'ghost' }]}
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. RESOLVE PRICES (Server-Side)
  // ---------------------------------------------------------
  const region = await getCurrentRegion();
  const rates = await getCurrencyRates();

  const priceMap = new Map<
    string,
    { price: number; currency: SupportedCurrency }
  >();

  for (const product of products) {
    const resolved = await resolveFinalPrice(product, region, undefined, rates);
    if (resolved) {
      priceMap.set(product.id, {
        price: resolved.displayPrice,
        currency: resolved.currency as SupportedCurrency,
      });
    }
  }

  // ---------------------------------------------------------
  // 4. RENDER
  // ---------------------------------------------------------
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Collections', href: '/collections' },
    { label: collection.name },
  ];
  const meta = products.length > 0 ? <PieceCount count={products.length} /> : null;

  return (
    <div className="min-h-screen bg-samara-black text-samara-ivory">
      {/* HERO SECTION */}
      {collection.hero_image_url ? (
        <section className="relative flex min-h-[460px] items-end overflow-hidden bg-samara-forest md:min-h-[560px] lg:h-[68vh] lg:max-h-[760px]">
          <Image
            src={collection.hero_image_url}
            alt={collection.name}
            fill
            priority
            sizes="100vw"
            unoptimized={!collection.hero_image_url.startsWith('https://wrsrobuicquzpfgnfnmh.supabase.co/')}
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-samara-black/[0.85] via-samara-black/40 to-samara-black/20" />
          <div className="sm-container relative w-full pb-12 pt-24 md:pb-16">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-ivory/70">
                {crumbs.map((c, i) => (
                  <li key={c.label} className="flex items-center gap-3">
                    {i > 0 && <span aria-hidden className="h-px w-4 bg-samara-ivory/40" />}
                    {c.href ? (
                      <Link href={c.href} className="sm-link inline-flex min-h-[44px] items-center hover:text-samara-ivory sm:min-h-0">
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-samara-ivory">
                        {c.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <p className="sm-eyebrow mb-5 flex items-center gap-4 text-samara-gold">
              <span>The Collection</span>
              <span aria-hidden className="h-px w-10 bg-samara-gold/50" />
            </p>
            <h1 className="max-w-4xl font-serif text-[clamp(2.75rem,7vw,6rem)] font-light leading-[0.98] text-samara-ivory">
              {collection.hero_title || collection.name}
            </h1>
            {collection.hero_subtitle && (
              <p className="mt-5 max-w-xl font-serif text-lg italic text-samara-ivory/80 md:text-xl">
                {collection.hero_subtitle}
              </p>
            )}
          </div>
        </section>
      ) : (
        <ListingHero
          eyebrow="The Collection"
          title={collection.hero_title || collection.name}
          intro={collection.hero_subtitle || collection.description}
          crumbs={crumbs}
          meta={meta}
          ornament={<ArchOrnament />}
        />
      )}

      {/* PRODUCTS GRID */}
      <section className="py-[clamp(3.5rem,7vw,6.5rem)]">
        <div className="sm-container">
          {collection.hero_subtitle && collection.description && (
            <p className="sm-body mb-12 max-w-2xl md:mb-16">{collection.description}</p>
          )}

          {products.length === 0 ? (
            <ListingEmpty
              eyebrow={collection.name}
              title={
                <>
                  This edit is being <span className="sm-accent">curated</span>
                </>
              }
              body="No products in this collection yet."
              actions={[
                { label: 'Browse All Sarees', href: '/sarees' },
                { label: 'Shop All', href: '/shop', variant: 'ghost' },
              ]}
            />
          ) : (
            <div className={LISTING_GRID}>
              {products.map((product, index) => {
                const resolved = priceMap.get(product.id);
                const badges = [
                  ...(product.is_bestseller ? [product.bestseller_badge_label || 'Bestseller'] : []),
                  ...(product.is_new_arrival ? ['New'] : []),
                ];

                return (
                  <ListingProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    badges={badges}
                    price={resolved}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
