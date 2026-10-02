'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// ✅ IMPORTS
import type { ProductWithImages } from '@/lib/content'; 
import type { Category } from '@/lib/types'; 

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetClose, SheetOverlay, SheetPortal, SheetTitle } from '@/components/ui/sheet';
import { CatalogHeader, AccentTitle } from '@/components/catalog/CatalogHeader';
import { CatalogGrid, CatalogGridSkeleton, CATALOG_CARD_SIZES } from '@/components/catalog/CatalogGrid';

// IMPORT PRICING ENGINE
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
import { getUserRegion } from '@/lib/region/client';

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Region Only
  const region = getUserRegion();

  // ✅ RATES STATE
  const [rates, setRates] = useState<Record<string, number>>({});

  // ✅ PRODUCTS STATE
  const [products, setProducts] = useState<
    { product: ProductWithImages; image?: any }[]
  >([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ PRICE MAP
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  // Filters
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>(
    'newest'
  );
  
  // Filter Logic Remains in INR (Base Price)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  // ✅ STEP 1: MOBILE UI STATE
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Desktop price popover (presentation only)
  const [priceOpen, setPriceOpen] = useState(false);

  // Initial Load (Categories + Rates)
  useEffect(() => {
    fetchCategories();

    const loadRates = async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*');

      if (error) {
        console.error('Failed to load currency rates', error);
        return;
      }

      const map: Record<string, number> = {};
      data.forEach((r: any) => {
        const code = r.currency || r.target_currency;
        if (code) map[code] = Number(r.rate);
      });

      setRates(map);
    };

    loadRates();
  }, []);

  // Fetch Products on Filter Change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, priceRange]);

  // OPTIMIZED PRICE RESOLUTION
  useEffect(() => {
    if (!products.length) return;
    if (Object.keys(rates).length === 0) return;
    const loadPrices = async () => {
      const promises = products.map(async ({ product }) => {
        try {
          const resolved = await resolveFinalPrice(
            product, 
            region, 
            undefined, 
            rates      
          );
          
          if (!resolved || resolved.displayPrice <= 0) return null;
          return [product.id, resolved] as const;
        } catch (err) {
          console.error(`Price error for ${product.name}`, err);
          return null;
        }
      });

      const results = await Promise.all(promises);

      setPriceMap(
        Object.fromEntries(
          results.filter((item): item is [string, ResolvedPrice] => item !== null)
        )
      );
    };

    loadPrices();
  }, [products, region, rates]);

  /* -------------------------------------------------------------------------- */
  /* DATA FETCHING                                                              */
  /* -------------------------------------------------------------------------- */

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            is_primary
          ),
          product_prices (
            currency,
            price,
            mrp,
            region
          )
        `)
        .eq('is_active', true)
        .gte('base_price_inr', priceRange[0])
        .lte('base_price_inr', priceRange[1]);

      if (selectedCategory && selectedCategory !== 'all') {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', selectedCategory)
          .single();

        if (category) {
          const { data: childCategories } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', category.id);

          const categoryIds = [
            category.id,
            ...(childCategories?.map((c) => c.id) || []),
          ];

          query = query.in('category_id', categoryIds);
        } else {
           setProducts([]);
           setLoading(false);
           return;
        }
      }

      if (sortBy === 'price-asc') {
        query = query.order('base_price_inr', { ascending: true });
      } else if (sortBy === 'price-desc') {
        query = query.order('base_price_inr', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const productsWithImages = data.map((product) => ({
          product: product as unknown as ProductWithImages, 
          image:
            // @ts-ignore
            product.product_images?.find((img: any) => img.is_primary) ||
            // @ts-ignore
            product.product_images?.[0] ||
            null,
        }));

        setProducts(productsWithImages);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };


  /* -------------------------------------------------------------------------- */
  /* FILTER HANDLERS (shared by the desktop toolbar and the mobile sheet)        */
  /* -------------------------------------------------------------------------- */
  const onCategoryChange = (val: string) => {
    setSelectedCategory(val);
    router.push(val === 'all' ? '/shop' : `/shop?category=${val}`);
  };

  const onApplyPrice = () => {
    fetchProducts();
    setMobileFiltersOpen(false); // Close mobile menu on apply
  };

  const onResetFilters = () => {
    setPriceRange([0, 50000]);
    setSelectedCategory('all');
    router.push('/shop');
    fetchProducts();
  };

  /* -------------------------------------------------------------------------- */
  /* PRESENTATION                                                               */
  /* -------------------------------------------------------------------------- */
  const activeCategory = categories.find((c) => c.slug === selectedCategory);
  const countLabel = `${products.length} ${products.length === 1 ? 'product' : 'products'}`;
  const priceLabel = `₹${priceRange[0].toLocaleString()} – ₹${priceRange[1].toLocaleString()}`;
  const categoryOptions = [{ value: 'all', label: 'All' }].concat(
    categories.map((category) => ({ value: category.slug, label: category.name }))
  );

  const categoryChips = (className?: string) => (
    <ul className={cn('flex gap-2', className)} aria-label="Category">
      {categoryOptions.map((opt) => {
        const selected = selectedCategory === opt.value;
        return (
          <li key={opt.value} className="shrink-0">
            <button
              type="button"
              onClick={() => onCategoryChange(opt.value)}
              aria-pressed={selected}
              className={cn(
                'relative flex h-11 items-center border px-4 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold lg:h-10',
                'after:absolute after:inset-x-4 after:bottom-2 after:h-px after:origin-left after:bg-samara-gold after:transition-transform after:duration-500 after:ease-editorial',
                selected
                  ? 'border-samara-ivory/[0.35] text-samara-ivory after:scale-x-100'
                  : 'border-samara-line text-samara-mute after:scale-x-0 hover:border-samara-ivory/[0.35] hover:text-samara-ivory'
              )}
            >
              {opt.label}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const PriceControl = (
    <div>
      <div className="flex justify-between font-sans text-xs tabular-nums text-samara-mute">
        <span>₹{priceRange[0].toLocaleString()}</span>
        <span>₹{priceRange[1].toLocaleString()}</span>
      </div>

      <Slider
        min={0}
        max={50000}
        step={1000}
        value={priceRange}
        onValueChange={(value) =>
          setPriceRange(value as [number, number])
        }
        className={cn(
          'py-5',
          '[&>span:first-child]:h-px [&>span:first-child]:rounded-none [&>span:first-child]:bg-samara-line',
          '[&>span:first-child>span]:bg-samara-gold',
          '[&_[role=slider]]:relative [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border [&_[role=slider]]:border-samara-gold [&_[role=slider]]:bg-samara-black [&_[role=slider]]:ring-offset-0 [&_[role=slider]]:after:absolute [&_[role=slider]]:after:-inset-3.5 [&_[role=slider]]:after:content-[""] [&_[role=slider]:focus-visible]:ring-1 [&_[role=slider]:focus-visible]:ring-samara-gold'
        )}
        aria-label="Price range"
      />
    </div>
  );

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
  ] as const;

  const eyebrowCls = 'font-sans text-[11px] uppercase tracking-[0.2em]';

  return (
    <div className="min-h-screen bg-samara-black pb-24 text-samara-ivory md:pb-32">
      <CatalogHeader
        eyebrow="Shop"
        title={activeCategory ? <AccentTitle text={activeCategory.name} /> : <>All <span className="sm-accent">products</span></>}
        intro={activeCategory?.description || 'Every piece in the house, gathered in one place.'}
      />

      {/* ------------------------------------------------------------------ */}
      {/* TOOLBAR — mobile: count + Filter & Sort; desktop: chips · price · sort */}
      {/* ------------------------------------------------------------------ */}
      <div className="sticky top-[60px] z-30 border-b border-samara-line bg-samara-black/95 backdrop-blur-md lg:top-[72px]">
        <div className="sm-container flex h-14 items-center justify-between gap-6 lg:h-16">
          {/* Mobile */}
          <p className={cn(eyebrowCls, 'text-samara-mute lg:hidden')} aria-live="polite">
            {loading ? 'Loading…' : countLabel}
          </p>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className={cn(
              eyebrowCls,
              '-mr-2 flex h-11 items-center gap-3 px-2 text-samara-ivory transition-colors duration-300 hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold lg:hidden'
            )}
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" strokeWidth={1.25} />
            Filter &amp; Sort
          </button>

          {/* Desktop */}
          {categoryChips('hidden min-w-0 overflow-x-auto [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden')}

          <div className="hidden shrink-0 items-center gap-8 lg:flex">
            <Popover open={priceOpen} onOpenChange={setPriceOpen}>
              <PopoverTrigger
                className={cn(
                  eyebrowCls,
                  'flex h-10 items-center gap-2 text-samara-mute transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold data-[state=open]:text-samara-ivory'
                )}
              >
                Price
                <span className="tabular-nums normal-case tracking-normal text-samara-ivory">{priceLabel}</span>
                <ChevronDown aria-hidden className="h-3.5 w-3.5" strokeWidth={1.25} />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={12}
                className="w-80 rounded-none border-samara-line bg-samara-ink p-6 text-samara-ivory shadow-none"
              >
                <p className="sm-eyebrow mb-2">Price Filter</p>
                {PriceControl}
                <button
                  type="button"
                  onClick={() => {
                    onApplyPrice();
                    setPriceOpen(false);
                  }}
                  className="sm-btn mt-2 w-full bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
                >
                  Apply Filter
                </button>
              </PopoverContent>
            </Popover>

            <span aria-hidden className="h-5 w-px bg-samara-line" />

            <div className="flex items-center gap-3">
              <span className={cn(eyebrowCls, 'text-samara-mute')}>Sort</span>
              <Select
                value={sortBy}
                onValueChange={(val: 'newest' | 'price-asc' | 'price-desc') =>
                  setSortBy(val)
                }
              >
                <SelectTrigger
                  aria-label="Sort by"
                  className={cn(
                    eyebrowCls,
                    'h-10 w-auto gap-2 rounded-none border-0 bg-transparent px-0 text-samara-ivory focus:ring-0 focus:ring-offset-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold [&>svg]:opacity-70'
                  )}
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="rounded-none border-samara-line bg-samara-ink text-samara-ivory shadow-none"
                >
                  {sortOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="rounded-none py-2.5 font-sans text-xs tracking-wide focus:bg-samara-forest-2 focus:text-samara-ivory"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RESULTS                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="sm-container pt-8 md:pt-12">
        <p className={cn(eyebrowCls, 'mb-8 hidden text-samara-mute lg:mb-12 lg:block')} aria-live="polite">
          {loading ? 'Loading…' : (
            <>
              Showing <span className="text-samara-ivory">{products.length}</span> {products.length === 1 ? 'product' : 'products'}
            </>
          )}
        </p>

        {loading ? (
          <CatalogGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="border-b border-samara-line pb-20 pt-12 md:pb-28 md:pt-16">
            <div className="max-w-xl">
              <h2 className="sm-display-s !font-light">
                No products <span className="sm-accent">found</span>
              </h2>
              <p className="sm-body mt-4">Try adjusting your filters.</p>
              <button
                type="button"
                onClick={onResetFilters}
                className={cn(
                  eyebrowCls,
                  'sm-link mt-8 inline-flex min-h-[44px] items-center text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold'
                )}
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <CatalogGrid>
            {products.map(({ product, image }, i) => {
              const resolvedPrice = priceMap[product.id];

              return (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    image={image}
                    price={resolvedPrice}
                    sizes={CATALOG_CARD_SIZES}
                    priority={i < 2}
                  />
                </li>
              );
            })}
          </CatalogGrid>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE BOTTOM SHEET                                                 */}
      {/* ------------------------------------------------------------------ */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetPortal>
          <SheetOverlay className="z-[1100] bg-samara-black/80 backdrop-blur-sm" />
          <SheetPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-[1100] flex max-h-[85dvh] flex-col border-t border-samara-line bg-samara-ink text-samara-ivory outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-300 data-[state=open]:duration-500 motion-reduce:!animate-none lg:hidden"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-samara-line px-[var(--sm-gutter)]">
              <SheetTitle className="font-serif text-2xl !font-light text-samara-ivory">
                Filter <span className="sm-accent">&amp;</span> Sort
              </SheetTitle>
              <SheetClose
                className="-mr-3 flex h-11 w-11 items-center justify-center text-samara-mute transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
                aria-label="Close filters"
              >
                <X aria-hidden className="h-5 w-5" strokeWidth={1.25} />
              </SheetClose>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[var(--sm-gutter)] py-8">
              <section aria-labelledby="sm-shop-cat">
                <p id="sm-shop-cat" className="sm-eyebrow mb-4">Category</p>
                {categoryChips('flex-wrap')}
              </section>

              <section aria-labelledby="sm-shop-sort" className="mt-10">
                <p id="sm-shop-sort" className="sm-eyebrow mb-2">Sort by</p>
                <ul className="border-t border-samara-line">
                  {sortOptions.map((opt) => {
                    const selected = sortBy === opt.value;
                    return (
                      <li key={opt.value} className="border-b border-samara-line">
                        <button
                          type="button"
                          onClick={() => setSortBy(opt.value)}
                          aria-pressed={selected}
                          className={cn(
                            'flex min-h-[52px] w-full items-center justify-between text-left font-serif text-lg font-light transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold',
                            selected ? 'text-samara-ivory' : 'text-samara-mute hover:text-samara-ivory'
                          )}
                        >
                          {opt.label}
                          {selected && <Check aria-hidden className="h-4 w-4 text-samara-gold" strokeWidth={1.5} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section aria-labelledby="sm-shop-price" className="mt-10">
                <p id="sm-shop-price" className="sm-eyebrow mb-3">Price Filter</p>
                {PriceControl}
              </section>
            </div>

            <div className="shrink-0 border-t border-samara-line px-[var(--sm-gutter)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                onClick={onApplyPrice}
                className="sm-btn w-full bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
              >
                Apply Filter
              </button>
            </div>
          </SheetPrimitive.Content>
        </SheetPortal>
      </Sheet>
    </div>
  );
}
