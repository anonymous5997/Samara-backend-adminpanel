'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Coupon } from '@/lib/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { format } from 'date-fns';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    value: 0,
    min_cart_value_inr: 0,
    max_discount_inr: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        valid_to: formData.valid_to || null,
        max_discount_inr: formData.max_discount_inr || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated');
      } else {
        const { error } = await supabase.from('coupons').insert({
          ...couponData,
          is_active: true,
        });

        if (error) throw error;
        toast.success('Coupon created');
      }

      setDialogOpen(false);
      setEditingCoupon(null);
      setFormData({
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        min_cart_value_inr: 0,
        max_discount_inr: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '',
      });
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);

      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Coupon status updated');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to update coupon');
    }
  };

  return (
    <>
      <Toaster />
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Coupons</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCoupon(null);
                  setFormData({
                    code: '',
                    type: 'PERCENTAGE',
                    value: 0,
                    min_cart_value_inr: 0,
                    max_discount_inr: 0,
                    valid_from: new Date().toISOString().split('T')[0],
                    valid_to: '',
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Discount Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'PERCENTAGE' | 'FLAT') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FLAT">Flat Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">
                    Value {formData.type === 'PERCENTAGE' ? '(%)' : '(INR)'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="min_cart_value_inr">
                    Minimum Cart Value (INR)
                  </Label>
                  <Input
                    id="min_cart_value_inr"
                    type="number"
                    value={formData.min_cart_value_inr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_cart_value_inr: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                {formData.type === 'PERCENTAGE' && (
                  <div>
                    <Label htmlFor="max_discount_inr">
                      Max Discount (INR)
                    </Label>
                    <Input
                      id="max_discount_inr"
                      type="number"
                      value={formData.max_discount_inr}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_discount_inr: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="valid_to">Valid To</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_to: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingCoupon ? 'Update' : 'Create'} Coupon
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
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min. Cart</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>{coupon.type}</TableCell>
                    <TableCell>
                      {coupon.type === 'PERCENTAGE'
                        ? `${coupon.value}%`
                        : `₹${coupon.value}`}
                    </TableCell>
                    <TableCell>₹{coupon.min_cart_value_inr}</TableCell>
                    <TableCell>
                      {coupon.valid_to
                        ? format(new Date(coupon.valid_to), 'MMM dd, yyyy')
                        : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(coupon.id, coupon.is_active)}
                        className={`px-2 py-1 rounded-full text-xs ${
                          coupon.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
