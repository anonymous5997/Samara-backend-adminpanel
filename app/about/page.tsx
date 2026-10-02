import { Reveal } from '@/components/motion/Reveal';
import Image from 'next/image';
import { PageHero } from '@/components/content/PageHero';
import { getSiteImage } from '@/lib/site-images';

// Re-check the Site Images "about" photo at most once a minute.
export const revalidate = 60;

const WOVEN_PANEL =
  'relative min-h-[22rem] overflow-hidden border-b border-samara-line sm:min-h-[28rem] lg:min-h-[44rem] lg:border-b-0 lg:border-r';

const VALUES = [
  {
    title: 'Authentic Craftsmanship',
    desc: 'Every saree is handwoven by skilled artisans using traditional techniques',
  },
  {
    title: 'Premium Quality',
    desc: 'We source only the finest materials and ensure rigorous quality standards',
  },
  {
    title: 'Sustainable Fashion',
    desc: 'Supporting local communities and eco-friendly production practices',
  },
];

export default async function AboutPage() {
  const wovenImage = await getSiteImage('about');

  return (
    <div className="bg-samara-black text-samara-ivory">
      {/* Hero band */}
      <PageHero
        eyebrow="Our Story"
        title="About"
        accent="Samara"
        intro="Where heritage meets modern elegance"
      />

      {/* Woven Luxury — photo (Admin → Site Images) or beige logo panel + story */}
      <section aria-labelledby="about-woven" className="bg-samara-forest">
        <div className="grid lg:grid-cols-2">
          {wovenImage ? (
            <div className={`${WOVEN_PANEL} bg-samara-char`}>
              <Image
                src={wovenImage.url}
                alt=""
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div aria-hidden className={`${WOVEN_PANEL} flex items-center justify-center bg-samara-cream`}>
              <div className="absolute inset-5 border border-samara-gold-deep/30 sm:inset-10 lg:inset-14" />
              <div className="absolute inset-7 border border-samara-gold-deep/10 sm:inset-12 lg:inset-16" />
              <Reveal variant="fade" className="relative flex w-full items-center justify-center">
                <Image
                  src="/brand/samara-logo-beige.png"
                  alt=""
                  width={1200}
                  height={1200}
                  sizes="(min-width: 1024px) 35vw, 70vw"
                  className="h-auto w-[70%]"
                />
              </Reveal>
            </div>
          )}

          <div className="flex items-center">
            <Reveal className="w-full px-[var(--sm-gutter)] py-16 sm:py-20 lg:px-[clamp(3rem,6vw,7rem)] lg:py-24">
              <p className="sm-eyebrow flex items-center gap-4 text-samara-gold">
                01
                <span aria-hidden className="block h-px w-12 bg-samara-gold/50" />
              </p>
              <h2 id="about-woven" className="sm-display-l mt-6 font-light">
                Woven <span className="sm-accent">Luxury</span>
              </h2>
              <div className="mt-8 max-w-md space-y-5">
                <p className="sm-body">
                  At Samara, we celebrate the timeless art of saree weaving. Each piece in our collection
                  is a testament to generations of skilled craftsmanship, meticulously handwoven by master
                  artisans who pour their heritage into every thread.
                </p>
                <p className="sm-body">
                  Our sarees are more than garments &mdash; they are wearable art, designed to make every woman
                  feel like royalty. From the lustrous silks of Banaras to the delicate cottons of Bengal,
                  we bring you the finest textiles India has to offer.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Indian Heritage, Modern Elegance — cream editorial band */}
      <section aria-labelledby="about-heritage" className="sm-section bg-samara-cream text-samara-cream-ink">
        <div className="sm-container grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="sm-eyebrow flex items-center gap-4 text-samara-gold-deep">
              02
              <span aria-hidden className="block h-px w-12 bg-samara-gold-deep/50" />
            </p>
            <h2
              id="about-heritage"
              className="sm-display-m mt-6 font-light !text-samara-cream-ink"
            >
              Indian Heritage, <span className="sm-accent !text-samara-gold-deep">Modern Elegance</span>
            </h2>
          </Reveal>

          <Reveal delay={150} className="lg:col-span-6 lg:col-start-7 lg:pt-14">
            <div className="mb-8 h-px w-full bg-samara-cream-2" />
            <div className="space-y-6 font-sans text-[0.9375rem] leading-[1.8] text-samara-cream-mute sm:text-base">
              <p className="font-serif text-xl font-light leading-relaxed text-samara-cream-ink sm:text-[1.375rem]">
                Founded on the belief that tradition and modernity can coexist beautifully, Samara bridges
                the gap between classical Indian textiles and contemporary fashion sensibilities. We work
                directly with weavers and artisan communities across India, ensuring fair compensation and
                preserving ancient weaving techniques for future generations.
              </p>
              <p>
                Each Samara saree tells a story of dedication, skill, and passion. Whether you&apos;re looking
                for everyday elegance or showstopping festive wear, our curated collections offer something
                special for every occasion and every woman.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* For The Modern Woman — centred statement */}
      <section aria-labelledby="about-woman" className="sm-section bg-samara-black">
        <Reveal className="sm-container flex flex-col items-center text-center">
          <span aria-hidden className="mb-10 flex items-center gap-4">
            <span className="block h-px w-12 bg-samara-gold/40" />
            <span className="block h-1.5 w-1.5 rotate-45 border border-samara-gold/70" />
            <span className="block h-px w-12 bg-samara-gold/40" />
          </span>
          <p className="sm-eyebrow text-samara-gold">03</p>
          <h2 id="about-woman" className="sm-display-l mt-6 font-light">
            For The <span className="sm-accent">Modern Woman</span>
          </h2>
          <p className="mt-10 max-w-3xl font-serif text-xl font-light leading-relaxed text-samara-ivory/[0.82] sm:text-2xl">
            Today&apos;s Samara woman is confident, discerning, and appreciates quality. She values
            authenticity and seeks pieces that resonate with her personal style while honoring
            tradition. We design with her in mind, curating collections that blend heritage with
            contemporary aesthetics, making it easy to embrace the beauty of Indian handlooms
            in everyday life.
          </p>
        </Reveal>
      </section>

      {/* Values */}
      <section aria-label="Our values" className="border-t border-samara-line bg-samara-forest">
        <div className="sm-container">
          <ul className="grid divide-y divide-samara-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {VALUES.map((value, i) => (
              <li
                key={value.title}
                className="py-12 md:px-8 md:py-20 md:first:pl-0 md:last:pr-0 lg:px-12 lg:py-24"
              >
                <Reveal delay={i * 120}>
                  <span className="font-serif text-lg italic text-samara-gold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-5 font-serif text-[1.75rem] font-light leading-tight text-samara-ivory lg:text-[2rem]">
                    {value.title}
                  </h3>
                  <p className="sm-body mt-4 max-w-xs">{value.desc}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
