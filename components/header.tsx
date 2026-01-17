'use client';

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, Heart, Search, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CurrencySelector from '@/components/currency-selector';
import type { SupportedCurrency } from '@/lib/currency-utils';
import { setUserRegion } from '@/lib/region/client';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/sarees', label: 'Sarees' },
  { href: '/collections', label: 'Collections' },
  { href: '/festive-edit', label: 'Festive Edit' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ Step 1: Get loading state from auth
  const { user, profile, signOut, loading } = useAuth();
  
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Memoize currency to stop re-render loop
  const urlCurrency = useMemo(() => {
    return (searchParams.get("currency") || "INR") as SupportedCurrency;
  }, [searchParams]);

  const handleCurrencyChange = (nextCurrency: SupportedCurrency) => {
    // 1. Sync region cookie (for future requests/shipping)
    switch (nextCurrency) {
      case 'USD':
        setUserRegion('US');
        break;
      case 'AED':
        setUserRegion('AE');
        break;
      case 'CAD':
        setUserRegion('CA');
        break;
      case 'GBP':
        setUserRegion('GB');
        break;
      default:
        setUserRegion('IN');
    }

    // 2. Update URL (this is the ONLY trigger for pricing updates now)
    const params = new URLSearchParams(searchParams.toString());
    params.set("currency", nextCurrency);

    // Replace URL without scrolling
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
    
    // ✅ ISSUE 4 FIX: Only refresh server data on shop/product pages
    // This keeps the Home page fast and instant
    if (pathname.startsWith("/shop") || pathname.startsWith("/products")) {
      router.refresh(); 
    }
  };

  // ✅ ISSUE 2 FIX: Prevent header flicker while auth is loading
  if (loading) {
    return (
      <header className="sticky top-0 z-[999] w-full bg-[#050505] border-b border-[#D4AF37]/20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex h-[72px] items-center justify-between">
            {/* Logo Placeholder */}
            <div className="flex items-center gap-4 h-full opacity-50">
              <div className="relative h-14 w-44 flex items-center">
                 {/* Keep logo visible but static */}
                 <Image
                  src="/samara-logo.png"
                  alt="Loading..."
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            {/* Empty Right Side to prevent layout shift */}
            <div className="flex items-center gap-4" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-[999] w-full bg-[#050505] border-b border-[#D4AF37]/20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-[72px] items-center justify-between">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-4 h-full">
            <Link href="/" className="flex items-center group">
              <div className="relative h-14 w-44 flex items-center">
                <Image
                  src="/samara-logo.png"
                  alt="Samara - Woven for every woman"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* CENTER: nav (desktop) */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#F5F5F5] hover:text-[#F4D03F] transition-colors duration-300 tracking-wide hover:underline underline-offset-4"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: actions */}
          <div className="flex items-center gap-4">
            
            {/* DESKTOP CURRENCY SELECTOR */}
            <div className="hidden md:block">
              <CurrencySelector 
                currency={urlCurrency} 
                onChange={handleCurrencyChange} 
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden md:inline-flex text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10"
            >
              <Link href="/search">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10"
              >
                <Link href="/wishlist">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10"
            >
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#D4AF37] text-xs text-black flex items-center justify-center font-semibold">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[1000] bg-[#111111] border-[#D4AF37]/20">
                  <DropdownMenuItem asChild className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                    <Link href="/orders">Orders</Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} className="text-[#F5F5F5] hover:text-[#D4AF37] focus:text-[#D4AF37]">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold rounded-full px-6">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}

            {/* MOBILE MENU SHEET */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-[#D4AF37] hover:text-[#F4D03F] hover:bg-[#D4AF37]/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              
              {/* ✅ ISSUE FIX: Added overflow-y-auto for scrolling */}
              <SheetContent 
                side="left" 
                className="fixed inset-y-0 left-0 z-[1000] bg-[#000000] border-[#D4AF37]/20 overflow-y-auto"
              >
                
                {/* ✅ ISSUE FIX: Added pb-24 for safe bottom spacing */}
                <nav className="flex flex-col gap-4 mt-8 pb-24">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-[#F5F5F5] hover:text-[#D4AF37] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* MOBILE CURRENCY SELECTOR */}
                <div className="mt-8 pt-6 border-t border-[#D4AF37]/20">
                  <p className="text-sm font-medium text-[#D4AF37] mb-3">Currency</p>
                  <div className="w-full">
                    <CurrencySelector
                      currency={urlCurrency}
                      onChange={handleCurrencyChange}
                    />
                  </div>
                </div>

              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;