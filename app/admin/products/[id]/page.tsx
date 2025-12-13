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

type Status = 'active' | 'draft';

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // basic fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [priceInr, setPriceInr] = useState('');
  const [mrpInr, setMrpInr] = useState('');
  const [status, setStatus] = useState<Status>('active');
  const [imageUrl, setImageUrl] = useState('');

  // flags
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isHandcrafted, setIsHandcrafted] = useState(false);
  const [isPremiumMaterial, setIsPremiumMaterial] = useState(false);
  const [
    isPerfectForSpecialOccasions,
    setIsPerfectForSpecialOccasions,
  ] = useState(false);

  // filter attributes
  const [fabric, setFabric] = useState('');
  const [work, setWork] = useState('');
  const [occasion, setOccasion] = useState('');
  const [color, setColor] = useState(''); // NEW

  const [careInstructions, setCareInstructions] = useState('');
  const [shippingTime, setShippingTime] = useState('');
  const [whyWomenLove, setWhyWomenLove] = useState('');

  // placement flags
  const [showInSarees, setShowInSarees] = useState(true); // NEW
  const [showInFestiveEdit, setShowInFestiveEdit] = useState(false); // NEW

  // 1) Load product on mount
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          name,
          brand,
          description,
          price_inr,
          mrp_inr,
          base_price_inr,
          is_active,
          image_url,
          is_bestseller,
          is_new_arrival,
          fabric,
          work,
          occasion,
          color,
          care_instructions,
          shipping_time,
          why_women_love,
          is_handcrafted,
          is_premium_material,
          is_perfect_for_special_occasions,
          show_in_sarees,
          show_in_festive_edit
        `,
        )
        .eq('id', productId)
        .single();

      if (error || !data) {
        console.error(error);
        toast.error('Failed to load product');
        router.push('/admin/products');
        return;
      }

      setName(data.name ?? '');
      setBrand(data.brand ?? '');
      setDescription(data.description ?? '');

      const price =
        (data.price_inr as number | null) ??
        (data.base_price_inr as number | null) ??
        0;
      setPriceInr(price.toString());

      setMrpInr(
        data.mrp_inr !== null && data.mrp_inr !== undefined
          ? String(data.mrp_inr)
          : '',
      );

      setStatus(data.is_active ? 'active' : 'draft');
      setImageUrl(data.image_url ?? '');
      setIsBestseller(!!data.is_bestseller);
      setIsNewArrival(!!data.is_new_arrival);

      setFabric(data.fabric ?? '');
      setWork(data.work ?? '');
      setOccasion(data.occasion ?? '');
      setColor(data.color ?? '');

      setCareInstructions(data.care_instructions ?? '');
      setShippingTime(data.shipping_time ?? '');
      setWhyWomenLove(data.why_women_love ?? '');
      setIsHandcrafted(!!data.is_handcrafted);
      setIsPremiumMaterial(!!data.is_premium_material);
      setIsPerfectForSpecialOccasions(
        !!data.is_perfect_for_special_occasions,
      );

      setShowInSarees(
        data.show_in_sarees === null || data.show_in_sarees === undefined
          ? true
          : !!data.show_in_sarees,
      );
      setShowInFestiveEdit(!!data.show_in_festive_edit);

      setLoading(false);
    };

    loadProduct();
  }, [productId, router]);

  // 2) Handle update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !priceInr) {
      toast.error('Name and price are required');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('products')
      .update({
        name,
        brand: brand || null,
        description: description || null,
        price_inr: Number(priceInr),
        base_price_inr: Number(priceInr),
        mrp_inr: mrpInr ? Number(mrpInr) : null,
        is_active: status === 'active',
        image_url: imageUrl || null,

        is_bestseller: isBestseller,
        is_new_arrival: isNewArrival,
        is_handcrafted: isHandcrafted,
        is_premium_material: isPremiumMaterial,
        is_perfect_for_special_occasions: isPerfectForSpecialOccasions,

        fabric: fabric || null,
        work: work || null,
        occasion: occasion || null,
        color: color || null,
        care_instructions: careInstructions || null,
        shipping_time: shippingTime || null,
        why_women_love: whyWomenLove || null,

        show_in_sarees: showInSarees,
        show_in_festive_edit: showInFestiveEdit,
      })
      .eq('id', productId);

    if (error) {
      console.error(error);
      toast.error('Failed to update product');
    } else {
      toast.success('Product updated');
      router.push('/admin/products');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <>
        <Toaster />
        <div className="max-w-3xl mx-auto py-12">
          <p>Loading product…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Edit Product</h1>
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
                required
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
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
              rows={4}
            />
          </div>

          {/* Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fabric">Fabric</Label>
              <Input
                id="fabric"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="work">Work / Weave</Label>
              <Input
                id="work"
                value={work}
                onChange={(e) => setWork(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="occasion">Occasion</Label>
              <Input
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Red, Blue, Green…"
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
              />
            </div>
            <div>
              <Label htmlFor="shippingTime">Shipping Time</Label>
              <Input
                id="shippingTime"
                value={shippingTime}
                onChange={(e) => setShippingTime(e.target.value)}
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
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <Label htmlFor="imageUrl">Main Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* Why women love */}
          <div>
            <Label htmlFor="whyWomenLove">
              Why Women Love This Saree
            </Label>
            <Textarea
              id="whyWomenLove"
              value={whyWomenLove}
              onChange={(e) => setWhyWomenLove(e.target.value)}
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
                <p className="text-sm font-medium">Handcrafted</p>
                <Switch
                  checked={isHandcrafted}
                  onCheckedChange={setIsHandcrafted}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Premium Material
                </p>
                <Switch
                  checked={isPremiumMaterial}
                  onCheckedChange={setIsPremiumMaterial}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Special Occasions
                </p>
                <Switch
                  checked={isPerfectForSpecialOccasions}
                  onCheckedChange={
                    setIsPerfectForSpecialOccasions
                  }
                />
              </div>
            </div>
          </div>

          {/* NEW: where to show product */}
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
                <p className="text-sm font-medium">
                  Show in Festive Edit
                </p>
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
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
