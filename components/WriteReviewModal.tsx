'use client';

import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function WriteReviewModal({
  isOpen,
  onClose,
  productId,
}: {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submitReview = async () => {
    if (!text.trim()) {
      toast.error('Please write a review');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login');
      return;
    }

    setLoading(true);

    let imageUrl: string | null = null;

    // Upload image if provided
    if (image) {
      const filePath = `reviews/${user.id}-${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(filePath, image);

      if (uploadError) {
        toast.error('Image upload failed');
        setLoading(false);
        return;
      }

      imageUrl = supabase.storage
        .from('review-images')
        .getPublicUrl(filePath).data.publicUrl;
    }

    // Insert Review
    const { error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        review_text: text,
        review_image_url: imageUrl,
      });

    setLoading(false);

    if (error) {
      // ✅ HANDLE DUPLICATE REVIEW SAFELY (Postgres Error 23505)
      if (error.code === '23505') {
        toast.error('You have already reviewed this product.');
        onClose();
        return;
      }

      // Generic fallback
      toast.error('Something went wrong. Please try again.');
      return;
    }

    toast.success('Review submitted');
    onClose();
    window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="write-review-title"
      className="storefront fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 backdrop-blur-[2px] sm:items-center"
    >
      <div className="max-h-[100dvh] w-full max-w-md overflow-y-auto border border-samara-line bg-samara-ink p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-samara-ivory sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="sm-eyebrow">Your review</p>
            <h3 id="write-review-title" className="mt-3 font-serif text-[2rem] font-light leading-none text-samara-ivory">
              Write a <span className="sm-accent">Review</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>

        {/* Stars */}
        <p className="mt-7 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-samara-mute">Rating</p>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === rating}
              aria-label={`${i} star${i > 1 ? 's' : ''}`}
              onClick={() => setRating(i)}
              className="-ml-1 flex h-11 w-11 items-center justify-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
            >
              <Star
                aria-hidden
                className={`h-6 w-6 ${
                  i <= rating ? 'text-samara-gold' : 'text-samara-mute/50'
                }`}
                fill={i <= rating ? 'currentColor' : 'none'}
                strokeWidth={1.25}
              />
            </button>
          ))}
        </div>

        {/* Review text */}
        <label htmlFor="write-review-text" className="mt-6 block font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-samara-mute">
          Review
        </label>
        <textarea
          id="write-review-text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share your experience..."
          className="mt-2 w-full resize-y rounded-none border border-samara-line bg-transparent p-3 font-sans text-[0.875rem] text-samara-ivory placeholder:text-samara-mute/70 focus:border-samara-gold focus:outline-none focus:ring-1 focus:ring-samara-gold"
          rows={4}
        />

        {/* Image upload */}
        <label htmlFor="write-review-image" className="mt-6 block font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-samara-mute">
          Photo (optional)
        </label>
        <input
          id="write-review-image"
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full font-sans text-[0.8125rem] text-samara-mute file:mr-4 file:min-h-[44px] file:cursor-pointer file:border file:border-solid file:border-samara-ivory/40 file:bg-transparent file:px-4 file:font-sans file:text-[0.6875rem] file:font-semibold file:uppercase file:tracking-[0.2em] file:text-samara-ivory hover:file:border-samara-ivory"
        />

        {/* ✅ Updated Button: UX Guard for loading state */}
        <button
          type="button"
          onClick={submitReview}
          disabled={loading}
          className="sm-btn mt-8 w-full bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}
