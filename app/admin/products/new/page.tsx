'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function AdminNewProductPage() {
  const router = useRouter();

  // basic
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');

  // pricing
  const [priceInr, setPriceInr] = useState('');
  const [mrpInr, setMrpInr] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('active');

  // media
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  // flags
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  // product attributes
  const [fabric, setFabric] = useState('');
  const [work, setWork] = useState('');
  const [occasion, setOccasion] = useState('');
  const [color, setColor] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [shippingTime, setShippingTime] = useState('');

  // why-women-love section
  const [whyWomenLove, setWhyWomenLove] = useState('');

  // tag flags
  const [isHandcrafted, setIsHandcrafted] = useState(false);
  const [isPremiumMaterial, setIsPremiumMaterial] = useState(false);
  const [isPerfectForSpecialOccasions, setIsPerfectForSpecialOccasions] =
    useState(false);

  // placement flags
  const [showInSarees, setShowInSarees] = useState(true);
  const [showInFestiveEdit, setShowInFestiveEdit] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !priceInr) {
      toast.error('Name and price are required');
      return;
    }

    if (!imageFiles || imageFiles.length === 0) {
      toast.error('Please select at least one product image');
      return;
    }

    setSaving(true);

    try {
      // 1) Create product first (without images)
      const { data: productInsertData, error: productError } = await supabase
        .from('products')
        .insert([
          {
            name,
            brand: brand || null,
            description: description || null,
            base_price_inr: Number(priceInr),
            mrp_inr: mrpInr ? Number(mrpInr) : null,
            status,
            is_active: status === 'active',

            is_bestseller: isBestseller,
            is_new_arrival: isNewArrival,
            slug: slugify(name),

            fabric: fabric || null,
            work: work || null,
            occasion: occasion || null,
            color: color || null,
            care_instructions: careInstructions || null,
            shipping_time: shippingTime || null,

            why_women_love: whyWomenLove || null,

            is_handcrafted: isHandcrafted,
            is_premium_material: isPremiumMaterial,
            is_perfect_for_special_occasions: isPerfectForSpecialOccasions,

            // important: these match your boolean columns
            show_in_sarees: showInSarees,
            show_in_festive_edit: showInFestiveEdit,
          },
        ])
        .select('id')
        .single();

      if (productError || !productInsertData) {
        console.error('Supabase product insert error:', productError);
        toast.error(
          productError?.message || 'Failed to create product (insert error)',
        );
        setSaving(false);
        return;
      }

      const productId = productInsertData.id as string;

      // 2) Upload images to Supabase Storage
      const filesArray = Array.from(imageFiles);
      const bucket = 'product-images';

      const imageRows: {
        product_id: string;
        image_url: string;
        is_primary: boolean;
        display_order: number;
      }[] = [];

      for (let index = 0; index < filesArray.length; index++) {
        const file = filesArray[index];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${index}.${ext}`;
        const filePath = `products/${fileName}`; // matches your existing paths

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload one of the images');
          setSaving(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(filePath);

        imageRows.push({
          product_id: productId,
          image_url: publicUrl,
          is_primary: index === 0,
          display_order: index,
        });
      }

      // 3) Insert product_images rows
      if (imageRows.length > 0) {
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRows);

        if (imagesError) {
          console.error('product_images insert error:', imagesError);
          toast.error('Product saved but failed to attach images');
          setSaving(false);
          return;
        }

        // 4) Update main image_url on products
        const primaryImage = imageRows[0];
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: primaryImage.image_url })
          .eq('id', productId);

        if (updateError) {
          console.error('Failed to set primary image_url:', updateError);
        }
      }

      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (err) {
      console.error('Unexpected error while saving product:', err);
      toast.error('Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products')}
          >
            Cancel
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white rounded-lg border p-6 shadow-sm"
        >
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Royal Silk Banarasi Saree"
                required
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Samara Heritage"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short description about this saree…"
              rows={4}
            />
          </div>

          {/* Product attributes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fabric">Fabric</Label>
              <Input
                id="fabric"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="Pure Kanjivaram Silk"
              />
            </div>
            <div>
              <Label htmlFor="work">Work / Weave</Label>
              <Input
                id="work"
                value={work}
                onChange={(e) => setWork(e.target.value)}
                placeholder="Zari border"
              />
            </div>
            <div>
              <Label htmlFor="occasion">Occasion</Label>
              <Input
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="Festive / Wedding"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Red / Blue / Green"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="careInstructions">Care Instructions</Label>
              <Input
                id="careInstructions"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="Dry clean only"
              />
            </div>
            <div>
              <Label htmlFor="shippingTime">Shipping Time</Label>
              <Input
                id="shippingTime"
                value={shippingTime}
                onChange={(e) => setShippingTime(e.target.value)}
                placeholder="Ships in 3–5 days"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Selling Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={priceInr}
                onChange={(e) => setPriceInr(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input
                id="mrp"
                type="number"
                min={0}
                value={mrpInr}
                onChange={(e) => setMrpInr(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="border rounded-md h-10 px-3 w-full text-sm"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'active' | 'draft')
                }
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <Label htmlFor="images">Product Images (4–6 recommended)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Images will be uploaded to Supabase Storage and attached to this
              product.
            </p>
          </div>

          {/* Why women love this saree */}
          <div>
            <Label htmlFor="whyWomenLove">Why Women Love This Saree</Label>
            <Textarea
              id="whyWomenLove"
              value={whyWomenLove}
              onChange={(e) => setWhyWomenLove(e.target.value)}
              placeholder="Handwoven by master artisans, premium quality materials, perfect for special occasions…"
              rows={3}
            />
          </div>

          {/* Flags & tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <p className="text-sm font-medium">Bestseller</p>
                <p className="text-xs text-gray-500">
                  Show in “Most Loved by Samara Women”
                </p>
              </div>
              <Switch
                checked={isBestseller}
                onCheckedChange={setIsBestseller}
              />
            </div>

            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <p className="text-sm font-medium">New Arrival</p>
                <p className="text-xs text-gray-500">
                  Show in “New Arrivals” section
                </p>
              </div>
              <Switch
                checked={isNewArrival}
                onCheckedChange={setIsNewArrival}
              />
            </div>

            <div className="flex flex-col gap-2 border rounded-md px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Handcrafted</p>
                  <p className="text-xs text-gray-500">
                    Show “Handwoven by master artisans”
                  </p>
                </div>
                <Switch
                  checked={isHandcrafted}
                  onCheckedChange={setIsHandcrafted}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Premium Material</p>
                  <p className="text-xs text-gray-500">
                    Show “Premium quality materials”
                  </p>
                </div>
                <Switch
                  checked={isPremiumMaterial}
                  onCheckedChange={setIsPremiumMaterial}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Special Occasions</p>
                  <p className="text-xs text-gray-500">
                    Show “Perfect for special occasions”
                  </p>
                </div>
                <Switch
                  checked={isPerfectForSpecialOccasions}
                  onCheckedChange={setIsPerfectForSpecialOccasions}
                />
              </div>
            </div>
          </div>

          {/* Placement flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <p className="text-sm font-medium">Show in Sarees</p>
                <p className="text-xs text-gray-500">
                  Include this product on the Sarees page
                </p>
              </div>
              <Switch
                checked={showInSarees}
                onCheckedChange={setShowInSarees}
              />
            </div>

            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <p className="text-sm font-medium">Show in Festive Edit</p>
                <p className="text-xs text-gray-500">
                  Include this product in Festive Edit section
                </p>
              </div>
              <Switch
                checked={showInFestiveEdit}
                onCheckedChange={setShowInFestiveEdit}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/products')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Product'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
