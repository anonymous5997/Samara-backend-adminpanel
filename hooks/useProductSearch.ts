'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/types';

/**
 * Storefront product search, extracted verbatim from app/search/page.tsx so
 * the /search page and the SearchOverlay share one implementation.
 *
 * - products: `products` + `product_images`, active only, name/description/
 *   brand ILIKE, limit 20, debounced 300ms.
 * - suggestions: distinct product names, active only, name ILIKE, limit 5,
 *   debounced 200ms, only for queries of 2+ characters.
 */

const SEARCH_DEBOUNCE_MS = 300;
const SUGGESTIONS_DEBOUNCE_MS = 200;

export interface SearchProduct extends Product {
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

/** `fn` must be stable (useCallback) so pending calls are not dropped. */
function useDebounced<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  return useMemo(
    () =>
      (...args: A) => {
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => fn(...args), wait);
      },
    [fn, wait],
  );
}

export function useProductSearch(initialQuery = '') {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  /** The query whose request most recently finished (lets UIs tell "pending" from "no results"). */
  const [settledQuery, setSettledQuery] = useState('');

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setSettledQuery(query);
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

      const productsWithImages: SearchProduct[] = (data || []).map((product) => ({
        ...product,
        primary_image_url:
          (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
          (product.product_images || [])[0]?.image_url,
      }));

      setProducts(productsWithImages);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setSettledQuery(query);
    }
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
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

      const uniqueSuggestions = Array.from(new Set((data || []).map((p) => p.name)));
      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  const debouncedSearch = useDebounced(searchProducts, SEARCH_DEBOUNCE_MS);
  const debouncedSuggestions = useDebounced(fetchSuggestions, SUGGESTIONS_DEBOUNCE_MS);

  useEffect(() => {
    debouncedSearch(searchQuery);
    debouncedSuggestions(searchQuery);
  }, [searchQuery, debouncedSearch, debouncedSuggestions]);

  /** Picks a suggestion: fills the query and searches immediately (as /search always did). */
  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setSearchQuery(suggestion);
      searchProducts(suggestion);
    },
    [searchProducts],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setProducts([]);
    setSuggestions([]);
  }, []);

  /** True while typing has not yet produced results for the current query. */
  const pending = loading || (searchQuery.trim() !== '' && settledQuery !== searchQuery);

  return {
    searchQuery,
    setSearchQuery,
    products,
    suggestions,
    loading,
    pending,
    searchProducts,
    selectSuggestion,
    clearSearch,
  };
}
