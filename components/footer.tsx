import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-samara-void1 border-t border-samara-gold/10 mt-auto text-samara-ivory">
      <div className="container mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="inline-block mb-8">
              <div className="relative w-40 h-12">
                <Image
                  src="/samara-logo.png"
                  alt="Samara"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <p className="text-sm font-sans leading-relaxed text-samara-ivory/70 max-w-sm mb-8">
              Timeless. Ethical. Exquisite. Discover the finest handcrafted Indian fashion woven with heritage craftsmanship for the modern era.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-samara-gold/70 hover:text-samara-gold transition-colors">
                <Instagram className="w-5 h-5 stroke-[1.5]" />
              </a>
              <a href="#" className="text-samara-gold/70 hover:text-samara-gold transition-colors">
                <Facebook className="w-5 h-5 stroke-[1.5]" />
              </a>
              <a href="#" className="text-samara-gold/70 hover:text-samara-gold transition-colors">
                <Twitter className="w-5 h-5 stroke-[1.5]" />
              </a>
            </div>
          </div>

          {/* LINKS COLUMN 1 */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-serif text-lg text-samara-gold mb-6 tracking-wide">Collections</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/sarees" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  Sarees
                </Link>
              </li>
              <li>
                <Link href="/collections/coord-sets" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  Co-ord Sets
                </Link>
              </li>
              <li>
                <Link href="/collections/kurta-sets" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  Kurta Sets
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  Shop All
                </Link>
              </li>
            </ul>
          </div>

          {/* LINKS COLUMN 2 */}
          <div className="lg:col-span-2">
            <h4 className="font-serif text-lg text-samara-gold mb-6 tracking-wide">Assistance</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/contact" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-[11px] font-sans uppercase tracking-[0.15em] text-samara-ivory/60 hover:text-samara-gold transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER COLUMN */}
          <div className="lg:col-span-3">
            <h4 className="font-serif text-lg text-samara-gold mb-6 tracking-wide">The Inner Circle</h4>
            <p className="text-xs font-sans text-samara-ivory/70 mb-6 leading-relaxed">
              Subscribe to receive updates, access to exclusive collections, and styling inspiration.
            </p>
            <form className="relative flex items-center group">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-transparent border-b border-samara-gold/30 pb-3 text-sm text-samara-ivory placeholder:text-samara-ivory/30 focus:outline-none focus:border-samara-gold transition-colors"
                required
              />
              <button
                type="submit"
                className="absolute right-0 bottom-3 text-samara-gold/50 group-hover:text-samara-gold transition-colors"
              >
                <ArrowRight className="w-5 h-5 stroke-[1.5]" />
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="border-t border-samara-gold/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-samara-ivory/40">
            &copy; {new Date().getFullYear()} Samara Select. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link href="/privacy-policy" className="text-[10px] font-sans uppercase tracking-[0.2em] text-samara-ivory/40 hover:text-samara-gold transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-[10px] font-sans uppercase tracking-[0.2em] text-samara-ivory/40 hover:text-samara-gold transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
