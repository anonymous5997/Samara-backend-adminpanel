// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import ClientProviders from "./providers";
import Script from "next/script";
import { Cormorant_Garamond, Manrope } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Samara - Premium Indian Fashion | Tradition Meets Tomorrow",
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
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
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
