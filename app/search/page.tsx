'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { useCart } from '@/lib/cart-context';
import { Product } from '@/lib/types';

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
  is_bestseller: boolean;
  bestseller_badge_label: string;
  is_new_arrival: boolean;
  primary_image_url?: string;
  product_images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { currency } = useCart();

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
          product_images (
            id,
            image_url,
            is_primary
          )
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      const productsWithImages: SearchProduct[] = (data || []).map(product => ({
        ...product,
        primary_image_url: (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
                            (product.product_images || [])[0]?.image_url,
      }));

      setProducts(productsWithImages);
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

  return (
    <div className="min-h-screen bg-[#000000] py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-8 text-center">
            Search Products
          </h1>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#D4AF37]" />
              <Input
                type="text"
                placeholder="Search for sarees, collections, brands..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-12 pr-12 py-6 text-lg bg-[#111111] border-[#D4AF37]/30 text-[#F5F5F5] placeholder:text-[#888] focus:border-[#D4AF37] focus:ring-[#D4AF37]/50"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:text-[#F4D03F]"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-[#D4AF37]/30 rounded-lg shadow-xl z-50">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 text-[#F5F5F5] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors border-b border-[#D4AF37]/10 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {searchQuery && (
            <p className="mt-4 text-[#888] text-center">
              {loading ? 'Searching...' : `${products.length} results found`}
            </p>
          )}
        </div>

        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

        {!loading && searchQuery && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-[#888] mb-4">No products found</p>
            <p className="text-[#666]">Try different search terms or browse our collections</p>
            <Button
              asChild
              className="mt-6 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold"
            >
              <a href="/collections">Browse Collections</a>
            </Button>
          </div>
        )}

        {!searchQuery && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-[#D4AF37] mx-auto mb-4" />
            <p className="text-xl text-[#888]">Start typing to search for products</p>
          </div>
        )}
      </div>
    </div>
  );
}
