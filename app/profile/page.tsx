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
  
  // Profile Form State
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

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Check if user has a password (hide for Google/Facebook users)
  const canChangePassword = user?.user_metadata?.has_password === true;

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

  /* ---------------- CHANGE PASSWORD FUNCTION ---------------- */
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Both current and new password are required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (!profile?.email) {
      toast.error('User email not found');
      return;
    }

    try {
      setChangingPassword(true);

      // 1. Verify Current Password (Re-auth)
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: profile.email,
          password: passwordData.currentPassword,
        });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // 2. Update to New Password
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: passwordData.newPassword,
        });

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      toast.success('Password updated successfully');

      // Clear fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
      });

    } catch (err) {
      console.error(err);
      toast.error('Failed to update password');
    } finally {
      setChangingPassword(false);
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

  /* ---------------- UI ---------------- */
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
                  className="bg-[#111] text-gray-500 cursor-not-allowed border-gray-800 focus-visible:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Full Name</Label>
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

              {/* CHANGE PASSWORD UI (Hidden for social logins) */}
              {canChangePassword && (
                <div className="space-y-4 pt-6 mt-4 border-t border-gray-800/50">
                  <h3 className="text-lg font-serif text-[#D4AF37]">
                    Change Password
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Password */}
                    <Input
                      type="password"
                      placeholder="Current Password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      // ✅ Prevent accidental form submission
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                    />

                    {/* New Password & Hint */}
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        // ✅ Prevent accidental form submission
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="bg-[#1a1a1a] text-white border-gray-800 focus:border-[#D4AF37]"
                      />
                      {/* ✅ Password Hint */}
                      <p className="text-xs text-gray-500">
                        Minimum 8 characters recommended
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <Button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="bg-[#1a1a1a] text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black transition"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* ADDRESS */}
            <section className="space-y-6">
              <h2 className="text-xl font-serif text-[#D4AF37] border-b border-gray-800 pb-2">
                Delivery Address
              </h2>
              <div className="grid grid-cols-1 gap-6">
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