'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

type MediaType = 'image' | 'video';

export default function AdminEditHeroSlidePage() {
  const params = useParams();
  const router = useRouter();
  const slideId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaHref, setCtaHref] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [file, setFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);

  // 1) Load existing slide
  useEffect(() => {
    const loadSlide = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('hero_slides')
        .select(
          `
          title,
          subtitle,
          cta_label,
          cta_href,
          media_type,
          media_url,
          sort_order,
          is_active
        `
        )
        .eq('id', slideId)
        .single();

      if (error || !data) {
        console.error(error);
        toast.error('Failed to load hero slide');
        router.push('/admin/hero-slides');
        return;
      }

      setTitle(data.title ?? '');
      setSubtitle(data.subtitle ?? '');
      setCtaLabel(data.cta_label ?? '');
      setCtaHref(data.cta_href ?? '');
      setMediaType((data.media_type as MediaType) ?? 'image');
      setExistingMediaUrl(data.media_url ?? null);
      setSortOrder(String(data.sort_order ?? 1));
      setIsActive(data.is_active ?? true);

      setLoading(false);
    };

    loadSlide();
  }, [slideId, router]);

  // 2) Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);

    try {
      let mediaUrl = existingMediaUrl;

      if (file) {
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

        mediaUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('hero_slides')
        .update({
          title,
          subtitle: subtitle || null,
          cta_label: ctaLabel || null,
          cta_href: ctaHref || null,
          media_type: mediaType,
          media_url: mediaUrl,
          sort_order: Number(sortOrder) || 1,
          is_active: isActive,
        })
        .eq('id', slideId);

      if (updateError) {
        console.error(updateError);
        toast.error('Failed to update hero slide');
      } else {
        toast.success('Hero slide updated');
        router.push('/admin/hero-slides');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // 3) Delete slide
  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this hero slide?',
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', slideId);

    if (error) {
      console.error(error);
      toast.error('Failed to delete hero slide');
    } else {
      toast.success('Hero slide deleted');
      router.push('/admin/hero-slides');
    }
  };

  if (loading) {
    return (
      <>
        <Toaster />
        <div className="max-w-3xl mx-auto py-12">
          <p>Loading hero slide…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Hero Slide</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/hero-slides')}
          >
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
                  setMediaType(e.target.value as MediaType)
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
              {existingMediaUrl && (
                <p className="text-xs text-gray-500 mt-1">
                  Current:{' '}
                  <a
                    href={existingMediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    preview
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortOrder">Slide Order (1–4)</Label>
              <Input
                id="sortOrder"
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Homepage shows up to 4 active slides by lowest order.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active (show on homepage)</Label>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Slide
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/hero-slides')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
