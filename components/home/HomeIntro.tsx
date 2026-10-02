import Link from 'next/link';
import { Reveal } from '@/components/motion/Reveal';

/**
 * Samara introduction. The <h1> "Samara" and the platform description are
 * required verbatim for Google OAuth verification — do not change the text.
 */
export function HomeIntro() {
  return (
    <section aria-labelledby="home-intro-title" className="sm-section bg-samara-forest">
      <div className="sm-container grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
        <Reveal className="lg:col-span-7">
          <p className="sm-eyebrow mb-6 flex items-center gap-4 text-samara-gold">
            The House of
            <span aria-hidden className="block h-px w-12 bg-samara-gold/50" />
          </p>
          <h1 id="home-intro-title" className="sm-display-l font-light max-sm:text-[3.75rem]">
            Samara
          </h1>
          <p className="mt-5 font-serif text-2xl font-light italic leading-tight text-samara-gold md:text-3xl">
            Premium Saree &amp; Fashion Platform
          </p>
        </Reveal>

        <Reveal delay={150} className="lg:col-span-5 lg:pb-2">
          <div className="sm-hairline mb-8" />
          <p className="sm-body max-w-xl">
            Samara is an online fashion and e-commerce platform that allows users
            to browse and purchase handcrafted Sambalpuri sarees and traditional
            Indian apparel. Users can create accounts or sign in using email,
            Google, or Facebook to manage their profiles, delivery addresses,
            and orders.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-samara-ivory">
            <Link href="/sarees" className="sm-link">
              Sarees
            </Link>
            <Link href="/about" className="sm-link">
              Our Story
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
