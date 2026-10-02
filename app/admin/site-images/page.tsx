'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ImageOff, Trash2, Upload } from 'lucide-react';
import {
  SITE_IMAGE_SLOTS,
  siteImagePath,
  type SiteImageKey,
  type SiteImageSlot,
} from '@/lib/site-images/slots';
import {
  fetchSiteImagePreview,
  removeSiteImage,
  uploadSiteImage,
  validateAdminImage,
} from '@/lib/site-images/admin';

type Previews = Partial<Record<SiteImageKey, string | null>>;

/**
 * Admin → Site Images. One card per fixed slot in hero-media/site/<key>.
 * Upload overwrites the slot (upsert); Remove deletes it so the storefront
 * falls back to its default design. The storefront re-checks every ~60s.
 */
export default function AdminSiteImagesPage() {
  const [previews, setPreviews] = useState<Previews>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (key: SiteImageKey) => {
    const url = await fetchSiteImagePreview(key);
    setPreviews((prev) => ({ ...prev, [key]: url }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        SITE_IMAGE_SLOTS.map(async (slot) => [slot.key, await fetchSiteImagePreview(slot.key)] as const),
      );
      if (!cancelled) {
        setPreviews(Object.fromEntries(entries) as Previews);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Toaster />
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Site Images</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Replace the editorial photos on the storefront. Each slot holds one image; when a slot is
            empty the page keeps its default design. Changes are live within about a minute.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SITE_IMAGE_SLOTS.map((slot) => (
            <SlotCard
              key={slot.key}
              slot={slot}
              loading={loading}
              previewUrl={previews[slot.key] ?? null}
              onChanged={() => refresh(slot.key)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function SlotCard({
  slot,
  loading,
  previewUrl,
  onChanged,
}: {
  slot: SiteImageSlot;
  loading: boolean;
  previewUrl: string | null;
  onChanged: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const inputId = `site-image-${slot.key}`;

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const problem = validateAdminImage(file);
    if (problem) {
      toast.error(problem);
      resetInput();
      return;
    }

    setBusy('upload');
    const error = await uploadSiteImage(slot.key, file);
    resetInput();
    if (error) {
      toast.error(`Upload failed: ${error}`);
    } else {
      toast.success(`${slot.label} updated. Live within ~1 minute.`);
      await onChanged();
    }
    setBusy(null);
  };

  const handleRemove = async () => {
    if (!confirm(`Remove the "${slot.label}" image? The page will use its default design.`)) return;
    setBusy('remove');
    const error = await removeSiteImage(slot.key);
    if (error) {
      toast.error(`Remove failed: ${error}`);
    } else {
      toast.success(`${slot.label} removed. Default design returns within ~1 minute.`);
    }
    await onChanged();
    setBusy(null);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{slot.label}</CardTitle>
        <CardDescription>{slot.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border bg-gray-50">
          {loading ? (
            <span className="text-sm text-gray-400">Checking…</span>
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={`${slot.label} preview`} className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm text-gray-500">
              <ImageOff className="h-6 w-6" />
              Using default design
            </span>
          )}
        </div>
        <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs text-gray-600">
          <dt className="font-medium text-gray-900">Shown on</dt>
          <dd>{slot.usedOn}</dd>
          <dt className="font-medium text-gray-900">Recommended</dt>
          <dd>{slot.recommendedSize}</dd>
          <dt className="font-medium text-gray-900">Default</dt>
          <dd>{slot.fallback}</dd>
          <dt className="font-medium text-gray-900">File</dt>
          <dd className="font-mono">hero-media/{siteImagePath(slot.key)}</dd>
        </dl>
      </CardContent>
      <CardFooter className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {busy === 'upload' ? 'Uploading…' : previewUrl ? 'Replace' : 'Upload'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy !== null || !previewUrl}
          onClick={handleRemove}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {busy === 'remove' ? 'Removing…' : 'Remove'}
        </Button>
      </CardFooter>
      <p className="px-6 pb-4 text-xs text-gray-500">Images only, up to 8MB.</p>
    </Card>
  );
}
