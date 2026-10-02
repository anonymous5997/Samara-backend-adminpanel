'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CartDrawer } from '@/components/shell/CartDrawer';
import { WishlistDrawer } from '@/components/shell/WishlistDrawer';
import { SearchOverlay } from '@/components/shell/SearchOverlay';

type Panel = 'cart' | 'wishlist' | 'search' | null;

interface ShellContextValue {
  openCart: () => void;
  openWishlist: () => void;
  openSearch: () => void;
  close: () => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

/**
 * Owns the storefront overlays (bag, wishlist, search) so any component —
 * header, product page, etc. — can open them. Only one is open at a time.
 * Must sit inside AuthProvider and CartProvider.
 */
export function ShellProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel>(null);

  const close = useCallback(() => setPanel(null), []);
  const value = useMemo<ShellContextValue>(
    () => ({
      openCart: () => setPanel('cart'),
      openWishlist: () => setPanel('wishlist'),
      openSearch: () => setPanel('search'),
      close,
    }),
    [close],
  );

  const onOpenChange = (which: Exclude<Panel, null>) => (open: boolean) =>
    setPanel(open ? which : null);

  return (
    <ShellContext.Provider value={value}>
      {children}
      <CartDrawer open={panel === 'cart'} onOpenChange={onOpenChange('cart')} />
      <WishlistDrawer open={panel === 'wishlist'} onOpenChange={onOpenChange('wishlist')} />
      <SearchOverlay open={panel === 'search'} onOpenChange={onOpenChange('search')} />
    </ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within ShellProvider');
  return ctx;
}
