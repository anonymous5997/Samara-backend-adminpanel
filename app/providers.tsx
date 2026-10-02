"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/header"; 
import { Footer } from "@/components/footer";
import { ShellProvider } from "@/components/shell/ShellProvider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  // The storefront design system (fonts, tokens, base type) is scoped to
  // `.storefront` so the admin panel keeps its current appearance.
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  // Radix portals (drawers, menus, toasts) mount on <body>, outside the
  // wrapper below, so mirror the scope class there too.
  useEffect(() => {
    document.body.classList.toggle("storefront", !isAdmin);
  }, [isAdmin]);

  return (
    <AuthProvider>
      <CartProvider>
        <ShellProvider>
          <div
            className={`flex min-h-screen flex-col ${isAdmin ? "bg-black" : "storefront bg-samara-black"}`}
          >
          
            {/* ✅ Suspense wraps ONLY the Header (for search params) */}
            {/* It is INSIDE CartProvider, so Cart state is safe */}
            <Suspense fallback={<div className="h-[72px] w-full bg-[#050505]" />}>
              <Header />
            </Suspense>

            <main className="flex-1">
              {children}
            </main>

            <Footer />
          </div>
        </ShellProvider>
      </CartProvider>
    </AuthProvider>
  );
}