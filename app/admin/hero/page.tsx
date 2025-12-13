// app/admin/hero/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function AdminHeroPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaHref, setCtaHref] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [sortOrder, setSortOrder] = useState('1');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      toast.error('Title and media file are required');
      return;
    }

    setSaving(true);

    try {
      // upload into hero-media bucket
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        toast.error('Failed to upload media');
        setSaving(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('hero-media').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('hero_slides').insert([
        {
          title,
          subtitle: subtitle || null,
          cta_label: ctaLabel || null,
          cta_href: ctaHref || null,
          media_type: mediaType,
          media_url: publicUrl,
          sort_order: Number(sortOrder) || 1,
          is_active: true,
        },
      ]);

      if (insertError) {
        console.error(insertError);
        toast.error('Failed to save hero slide');
        setSaving(false);
        return;
      }

      toast.success('Hero slide saved');
      router.push('/admin/hero-slides');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Homepage Hero</h1>
          <Button variant="outline" onClick={() => router.push('/admin/hero-slides')}>
            Back
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white rounded-lg border p-6 shadow-sm"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Festive Elegance"
              required
            />
          </div>

          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              rows={3}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Celebrate every moment with our exclusive festive collection…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ctaLabel">CTA Label</Label>
              <Input
                id="ctaLabel"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Shop The Edit"
              />
            </div>
            <div>
              <Label htmlFor="ctaHref">CTA Link</Label>
              <Input
                id="ctaHref"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="/shop?category=festive-edit"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mediaType">Media Type</Label>
              <select
                id="mediaType"
                className="border rounded-md h-10 px-3 w-full text-sm"
                value={mediaType}
                onChange={(e) =>
                  setMediaType(e.target.value as 'image' | 'video')
                }
              >
                <option value="image">Image</option>
                <option value="video">Video (MP4)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="file">
                Hero {mediaType === 'image' ? 'Image' : 'Video'}
              </Label>
              <Input
                id="file"
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/mp4,video/*'}
                onChange={(e) =>
                  setFile(e.target.files?.[0] ? e.target.files[0] : null)
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: large, high-quality hero {mediaType}.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="sortOrder">Slide Order (1–4)</Label>
            <Input
              id="sortOrder"
              type="number"
              min={1}
              max={4}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use different numbers (1, 2, 3, 4) for each hero banner.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/hero-slides')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Hero'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
