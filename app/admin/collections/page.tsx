'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import type { Collection } from '@/lib/content';
import { Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { AdminImageField } from '@/components/admin/AdminImageField';
import { uploadAdminImage } from '@/lib/admin/image-upload';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  hero_title: '',
  hero_subtitle: '',
  hero_image_url: null as string | null,
  is_active: true,
  sort_order: '1',
};

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  // Once the admin edits the slug by hand, stop overwriting it from the name.
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(
          'id, name, slug, description, hero_title, hero_subtitle, hero_image_url, is_active, collection_type, category_id, sort_order'
        )
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCollections((data as Collection[]) || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    const nextOrder =
      collections.reduce((max, c) => Math.max(max, c.sort_order ?? 0), 0) + 1;
    setEditing(null);
    setFormData({ ...emptyForm, sort_order: String(nextOrder) });
    setSlugTouched(false);
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (collection: Collection) => {
    setEditing(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? '',
      hero_title: collection.hero_title ?? '',
      hero_subtitle: collection.hero_subtitle ?? '',
      hero_image_url: collection.hero_image_url ?? null,
      is_active: collection.is_active,
      sort_order: String(collection.sort_order ?? 1),
    });
    setSlugTouched(true);
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editing && !formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);

    try {
      let heroImageUrl = formData.hero_image_url;
      if (imageFile) {
        const uploadedUrl = await uploadAdminImage(imageFile, 'collections');
        if (!uploadedUrl) {
          toast.error('Failed to upload image');
          return;
        }
        heroImageUrl = uploadedUrl;
      }

      // Only existing collections columns are written.
      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        hero_title: formData.hero_title || null,
        hero_subtitle: formData.hero_subtitle || null,
        hero_image_url: heroImageUrl,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order) || 0,
      };

      if (editing) {
        const { error } = await supabase
          .from('collections')
          .update(payload)
          .eq('id', editing.id);

        if (error) throw error;
        toast.success('Collection updated');
      } else {
        const { error } = await supabase.from('collections').insert({
          ...payload,
          slug: formData.slug.trim(),
          collection_type: 'manual',
        });

        if (error) throw error;
        toast.success('Collection created');
      }

      setDialogOpen(false);
      setEditing(null);
      setFormData(emptyForm);
      setImageFile(null);
      fetchCollections();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster />
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Collections</h1>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Collection
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Collection' : 'Add Collection'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: slugTouched ? formData.slug : slugify(name),
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  required={!editing}
                  disabled={!!editing}
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setFormData({ ...formData, slug: e.target.value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editing
                    ? 'The slug is part of the collection URL and cannot be changed here.'
                    : 'Generated from the name; you can edit it. Used in the URL /collections/<slug>.'}
                </p>
              </div>
              <div>
                <Label htmlFor="heroTitle">Hero Title</Label>
                <Input
                  id="heroTitle"
                  value={formData.hero_title}
                  onChange={(e) =>
                    setFormData({ ...formData, hero_title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                <Input
                  id="heroSubtitle"
                  value={formData.hero_subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, hero_subtitle: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <AdminImageField
                id="heroImage"
                label="Hero Image (optional)"
                currentUrl={formData.hero_image_url}
                file={imageFile}
                onFileChange={setImageFile}
                onRemove={() => {
                  setImageFile(null);
                  setFormData({ ...formData, hero_image_url: null });
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="isActive"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active (show on storefront)</Label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving
                  ? 'Saving…'
                  : `${editing ? 'Update' : 'Create'} Collection`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Hero Title</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      No collections yet.
                    </TableCell>
                  </TableRow>
                )}
                {collections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      {collection.hero_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={collection.hero_image_url}
                          alt=""
                          className="h-10 w-16 rounded object-cover border"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {collection.name}
                    </TableCell>
                    <TableCell>{collection.slug}</TableCell>
                    <TableCell>{collection.hero_title || '-'}</TableCell>
                    <TableCell>{collection.sort_order}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          collection.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {collection.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(collection)}
                        aria-label={`Edit ${collection.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
