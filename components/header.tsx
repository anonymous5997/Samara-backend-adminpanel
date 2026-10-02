'use client';

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, User, Heart, Search, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetClose } from '@/components/ui/sheet';
import CurrencySelector from '@/components/currency-selector';
import type { SupportedCurrency } from '@/lib/currency-utils';
import { setUserRegion } from '@/lib/region/client';
import { formatPriceSync } from '@/lib/currency-utils';

const navLinks = [
  { href: '/sarees', label: 'Sarees' },
  { href: '/collections', label: 'Collections' },
  { href: '/festive-edit', label: 'Festive Edit' },
  { href: '/about', label: 'Our Story' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, profile, signOut, loading } = useAuth();
  const { items, removeFromCart, updateQuantity, currency } = useCart();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  const isHome = pathname === '/';
  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  const urlCurrency = useMemo(() => {
    return (searchParams.get("currency") || "INR") as SupportedCurrency;
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCurrencyChange = (nextCurrency: SupportedCurrency) => {
    switch (nextCurrency) {
      case 'USD': setUserRegion('US'); break;
      case 'AED': setUserRegion('AE'); break;
      case 'CAD': setUserRegion('CA'); break;
      case 'GBP': setUserRegion('GB'); break;
      default: setUserRegion('IN');
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("currency", nextCurrency);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    if (pathname.startsWith("/shop") || pathname.startsWith("/products")) {
      router.refresh(); 
    }
  };

  const headerBgClass = (isHome && !isScrolled) ? 'bg-transparent' : 'bg-samara-void1/95 backdrop-blur-md shadow-md';
  const textColorClass = 'text-samara-ivory'; 
  const logoSrc = '/samara-logo.png'; // Assuming white/gold logo for dark backgrounds

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-[100] w-full transition-all duration-500 ease-out border-b border-samara-gold/10 ${headerBgClass}`}>
        <div className="container mx-auto px-4 md:px-8">
          <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-20' : 'h-24'}`}>
            
            {/* LEFT: Mobile Menu Toggle & Desktop Nav */}
            <div className="flex-1 flex items-center justify-start gap-8">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden p-2 -ml-2 text-samara-ivory hover:text-samara-gold transition-colors">
                    <Menu className="w-6 h-6 stroke-[1.5]" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-samara-void1 border-r border-samara-gold/10 p-0 flex flex-col z-[1000]">
                  <SheetHeader className="p-6 text-left border-b border-samara-gold/10">
                    <SheetTitle className="text-samara-gold font-serif text-2xl tracking-wide">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-6">
                    <nav className="flex flex-col gap-4">
                      {navLinks.map(link => (
                        <Link 
                          key={link.href} href={link.href} 
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg font-serif tracking-wide text-samara-ivory hover:text-samara-gold transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="h-[1px] w-full bg-samara-gold/10" />
                    <div className="flex flex-col gap-4">
                      {user ? (
                        <>
                          <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-sm font-sans tracking-widest uppercase text-samara-ivory/70 hover:text-samara-gold">My Account</Link>
                          <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="text-sm font-sans tracking-widest uppercase text-samara-ivory/70 hover:text-samara-gold">Orders</Link>
                          <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="text-sm font-sans tracking-widest uppercase text-samara-ivory/70 hover:text-samara-gold">Wishlist</Link>
                          {profile?.role === 'admin' && (
                            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-sm font-sans tracking-widest uppercase text-samara-gold">Admin Panel</Link>
                          )}
                          <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="text-left text-sm font-sans tracking-widest uppercase text-samara-ivory/70 hover:text-samara-gold">Sign Out</button>
                        </>
                      ) : (
                        <>
                          <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-sans tracking-widest uppercase text-samara-ivory/70 hover:text-samara-gold">Sign In</Link>
                          <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="text-sm font-sans tracking-widest uppercase text-samara-ivory/70 hover:text-samara-gold">Create Account</Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-6 border-t border-samara-gold/10">
                    <p className="text-xs uppercase tracking-widest text-samara-gold mb-3">Currency</p>
                    <CurrencySelector currency={urlCurrency} onChange={handleCurrencyChange} />
                  </div>
                </SheetContent>
              </Sheet>

              <nav className="hidden lg:flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[13px] font-sans tracking-[0.1em] uppercase ${textColorClass} hover:text-samara-gold transition-colors duration-300 relative group`}
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-samara-gold transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* CENTER: Logo */}
            <div className="flex-1 flex justify-center">
              <Link href="/" className="relative flex items-center justify-center">
                <div className={`relative transition-all duration-500 ease-out ${isScrolled ? 'h-10 w-32' : 'h-14 w-44'}`}>
                  {!loading && (
                    <Image
                      src={logoSrc}
                      alt="Samara"
                      fill
                      className="object-contain"
                      priority
                    />
                  )}
                </div>
              </Link>
            </div>

            {/* RIGHT: Utilities */}
            <div className="flex-1 flex items-center justify-end gap-3 sm:gap-5">
              <div className="hidden xl:block">
                <CurrencySelector currency={urlCurrency} onChange={handleCurrencyChange} />
              </div>

              <Link href="/search" className={`p-2 ${textColorClass} hover:text-samara-gold transition-colors`}>
                <Search className="w-5 h-5 stroke-[1.5]" />
              </Link>

              {user ? (
                <Link href="/profile" className={`hidden md:block p-2 ${textColorClass} hover:text-samara-gold transition-colors`}>
                  <User className="w-5 h-5 stroke-[1.5]" />
                </Link>
              ) : (
                <Link href="/auth/login" className={`hidden md:block text-[13px] font-sans tracking-[0.1em] uppercase ${textColorClass} hover:text-samara-gold transition-colors`}>
                  Login
                </Link>
              )}

              {user && (
                <Link href="/wishlist" className={`hidden md:block p-2 ${textColorClass} hover:text-samara-gold transition-colors`}>
                  <Heart className="w-5 h-5 stroke-[1.5]" />
                </Link>
              )}

              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <button className={`p-2 relative flex items-center ${textColorClass} hover:text-samara-gold transition-colors group`}>
                    <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                    <span className="ml-1.5 text-[11px] font-sans tracking-widest pt-0.5 group-hover:text-samara-gold transition-colors">
                      ({cartItemsCount})
                    </span>
                  </button>
                </SheetTrigger>
                
                {/* CART DRAWER CONTENT */}
                <SheetContent side="right" className="w-[100vw] sm:w-[450px] bg-samara-void border-l border-samara-gold/10 p-0 flex flex-col z-[1000]">
                  <SheetHeader className="p-6 border-b border-samara-gold/10 flex flex-row items-center justify-between">
                    <SheetTitle className="text-samara-gold font-serif text-2xl tracking-wide">Your Bag ({cartItemsCount})</SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                        <ShoppingBag className="w-12 h-12 stroke-[1] text-samara-gold/50" />
                        <div>
                          <p className="font-serif text-xl text-samara-ivory mb-2">Your bag is empty.</p>
                          <p className="text-sm font-sans text-samara-ivory/60 italic">Every story begins somewhere.</p>
                        </div>
                        <SheetClose asChild>
                          <Button className="mt-4 bg-samara-gold hover:bg-samara-goldDeep text-samara-void font-sans tracking-widest uppercase rounded-none">
                            Shop Best Sellers
                          </Button>
                        </SheetClose>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-4 group">
                            <div className="relative w-24 h-32 bg-samara-void1 shrink-0 overflow-hidden">
                              {item.image_url ? (
                                <Image src={item.image_url} alt={item.product.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-samara-gold/40">No Image</div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <Link href={`/products/${item.product.slug}`} onClick={() => setCartOpen(false)}>
                                  <h4 className="font-serif text-lg text-samara-ivory group-hover:text-samara-gold transition-colors line-clamp-2">{item.product.name}</h4>
                                </Link>
                                {item.variant?.size && (
                                  <p className="text-xs font-sans text-samara-ivory/60 mt-1">Size: {item.variant.size}</p>
                                )}
                                <p className="text-sm font-sans tracking-wide text-samara-gold mt-2">
                                  {formatPriceSync(item.unit_price, urlCurrency)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center border border-samara-ivory/20 rounded-none">
                                  <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="px-3 py-1 text-samara-ivory hover:text-samara-gold transition-colors">-</button>
                                  <span className="px-2 text-sm text-samara-ivory">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-samara-ivory hover:text-samara-gold transition-colors">+</button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-xs font-sans uppercase tracking-widest text-samara-ivory/50 hover:text-red-400 transition-colors underline underline-offset-4">
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="p-6 border-t border-samara-gold/10 bg-samara-void1">
                      <div className="flex justify-between items-center mb-6">
                        <span className="font-sans text-sm tracking-widest uppercase text-samara-ivory/80">Subtotal</span>
                        <span className="font-serif text-2xl text-samara-gold">{formatPriceSync(cartSubtotal, urlCurrency)}</span>
                      </div>
                      <SheetClose asChild>
                        <Link href="/checkout" className="w-full">
                          <Button className="w-full h-14 bg-samara-ivory hover:bg-samara-gold text-samara-void font-sans tracking-[0.2em] uppercase rounded-none transition-colors group flex items-center justify-center">
                            Proceed to Checkout
                            <ArrowRight className="w-4 h-4 ml-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                         <Link href="/cart" className="w-full mt-3 flex justify-center text-[10px] tracking-widest uppercase text-samara-ivory/60 hover:text-samara-gold underline underline-offset-4">
                            View Bag
                         </Link>
                      </SheetClose>
                    </div>
                  )}
                </SheetContent>
              </Sheet>

            </div>
          </div>
        </div>
      </header>
      
      {/* Ghost div to prevent content from jumping under fixed header on non-home pages */}
      {!isHome && <div className="h-24 w-full" />}
    </>
  );
}

export default Header;