'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { SlidersHorizontal, X } from 'lucide-react';

// ✅ IMPORTS
import type { ProductWithImages } from '@/lib/content'; 
import type { Category } from '@/lib/types'; 

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

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
            product.images?.find((img: any) => img.is_primary) ||
            // @ts-ignore
            product.images?.[0] ||
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
  /* ✅ STEP 2: EXTRACTED FILTER CONTENT (Reusable)                             */
  /* -------------------------------------------------------------------------- */
  const FilterContent = (
    <div className="space-y-10">
      {/* Category */}
      <div className="space-y-4">
        <Label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">
          Category
        </Label>

        <Select
          value={selectedCategory}
          onValueChange={(val) => {
            setSelectedCategory(val);
            router.push(val === 'all' ? '/shop' : `/shop?category=${val}`);
          }}
        >
          <SelectTrigger className="w-full bg-transparent text-samara-ivory border-0 border-b border-samara-ivory/20 rounded-none h-10 px-0 focus:ring-0 focus:border-samara-gold transition-colors">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-samara-void1 text-samara-ivory border-samara-gold/10 rounded-none shadow-2xl">
            <SelectItem value="all" className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug} className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none">
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Filter */}
      <div className="space-y-6">
        <Label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">
          Price Range (INR)
        </Label>

        <Slider
          min={0}
          max={50000}
          step={1000}
          value={priceRange}
          onValueChange={(value) =>
            setPriceRange(value as [number, number])
          }
          className="py-4"
        />

        <div className="flex justify-between text-[11px] font-sans tracking-widest text-samara-ivory/60">
          <span>₹{priceRange[0].toLocaleString()}</span>
          <span>₹{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <Button
        onClick={() => {
          fetchProducts();
          setMobileFiltersOpen(false);
        }}
        className="w-full bg-samara-gold hover:bg-samara-goldDeep text-samara-void font-sans text-[11px] tracking-[0.2em] uppercase rounded-none h-12 transition-colors"
      >
        Apply Filters
      </Button>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* RENDER                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="bg-samara-void min-h-screen text-samara-ivory pb-24 md:pb-32 pt-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            The Collection
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory">
            Shop <em className="italic text-samara-gold">All</em>
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* ✅ STEP 3: DESKTOP SIDEBAR (Hidden on Mobile) */}
          <aside className="hidden lg:block lg:w-64 shrink-0 h-fit sticky top-32">
            {FilterContent}
          </aside>

          {/* PRODUCT GRID SECTION */}
          <div className="flex-1">
            
            {/* ✅ STEP 4: MOBILE FILTER BAR (Visible only on lg:hidden) */}
            <div className="lg:hidden flex gap-4 mb-8">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 h-12 border border-samara-ivory/20 text-samara-ivory/80 text-[11px] font-sans tracking-[0.15em] uppercase hover:border-samara-gold hover:text-samara-gold transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>

              <Select
                value={sortBy}
                onValueChange={(val: any) => setSortBy(val)}
              >
                <SelectTrigger className="flex-1 bg-transparent border border-samara-ivory/20 text-samara-ivory/80 text-[11px] font-sans tracking-[0.15em] uppercase h-12 rounded-none focus:ring-0">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-samara-void1 text-samara-ivory border-samara-gold/10 rounded-none shadow-2xl">
                  <SelectItem value="newest" className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none">Newest</SelectItem>
                  <SelectItem value="price-asc" className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc" className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Sort Header */}
            <div className="hidden lg:flex justify-between items-center mb-10 pb-4 border-b border-samara-ivory/10">
              <p className="text-[11px] font-sans tracking-[0.15em] uppercase text-samara-ivory/60">
                Showing <span className="text-samara-gold">{products.length}</span> pieces
              </p>
              
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">Sort By</span>
                <Select
                  value={sortBy}
                  onValueChange={(val: 'newest' | 'price-asc' | 'price-desc') =>
                    setSortBy(val)
                  }
                >
                  <SelectTrigger className="w-48 bg-transparent text-samara-ivory border-0 border-b border-samara-ivory/20 rounded-none h-8 px-0 focus:ring-0 focus:border-samara-gold transition-colors text-[11px] font-sans tracking-widest uppercase">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-samara-void1 text-samara-ivory border-samara-gold/10 rounded-none shadow-2xl">
                    <SelectItem value="newest" className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none text-[11px] font-sans tracking-widest uppercase">Newest First</SelectItem>
                    <SelectItem value="price-asc" className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none text-[11px] font-sans tracking-widest uppercase">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc" className="focus:bg-samara-gold/10 focus:text-samara-gold rounded-none text-[11px] font-sans tracking-widest uppercase">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="aspect-[3/4] bg-samara-void1" />
                    <div className="h-5 bg-samara-void1 w-3/4" />
                    <div className="h-4 bg-samara-void1 w-1/4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-32 bg-samara-void1/50 border border-samara-ivory/10">
                <h3 className="font-serif text-2xl text-samara-gold mb-3">No pieces found</h3>
                <p className="text-sm font-sans text-samara-ivory/60 mb-6">Try adjusting your filters.</p>
                <Button 
                  onClick={() => {
                    setPriceRange([0, 50000]);
                    setSelectedCategory('all');
                    router.push('/shop');
                    fetchProducts();
                  }}
                  className="bg-transparent text-samara-ivory border-b border-samara-ivory/40 rounded-none hover:text-samara-gold hover:border-samara-gold transition-colors px-0 h-auto py-1 font-sans text-[11px] tracking-[0.2em] uppercase"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {products.map(({ product, image }) => {
                  const resolvedPrice = priceMap[product.id];

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      image={image}
                      price={resolvedPrice}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ STEP 5: MOBILE BOTTOM SHEET */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-samara-void/80 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh]
                          bg-samara-void1 border-t border-samara-gold/20
                          flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

            {/* Header */}
            <div className="p-6 border-b border-samara-ivory/10 flex justify-between items-center bg-samara-void1">
              <h3 className="font-serif text-2xl text-samara-gold">Filters</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-samara-ivory/60 p-2 hover:text-samara-gold transition-colors"
              >
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 pb-10">
              {FilterContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}