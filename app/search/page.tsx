'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { useProductSearch } from '@/hooks/useProductSearch';

function SearchView({ urlQuery }: { urlQuery: string | null }) {
  const {
    searchQuery,
    setSearchQuery,
    products,
    suggestions,
    loading,
    selectSuggestion,
    clearSearch,
  } = useProductSearch(urlQuery ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Follow ?q= when it changes while this page is open (e.g. from the search overlay).
  useEffect(() => {
    if (urlQuery !== null) setSearchQuery(urlQuery);
  }, [urlQuery, setSearchQuery]);

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    selectSuggestion(suggestion);
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

function SearchWithParams() {
  const params = useSearchParams();
  return <SearchView urlQuery={params.get('q')} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchView urlQuery={null} />}>
      <SearchWithParams />
    </Suspense>
  );
}
