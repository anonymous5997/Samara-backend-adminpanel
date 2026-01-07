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
  
  // ✅ Get auth state
  const { user, profile, refreshProfile, loading } = useAuth();

  const [saving, setSaving] = useState(false); 

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
    // Wait for auth hydration
    if (loading) return;

    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    // Populate form when profile data is available
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
  }, [user, profile, loading]);

  /* ---------------- SAVE PROFILE ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) return;

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
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- RENDER GUARDS ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37] font-serif tracking-wider animate-pulse">
        Loading session...
      </div>
    );
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37] font-serif tracking-wider animate-pulse">
        Creating profile...
      </div>
    );
  }

  /* ---------------- IMPROVED UI ---------------- */
  return (
    <>
      <Toaster />
      
      <div className="min-h-screen bg-black flex justify-center px-4 py-20">
        <div className="w-full max-w-4xl">

          {/* HEADER */}
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl font-serif text-[#D4AF37] mb-3">
              My Profile
            </h1>
            <p className="text-gray-400">
              Manage your personal information and delivery address
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[#0b0b0b] border border-[#D4AF37]/30 rounded-3xl p-8 md:p-12 space-y-12 shadow-[0_0_80px_rgba(212,175,55,0.08)]"
          >
            {/* BASIC INFO */}
            <section className="space-y-6">
              <h2 className="text-xl font-serif text-[#D4AF37] border-b border-gray-800 pb-2">
                Personal Information
              </h2>

              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input
                  value={profile.email}
                  disabled
                  // Keeps disabled input gray to differentiate it
                  className="bg-[#111] text-gray-500 cursor-not-allowed border-gray-800 focus-visible:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Full Name</Label>
                  {/* ✅ Added text-white */}
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your full name"
                    className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Phone</Label>
                  {/* ✅ Added text-white */}
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91XXXXXXXXXX"
                    className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* ADDRESS */}
            <section className="space-y-6">
              <h2 className="text-xl font-serif text-[#D4AF37] border-b border-gray-800 pb-2">
                Delivery Address
              </h2>

              <div className="grid grid-cols-1 gap-6">
                {/* ✅ Added text-white to all address inputs */}
                <Input
                  placeholder="House / Flat Number"
                  value={formData.house}
                  onChange={(e) =>
                    setFormData({ ...formData, house: e.target.value })
                  }
                  className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                />

                <Input
                  placeholder="Building / Apartment Name"
                  value={formData.building}
                  onChange={(e) =>
                    setFormData({ ...formData, building: e.target.value })
                  }
                  className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                />

                <Input
                  placeholder="Locality / Area"
                  value={formData.locality}
                  onChange={(e) =>
                    setFormData({ ...formData, locality: e.target.value })
                  }
                  className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                />
                <Input
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                />
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <Input
                placeholder="PIN / ZIP Code"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
                className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37] md:w-1/2"
              />
            </section>

            {/* ACTION */}
            <div className="pt-6 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#D4AF37] text-black font-bold px-10 py-6 rounded-xl hover:bg-[#E6C75A] transition shadow-lg shadow-[#D4AF37]/20 w-full md:w-auto text-lg"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}