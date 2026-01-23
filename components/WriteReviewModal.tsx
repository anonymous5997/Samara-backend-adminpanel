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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-serif text-[#D4AF37]">
            Write a Review
          </h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map(i => (
            <Star
              key={i}
              onClick={() => setRating(i)}
              className={`h-6 w-6 cursor-pointer ${
                i <= rating ? 'text-[#D4AF37]' : 'text-gray-600'
              }`}
              fill={i <= rating ? '#D4AF37' : 'none'}
            />
          ))}
        </div>

        {/* Review text */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Share your experience..."
          className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-white mb-3"
          rows={4}
        />

        {/* Image upload */}
        <input
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files?.[0] ?? null)}
          className="text-sm text-gray-400 mb-4"
        />

        {/* ✅ Updated Button: UX Guard for loading state */}
        <button
          onClick={submitReview}
          disabled={loading}
          className="w-full bg-[#D4AF37] text-black font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}