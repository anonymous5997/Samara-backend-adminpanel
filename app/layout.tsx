// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import ClientProviders from "./providers";
import Script from "next/script";
import { Cormorant_Garamond, Manrope, Playfair_Display } from "next/font/google";

// Storefront display serif — hero, section headings, editorial statements.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Storefront UI / body sans — navigation, prices, buttons, metadata.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

// Kept for the admin panel, which still uses the previous heading font.
// Not preloaded so storefront pages don't pay for it.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-playfair",
  preload: false,
});

export const metadata: Metadata = {
  title: "Samara - Best Handcrafted Sambalpuri Sarees | Traditional Indian Sarees",
  description:
    "Discover the finest handcrafted Sambalpuri sarees at Samara. Authentic traditional Indian sarees woven with heritage craftsmanship.",
  icons: {
    icon: "/img_2601.jpeg",
    shortcut: "/img_2601.jpeg",
    apple: "/img_2601.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${manrope.variable} ${playfair.variable}`}
    >
      <head>
        {/* Brand intro: decide before first paint (every full load of "/",
            motion allowed; not on in-app navigation). CSS in globals.css does the rest. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(location.pathname==='/'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-intro','play')}}catch(e){}",
          }}
        />
        {/* Without JS, scroll-reveal content must never stay hidden. */}
        <noscript>
          <style>{`[data-reveal],[data-reveal]>*{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        {/* Razorpay SDK - Load AFTER page is interactive */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
