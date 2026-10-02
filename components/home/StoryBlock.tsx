import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { HOME_COPY, HOME_IMAGES } from '@/config/homepage';
import { getSiteImage } from '@/lib/site-images';

/** Type-set stand-in for the story photo when no image is set. */
function StoryMonogram() {
  return (
    <div
      aria-hidden
      className="relative flex min-h-[20rem] items-center justify-center overflow-hidden border-b border-samara-line bg-samara-forest-2 sm:min-h-[26rem] lg:min-h-[40rem] lg:border-b-0 lg:border-r"
    >
      <div className="absolute inset-5 border border-samara-gold/30 sm:inset-10 lg:inset-14" />
      <div className="absolute inset-7 border border-samara-gold/10 sm:inset-12 lg:inset-16" />
      <Reveal variant="fade" className="relative flex flex-col items-center">
        <span className="select-none font-serif text-[11rem] font-light italic leading-[0.8] text-samara-gold/25 sm:text-[15rem] lg:text-[22rem]">
          S
        </span>
        <span className="mt-6 flex items-center gap-4 text-[0.625rem] font-medium uppercase tracking-eyebrow text-samara-gold/70">
          <span className="block h-px w-8 bg-samara-gold/40" />
          Samara
          <span className="block h-px w-8 bg-samara-gold/40" />
        </span>
      </Reveal>
    </div>
  );
}

/**
 * "Our Story" split panel. The image comes from the `story` Site Images slot
 * (Admin → Site Images), then HOME_IMAGES.story in config/homepage.ts; with
 * neither, the left half is a type-set monogram.
 */
export async function StoryBlock() {
  const { story } = HOME_COPY;
  const slot = await getSiteImage('story');
  const image = slot ? { src: slot.url, alt: HOME_IMAGES.story?.alt ?? '' } : HOME_IMAGES.story;

  return (
    <section aria-labelledby="home-story-title" className="bg-samara-forest">
      <div className="grid lg:grid-cols-2">
        {image ? (
          <div className="sm-zoom relative aspect-[4/3] bg-samara-char lg:aspect-auto lg:min-h-[40rem]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <StoryMonogram />
        )}

        <div className="flex items-center">
          <Reveal className="w-full px-[var(--sm-gutter)] py-16 sm:py-20 lg:px-[clamp(3rem,6vw,7rem)] lg:py-24">
            <p className="sm-eyebrow flex items-center gap-4 text-samara-gold">
              {story.eyebrow}
              <span aria-hidden className="block h-px w-12 bg-samara-gold/50" />
            </p>
            <h2 id="home-story-title" className="sm-display-l mt-6 font-light">
              {story.titleLead} <span className="sm-accent">{story.titleAccent}</span>
            </h2>
            <div className="mt-8 max-w-md space-y-5">
              {story.body.map((para) => (
                <p key={para} className="sm-body">
                  {para}
                </p>
              ))}
            </div>
            <Link
              href={story.cta.href}
              className="sm-btn mt-10 border-samara-gold text-samara-gold hover:bg-samara-gold hover:text-samara-cream-ink"
            >
              {story.cta.label}
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
