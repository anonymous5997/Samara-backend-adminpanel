"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/header"; 
import { Footer } from "@/components/footer";
import { usePathname } from "next/navigation";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <AuthProvider>
      <CartProvider>
        {isAdmin ? (
          children
        ) : (
          <div className="storefront flex min-h-screen flex-col bg-samara-void text-samara-ivory">
            {/* ✅ Suspense wraps ONLY the Header (for search params) */}
            {/* It is INSIDE CartProvider, so Cart state is safe */}
            <Suspense fallback={<div className="h-[72px] w-full bg-samara-void" />}>
              <Header />
            </Suspense>

            <main className="flex-1">
              {children}
            </main>

            <Footer />
          </div>
        )}
      </CartProvider>
    </AuthProvider>
  );
}