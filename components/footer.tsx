import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#000000] border-t border-[#D4AF37]/10 mt-auto">
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="inline-block mb-6 group">
              <div className="relative w-48 h-14 transition-all duration-300 group-hover:scale-105">
                <Image
                  src="/samara-logo.png"
                  alt="Samara - Best Handcrafted Sambalpuri Sarees"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-sm text-[#CFCFCF] leading-relaxed">
              Discover the finest handcrafted Sambalpuri sarees. Authentic traditional Indian sarees woven with heritage craftsmanship for the modern woman.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/shop" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/sarees" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  Sarees
                </Link>
              </li>
              <li>
                <Link href="/collections/coord-sets" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  Co-ord Sets
                </Link>
              </li>
              <li>
                <Link href="/collections/kurta-sets" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  Kurta Sets
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-[#CFCFCF] hover:text-[#D4AF37] transition-colors duration-300">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-[#D4AF37]">Newsletter</h4>
            <p className="text-sm text-[#CFCFCF] mb-4 leading-relaxed">
              Subscribe to receive updates, access to exclusive deals, and more
            </p>
            <form className="flex gap-2 mb-6">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-[#050505] border border-[#D4AF37]/30 rounded-lg text-[#F5F5F5] placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] transition-colors text-sm"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-bold rounded-lg transition-all duration-300 hover:scale-105"
              >
                Send
              </button>
            </form>
            <div className="flex gap-4">
              <a href="#" className="text-[#D4AF37] hover:text-[#F4D03F] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-[#D4AF37] hover:text-[#F4D03F] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-[#D4AF37] hover:text-[#F4D03F] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#D4AF37]/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Samara. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/contact" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-[#D4AF37] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
