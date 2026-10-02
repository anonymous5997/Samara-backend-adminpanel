'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/types';

import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
import { getUserRegion } from '@/lib/region/client';

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface SearchProduct extends Product {
  images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
  product_prices?: Array<{
    currency: string;
    price: number;
    mrp?: number | null;
  }>;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [rates, setRates] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const loadRates = async () => {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('*');

      if (!error && data) {
        const map: Record<string, number> = {};
        data.forEach((r: any) => {
          const code = r.currency || r.target_currency;
          if (code) map[code] = Number(r.rate);
        });
        setRates(map);
      }
    };
    loadRates();
  }, []);

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images (
            id,
            image_url,
            is_primary
          ),
          product_prices (
            currency,
            price,
            mrp
          )
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchProducts(query);
    }, 300),
    []
  );

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(5);

      if (error) throw error;

      const uniqueSuggestions = Array.from(new Set((data || []).map(p => p.name)));
      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const debouncedSuggestions = useCallback(
    debounce((query: string) => {
      fetchSuggestions(query);
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    debouncedSuggestions(searchQuery);
  }, [searchQuery, debouncedSearch, debouncedSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    searchProducts(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setProducts([]);
    setSuggestions([]);
  };
  
  const region = getUserRegion();
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  useEffect(() => {
    if (!products.length) return;
    if (Object.keys(rates).length === 0) return;
    
    const loadPrices = async () => {
      const promises = products.map(async (p) => {
        try {
          const resolved = await resolveFinalPrice(p, region, undefined, rates);
          if (!resolved) return null;
          return [p.id, resolved] as const;
        } catch (err) {
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

  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
        <div className="max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-12 text-center">
            Discover <em className="italic text-samara-gold">Samara</em>
          </h1>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-samara-gold stroke-[1.5]" />
              <Input
                type="text"
                placeholder="Search for sarees, collections, brands..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-16 pr-12 h-16 text-sm font-sans tracking-wide bg-samara-void1 border border-samara-ivory/20 text-samara-ivory placeholder:text-samara-ivory/40 focus:border-samara-gold focus:ring-0 rounded-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-samara-ivory/40 hover:text-samara-gold transition-colors"
                >
                  <X className="h-5 w-5 stroke-[1.5]" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-samara-void1 border border-samara-ivory/20 shadow-2xl z-50">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-6 py-4 text-sm font-sans text-samara-ivory hover:bg-samara-gold hover:text-samara-void transition-colors border-b border-samara-ivory/10 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {searchQuery && (
            <p className="mt-6 text-samara-ivory/60 text-xs font-sans tracking-widest uppercase text-center">
              {loading ? 'Curating results...' : `${products.length} pieces found`}
            </p>
          )}
        </div>

        {products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => {
              const resolvedPrice = priceMap[product.id];
              const mainImage = product.images?.find(img => img.is_primary) || product.images?.[0];
              
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  image={mainImage}
                  price={resolvedPrice}
                />
              );
            })}
          </div>
        )}

        {!loading && searchQuery && products.length === 0 && (
          <div className="text-center py-24">
            <p className="text-2xl font-serif text-samara-ivory/40 mb-4">No pieces found</p>
            <p className="text-sm font-sans text-samara-ivory/40 mb-8">Try different search terms or browse our collections.</p>
            <Button
              asChild
              className="px-10 h-14 rounded-none bg-samara-gold hover:bg-samara-goldDeep text-samara-void font-sans text-[11px] tracking-[0.2em] uppercase transition-colors"
            >
              <a href="/collections">Browse Collections</a>
            </Button>
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-24">
            <Search className="h-12 w-12 text-samara-gold stroke-[1] mx-auto mb-6 opacity-50" />
            <p className="text-sm font-sans tracking-widest text-samara-ivory/40 uppercase">
              Start typing to explore
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
