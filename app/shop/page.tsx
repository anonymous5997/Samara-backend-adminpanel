// app/shop/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { Product, ProductImage, Category, Currency } from '@/lib/types';
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

type CurrencyRateMap = Partial<Record<Currency, number>>;

export default function ShopPage() {
  const searchParams = useSearchParams();
  const { currency } = useCart(); // 'INR' | 'USD' | 'AED'

  const [products, setProducts] = useState<
    { product: Product; image?: ProductImage }[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // "all" instead of "" so Select never has an empty value
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>(
    'newest'
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  // currency rates from DB: 1 USD/AED = X INR
  const [currencyRates, setCurrencyRates] = useState<CurrencyRateMap>({
    INR: 1,
  });

  useEffect(() => {
    fetchCategories();
    fetchCurrencyRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (data) setCategories(data);
  };

  const fetchCurrencyRates = async () => {
    const { data, error } = await supabase
      .from('currency_rates')
      .select('target_currency, rate')
      .eq('base_currency', 'INR');

    if (error || !data) return;

    const map: CurrencyRateMap = { INR: 1 };
    for (const row of data) {
      map[row.target_currency as Currency] = Number(row.rate);
    }
    setCurrencyRates(map);
  };

  const fetchProducts = async () => {
    setLoading(true);

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gte('base_price_inr', priceRange[0])
      .lte('base_price_inr', priceRange[1]);

    if (selectedCategory && selectedCategory !== 'all') {
      const category = categories.find((c) => c.slug === selectedCategory);
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    if (sortBy === 'price-asc') {
      query = query.order('base_price_inr', { ascending: true });
    } else if (sortBy === 'price-desc') {
      query = query.order('base_price_inr', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;

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

    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Shop All Products</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-64 space-y-6">
          {/* Category filter */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price range filter */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
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
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
            <Button onClick={fetchProducts} size="sm" className="w-full mt-2">
              Apply Filter
            </Button>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-600">
              {products.length} products
            </p>
            <Select
              value={sortBy}
              onValueChange={(val: 'newest' | 'price-asc' | 'price-desc') =>
                setSortBy(val)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(({ product, image }) => {
                const rateForCurrency =
                  currency === 'INR'
                    ? 1
                    : currencyRates[currency] ?? 1;

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    image={image}
                    currency={currency}
                    rate={rateForCurrency}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
