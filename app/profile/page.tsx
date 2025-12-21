'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    house: '',
    building: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    country: '',
    pin: '',
  });

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        house: profile.house || '',
        building: profile.building || '',
        locality: profile.locality || '',
        city: profile.city || '',
        district: profile.district || '',
        state: profile.state || '',
        country: profile.country || '',
        pin: profile.pin || '',
      });
    }
  }, [user, profile, router]);

  /* ---------------- SAVE PROFILE ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          house: formData.house,
          building: formData.building,
          locality: formData.locality,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          country: formData.country,
          pin: formData.pin,
        })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) return null;

  /* ---------------- UI ---------------- */
  return (
    <>
      <Toaster />

      <div className="min-h-screen bg-black flex justify-center px-4 py-16">
        <div className="w-full max-w-3xl">

          <h1 className="text-3xl font-serif text-[#D4AF37] mb-10">
            My Profile
          </h1>

          {/* ✅ POINTER EVENTS FIX IS HERE */}
          <form
            onSubmit={handleSubmit}
            className="relative z-10 pointer-events-auto bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-2xl p-10 space-y-8 shadow-2xl"
          >
            {/* EMAIL */}
            <div>
              <Label>Email</Label>
              <Input
                value={profile.email}
                disabled
                className="bg-[#1a1a1a] text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* NAME */}
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Your full name"
              />
            </div>

            {/* PHONE */}
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+91XXXXXXXXXX"
              />
            </div>

            {/* ADDRESS */}
            <div className="space-y-4">
              <h2 className="text-xl font-serif text-[#D4AF37]">
                Address
              </h2>

              <Input
                placeholder="House / Flat Number"
                value={formData.house}
                onChange={(e) =>
                  setFormData({ ...formData, house: e.target.value })
                }
              />

              <Input
                placeholder="Building / Apartment Name"
                value={formData.building}
                onChange={(e) =>
                  setFormData({ ...formData, building: e.target.value })
                }
              />

              <Input
                placeholder="Locality / Area"
                value={formData.locality}
                onChange={(e) =>
                  setFormData({ ...formData, locality: e.target.value })
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />

                <Input
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />

                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                />
              </div>

              <Input
                placeholder="PIN / ZIP Code"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
              />
            </div>

            {/* SAVE */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#D4AF37] text-black font-semibold hover:bg-[#E6C75A]"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
