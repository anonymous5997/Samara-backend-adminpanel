'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { validateAdminImage } from '@/lib/admin/image-upload';

interface AdminImageFieldProps {
  id: string;
  label: string;
  /** URL currently saved on the row (null when none). */
  currentUrl: string | null;
  /** File chosen but not yet uploaded (uploaded on save). */
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** Clears both the pending file and the saved URL (saved as null). */
  onRemove: () => void;
  hint?: string;
}

export function AdminImageField({
  id,
  label,
  currentUrl,
  file,
  onFileChange,
  onRemove,
  hint,
}: AdminImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = filePreview ?? currentUrl;

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {previewUrl && (
        <div className="mt-2 mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="h-20 w-20 rounded-md border object-cover bg-gray-50"
          />
          <div className="flex flex-col gap-1">
            {file && (
              <span className="text-xs text-gray-500">
                New image, uploaded when you save
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetInput();
                onRemove();
              }}
            >
              Remove image
            </Button>
          </div>
        </div>
      )}
      <Input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          if (picked) {
            const problem = validateAdminImage(picked);
            if (problem) {
              toast.error(problem);
              resetInput();
              return;
            }
          }
          onFileChange(picked);
        }}
      />
      <p className="text-xs text-gray-500 mt-1">
        {hint ?? 'Images only, up to 8MB.'}
      </p>
    </div>
  );
}
