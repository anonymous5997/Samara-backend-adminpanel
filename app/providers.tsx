"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/header"; 
import { Footer } from "@/components/footer";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col bg-black">
          
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
      </CartProvider>
    </AuthProvider>
  );
}