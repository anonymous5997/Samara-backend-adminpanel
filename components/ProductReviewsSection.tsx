'use client';

import { Star } from 'lucide-react';

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

export function ProductReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) {
    return (
      <p className="text-gray-500 text-sm">
        No reviews yet. Be the first to review this saree.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="border border-[#D4AF37]/20 rounded-lg p-4 bg-[#050505]"
        >
          {/* Rating */}
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i <= r.rating ? 'text-[#D4AF37]' : 'text-gray-600'
                }`}
                fill={i <= r.rating ? '#D4AF37' : 'none'}
              />
            ))}
          </div>

          {/* Review text */}
          <p className="text-sm text-gray-300 leading-relaxed">
            {r.review_text}
          </p>

          {/* Review image */}
          {r.review_image_url && (
            <img
              src={r.review_image_url}
              alt="Customer review"
              className="mt-3 w-32 h-32 object-cover rounded-md border border-gold/20"
            />
          )}

          {/* ✅ UPDATED: Polished User Name & Verified Badge */}
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
            <span>
              {r.profiles?.name ?? 'Verified Buyer'}
            </span>

            {r.profiles?.name && (
              <span className="text-green-400 text-[11px]">
                • Verified Buyer
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}