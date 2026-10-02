import Link from 'next/link';
import Image from 'next/image';
import { Reveal } from '@/components/motion/Reveal';

interface FooterLink {
  label: string;
  href: string;
}

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Shop',
    links: [
      { label: 'Shop All', href: '/shop' },
      { label: 'Sarees', href: '/sarees' },
      { label: 'Collections', href: '/collections' },
      { label: 'Festive Edit', href: '/festive-edit' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Track Order', href: '/track-order' },
      { label: 'Return Policy', href: '/return-policy' },
    ],
  },
  {
    heading: 'House',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Return Policy', href: '/return-policy' },
];

// Real social profile URLs are pending from the owner. Add entries here
// (e.g. { label: 'Instagram', href: 'https://…' }) and the row appears.
const SOCIAL_LINKS: { label: string; href: string }[] = [];

const linkClass =
  'text-samara-ivory/80 transition-colors duration-300 hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto overflow-hidden border-t border-samara-line bg-samara-black text-samara-ivory">
      <div className="sm-container pt-20 md:pt-28">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-10">
          {/* House statement */}
          <div className="lg:col-span-5">
            <Link
              href="/"
              aria-label="Samara home"
              className="inline-block focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold"
            >
              <Image
                src="/brand/samara-logo-transparent.png"
                alt="Samara - Best Handcrafted Sambalpuri Sarees"
                width={794}
                height={290}
                sizes="176px"
                className="h-auto w-36 md:w-44"
              />
            </Link>
            <p className="sm-body mt-8 max-w-sm text-sm leading-relaxed">
              Discover the finest handcrafted Sambalpuri sarees. Authentic traditional Indian sarees woven with heritage craftsmanship for the modern woman.
            </p>
            <p className="sm-eyebrow mt-10 flex items-center gap-4">
              <span aria-hidden className="h-px w-8 bg-samara-line" />
              Payments secured by Razorpay
            </p>
          </div>

          {/* Link columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:col-span-6 lg:col-start-7"
          >
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h2 className="sm-eyebrow">{column.heading}</h2>
                <ul className="mt-6 space-y-1 font-sans text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${linkClass} inline-flex min-h-[44px] items-center md:min-h-[36px]`}
                      >
                        <span className="sm-link">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {SOCIAL_LINKS.length > 0 && (
          <ul className="mt-16 flex flex-wrap gap-x-8 gap-y-2 font-sans text-sm">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex min-h-[44px] items-center`}
                >
                  <span className="sm-link">{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Signature. Solid tone (ivory at ~10% over black) rather than an
          alpha colour, so glyphs that overlap under tight tracking don't
          double up. */}
      <Reveal variant="mask" className="mt-20 md:mt-28">
        <p
          aria-hidden
          className="select-none whitespace-nowrap text-center font-serif font-light uppercase leading-[0.78] tracking-[-0.03em] text-[#1d1d1b]"
          style={{ fontSize: 'clamp(4rem, 23vw, 22rem)' }}
        >
          Samara
        </p>
      </Reveal>

      {/* Bottom bar */}
      <div className="sm-container">
        <div className="flex flex-col gap-4 border-t border-samara-line py-8 font-sans text-xs text-samara-mute md:flex-row md:items-center md:justify-between">
          <p>&copy; {year} Samara. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center transition-colors duration-300 hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold md:min-h-0"
                >
                  <span className="sm-link">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
