'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

interface HeroSlideRow {
  id: string;
  title: string;
  sort_order: number | null;
  is_active: boolean | null;
  media_type: 'image' | 'video' | null;
}

export default function HeroSlidesListPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSlides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_slides')
      .select('id, title, sort_order, is_active, media_type')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setSlides(data as HeroSlideRow[]);
    } else {
      console.error('Error loading hero slides:', error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Delete this hero slide? This cannot be undone.');
    if (!ok) return;

    setDeletingId(id);
    const { error } = await supabase.from('hero_slides').delete().eq('id', id);

    if (error) {
      console.error('Error deleting hero slide:', error);
      setDeletingId(null);
      return;
    }

    await fetchSlides();
    setDeletingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Hero Slides</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">
            Active on homepage: {slides.filter((s) => s.is_active).length} / 4
          </p>
          <Button onClick={() => router.push('/admin/hero')}>
            + Add Hero Slide
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hero slides yet. Click “Add Hero Slide” to create one.
        </div>
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-20">
                  Order
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-32">
                  Media
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-32">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide) => (
                <tr key={slide.id} className="border-b last:border-0">
                  <td className="px-4 py-3 align-middle">
                    #{slide.sort_order ?? '-'}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="font-medium">{slide.title}</span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Badge variant="outline">
                      {slide.media_type === 'video' ? 'Video' : 'Image'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Badge variant={slide.is_active ? 'default' : 'outline'}>
                      {slide.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        asChild
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Link href={`/admin/hero/${slide.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(slide.id)}
                        disabled={deletingId === slide.id}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
