'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Category } from '@/lib/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { AdminImageField } from '@/components/admin/AdminImageField';
import { uploadAdminImage } from '@/lib/admin/image-upload';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  image_url: null as string | null,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  // Image chosen in the dialog; uploaded to hero-media/categories/ on save.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadAdminImage(imageFile, 'categories');
        if (!uploadedUrl) {
          toast.error('Failed to upload image');
          return;
        }
        imageUrl = uploadedUrl;
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        image_url: imageUrl,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert({
          ...payload,
          is_active: true,
        });

        if (error) throw error;
        toast.success('Category created');
      }

      setDialogOpen(false);
      setEditingCategory(null);
      setFormData(emptyForm);
      setImageFile(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || null,
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) throw error;
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <>
      <Toaster />
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Categories</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData(emptyForm);
                  setImageFile(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Add Category'}
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
                        slug: name.toLowerCase().replace(/\s+/g, '-'),
                      });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <AdminImageField
                  id="categoryImage"
                  label="Image (optional)"
                  currentUrl={formData.image_url}
                  file={imageFile}
                  onFileChange={setImageFile}
                  onRemove={() => {
                    setImageFile(null);
                    setFormData({ ...formData, image_url: null });
                  }}
                />
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving
                    ? 'Saving…'
                    : `${editingCategory ? 'Update' : 'Create'} Category`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.image_url}
                          alt=""
                          className="h-10 w-10 rounded object-cover border"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
