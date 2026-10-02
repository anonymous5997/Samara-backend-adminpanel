import { notFound } from 'next/navigation';
import { Reveal } from '@/components/motion/Reveal';
import { Marquee } from '@/components/motion/Marquee';

/**
 * DEVELOPMENT-ONLY design system specimen for visual QA of the redesign.
 * Returns 404 in production builds. Remove at the end of the redesign.
 */
export const metadata = { robots: { index: false, follow: false } };

const palette = [
  ['Black', '#000000', 'bg-samara-black'],
  ['Ink', '#080808', 'bg-samara-ink'],
  ['Charcoal', '#111111', 'bg-samara-char'],
  ['Ivory', '#F5F5F0', 'bg-samara-ivory'],
  ['Mute', '#A3A3A3', 'bg-samara-mute'],
  ['Gold', '#C9A35F', 'bg-samara-gold'],
  ['Deep gold', '#8A6420', 'bg-samara-gold-deep'],
] as const;

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="bg-samara-black text-samara-ivory">
      {/* Hero entrance specimen — uses an existing Samara asset */}
      <section className="relative h-[90svh] overflow-hidden md:h-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img_2599.jpeg"
          alt=""
          className="sm-anim-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        <div className="sm-container relative flex h-full flex-col justify-end pb-[12svh]">
          <p className="sm-eyebrow sm-anim-fade-up" style={{ ['--anim-delay' as string]: '200ms' }}>
            Specimen · Hero entrance
          </p>
          <h1 className="sm-display-xl mt-4">
            <span className="sm-line-mask">
              <span className="sm-anim-rise" style={{ ['--anim-delay' as string]: '250ms' }}>
                Samara
              </span>
            </span>
            <span className="sm-line-mask">
              <span className="sm-anim-rise sm-accent" style={{ ['--anim-delay' as string]: '450ms' }}>
                woven
              </span>
            </span>
          </h1>
          <p
            className="sm-body sm-anim-fade-up mt-6 max-w-md"
            style={{ ['--anim-delay' as string]: '650ms' }}
          >
            Placeholder supporting line. Final hero copy comes from the hero_slides table.
          </p>
          <div className="sm-anim-fade-up mt-8 flex flex-wrap gap-4" style={{ ['--anim-delay' as string]: '850ms' }}>
            <span className="sm-btn sm-btn-solid">Primary action</span>
            <span className="sm-btn sm-btn-ghost">Secondary</span>
          </div>
        </div>
      </section>

      <Marquee
        className="border-y border-samara-line py-5 text-[0.7rem] font-medium uppercase tracking-eyebrow text-samara-mute"
        items={['Specimen phrase one', 'Specimen phrase two', 'Specimen phrase three']}
      />

      <section className="sm-container sm-section space-y-24">
        <div>
          <p className="sm-eyebrow">Palette</p>
          <div className="mt-6 grid grid-cols-2 gap-px bg-samara-line sm:grid-cols-4 lg:grid-cols-7">
            {palette.map(([name, hex, cls]) => (
              <div key={hex} className="bg-samara-black p-4">
                <div className={`${cls} aspect-square border border-samara-line`} />
                <p className="mt-3 text-sm">{name}</p>
                <p className="text-xs text-samara-mute">{hex}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <p className="sm-eyebrow">Type scale — Cormorant Garamond / Manrope</p>
          <p className="sm-display-xl">Display XL</p>
          <p className="sm-display-l">
            Display L with an <span className="sm-accent">accent</span>
          </p>
          <p className="sm-display-m">Display M — section heading</p>
          <p className="sm-display-s">Display S — product name</p>
          <p className="sm-body max-w-xl">
            Body — Manrope 15/1.7 in muted grey. Used for supporting text, metadata and
            descriptions. Prices and navigation also use the sans.
          </p>
          <p className="text-sm font-semibold tracking-wide">₹ 12,500 <span className="ml-2 text-samara-mute line-through">₹ 15,000</span></p>
        </div>

        <div className="space-y-6">
          <p className="sm-eyebrow">Controls</p>
          <div className="flex flex-wrap items-center gap-6">
            <button className="sm-btn sm-btn-solid">Add to bag</button>
            <button className="sm-btn sm-btn-ghost">Wishlist</button>
            <a href="#" className="sm-link text-xs font-semibold uppercase tracking-eyebrow">
              Text link
            </a>
          </div>
        </div>

        <div>
          <p className="sm-eyebrow">Scroll reveals — up / fade / mask / scale</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {(['up', 'fade', 'mask', 'scale'] as const).map((variant, i) => (
              <Reveal key={variant} variant={variant} delay={i * 120}>
                <div className="sm-zoom aspect-[3/4] bg-samara-char">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img_2601.jpeg" alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <p className="sm-eyebrow mt-3">{variant}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
