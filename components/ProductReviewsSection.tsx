'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { isOptimizable } from '@/components/pdp/pdp-utils';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  review_image_url?: string | null;
  created_at: string;
  profiles?: {
    name: string;
  };
}

function reviewDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function ProductReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) {
    return (
      <div className="border-t border-samara-line pt-8 lg:border-t-0 lg:pt-2">
        <p className="font-serif text-[1.5rem] font-light italic text-samara-ivory/80">
          No reviews yet.
        </p>
        <p className="mt-2 font-sans text-[0.8125rem] text-samara-mute">
          Be the first to review this saree.
        </p>
      </div>
    );
  }

  return (
    <ol className="border-t border-samara-line">
      {reviews.map((r) => {
        const date = reviewDate(r.created_at);
        return (
          <li key={r.id} className="grid gap-4 border-b border-samara-line py-8 sm:grid-cols-[1fr_auto] sm:gap-8">
            <div className="min-w-0">
              {/* Rating */}
              <p className="flex gap-1" aria-label={`Rated ${r.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className={`h-3.5 w-3.5 ${i <= r.rating ? 'text-samara-gold' : 'text-samara-mute/50'}`}
                    fill={i <= r.rating ? 'currentColor' : 'none'}
                    strokeWidth={1.25}
                  />
                ))}
              </p>

              {/* Review text */}
              <p className="mt-4 whitespace-pre-line break-words font-serif text-[1.25rem] font-light leading-snug text-samara-ivory sm:text-[1.375rem]">
                {r.review_text}
              </p>

              {/* ✅ UPDATED: Polished User Name & Verified Badge */}
              <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-samara-mute">
                <span className="text-samara-ivory/90">
                  {r.profiles?.name ?? 'Verified Buyer'}
                </span>

                {r.profiles?.name && (
                  <span className="text-samara-gold">
                    Verified Buyer
                  </span>
                )}

                {date && (
                  <time dateTime={r.created_at} className="normal-case tracking-normal">
                    {date}
                  </time>
                )}
              </p>
            </div>

            {/* Review image */}
            {r.review_image_url && (
              <span className="relative block h-32 w-28 bg-samara-char sm:h-40 sm:w-32">
                <Image
                  src={r.review_image_url}
                  alt="Customer review"
                  fill
                  sizes="128px"
                  unoptimized={!isOptimizable(r.review_image_url)}
                  className="object-cover"
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
