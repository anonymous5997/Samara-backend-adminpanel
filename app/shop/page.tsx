'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { Product, ProductImage, Category } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
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

// ✅ STEP 1: DEFINE SIMPLE EXCHANGE RATES (You can replace this with DB fetch later)
const exchangeRates: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  AED: 0.044,
  EUR: 0.011,
  GBP: 0.0095,
  SGD: 0.016,
};

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useCart(); // ✅ Get selected currency
  const region = getUserRegion();

  const [products, setProducts] = useState<
    { product: Product; image?: ProductImage }[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // PRICING STATE
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  // Filters
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>(
    'newest'
  );
  
  // ✅ FILTER LOGIC REMAINS IN INR
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  // ✅ STEP 2: CALCULATE DISPLAY VALUES
  const rate = exchangeRates[currency] || 1;
  const displayMin = Math.round(priceRange[0] * rate);
  const displayMax = Math.round(priceRange[1] * rate);

  // Initial Load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch Products on Filter Change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, priceRange]);

  // RESOLVE PRICES
  useEffect(() => {
    if (!products.length) return;

    const loadPrices = async () => {
      const map: Record<string, ResolvedPrice> = {};

      await Promise.all(
        products.map(async ({ product }) => {
          try {
            const resolved = await resolveFinalPrice(product, region, currency);
            map[product.id] = resolved;
          } catch (err) {
            console.error(`Price error for ${product.name}`, err);
          }
        })
      );

      setPriceMap(map);
    };

    loadPrices();
  }, [products, currency, region]);

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
          product_prices (
            region,
            price,
            currency
          )
        `)
        .eq('is_active', true)
        .gte('base_price_inr', priceRange[0])
        .lte('base_price_inr', priceRange[1]);

      // ✅ STEP 4: FIX CATEGORY FILTER LOGIC (Parent + Child support)
      if (selectedCategory && selectedCategory !== 'all') {
        // 1. Get the selected category ID
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', selectedCategory)
          .single();

        if (category) {
          // 2. Get any child categories
          const { data: childCategories } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', category.id);

          // 3. Create list of all valid IDs
          const categoryIds = [
            category.id,
            ...(childCategories?.map((c) => c.id) || []),
          ];

          // 4. Filter products
          query = query.in('category_id', categoryIds);
        } else {
           // Handle invalid category slug gracefully
           console.warn('Category not found:', selectedCategory);
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
        const productsWithImages = await Promise.all(
          data.map(async (product) => {
            const { data: image } = await supabase
              .from('product_images')
              .select('*')
              .eq('product_id', product.id)
              .eq('is_primary', true)
              .maybeSingle();

            return { product, image };
          })
        );
        setProducts(productsWithImages);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="bg-black min-h-screen text-white pb-20 pt-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-10 text-[#D4AF37] font-serif tracking-wide">
          Shop All Products
        </h1>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* ------------------------------------------------------------------
              SIDEBAR FILTERS
             ------------------------------------------------------------------ */}
          <aside className="w-full md:w-64 space-y-8 h-fit">
            
            {/* Category Filter */}
            <div className="space-y-3 border border-gray-800 p-4 rounded-lg bg-[#0a0a0a]">
              <Label className="text-lg font-serif font-medium text-[#D4AF37]">
                Category
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  router.push(val === 'all' ? '/shop' : `/shop?category=${val}`);
                }}
              >
                <SelectTrigger className="w-full bg-[#111] text-white border-gray-700 h-10 mt-2">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] text-white border-gray-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-4 border border-gray-800 p-4 rounded-lg bg-[#0a0a0a]">
              <div className="flex justify-between items-center">
                {/* ✅ STEP 5: Label with Currency */}
                <Label className="text-lg font-serif font-medium text-[#D4AF37]">
                  Price ({currency})
                </Label>
              </div>
              
              {/* ✅ STEP 3: Slider Labels using Display Values */}
              <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                <span>{currency} {displayMin.toLocaleString()}</span>
                <span>{currency} {displayMax.toLocaleString()}</span>
              </div>

              {/* ✅ STEP 4: Slider Logic keeps using INR (priceRange) */}
              <Slider
                min={0}
                max={50000}
                step={1000}
                value={priceRange}
                onValueChange={(value) =>
                  setPriceRange(value as [number, number])
                }
                className="py-2"
              />
              
              <Button 
                onClick={fetchProducts} 
                className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold h-10 rounded-md transition-colors mt-2"
              >
                APPLY FILTER
              </Button>
            </div>
          </aside>

          {/* ------------------------------------------------------------------
              PRODUCT GRID
             ------------------------------------------------------------------ */}
          <div className="flex-1">
            {/* Sort & Count Header */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
              <p className="text-sm text-gray-400 font-medium">
                Showing <span className="text-[#D4AF37]">{products.length}</span> products
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Sort by:</span>
                <Select
                  value={sortBy}
                  onValueChange={(val: 'newest' | 'price-asc' | 'price-desc') =>
                    setSortBy(val)
                  }
                >
                  <SelectTrigger className="w-40 bg-transparent text-white border-none h-10 focus:ring-0 text-right">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] text-white border-gray-700">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid Content */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <div className="aspect-[3/4] bg-[#111] rounded-lg border border-gray-900" />
                    <div className="h-4 bg-[#111] rounded w-3/4" />
                    <div className="h-4 bg-[#111] rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 rounded-lg border border-dashed border-gray-800 bg-[#0a0a0a]">
                <h3 className="text-xl font-medium text-[#D4AF37] mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters.</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setPriceRange([0, 50000]);
                    setSelectedCategory('all');
                    router.push('/shop');
                    fetchProducts();
                  }}
                  className="text-white underline mt-2"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    </div>
  );
}