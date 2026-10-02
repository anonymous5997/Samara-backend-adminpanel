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
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-samara-void flex items-center justify-center">
        <div className="animate-pulse text-samara-ivory/40 font-sans tracking-widest uppercase text-sm">
          Loading details...
        </div>
      </div>
    );
  }
  if (!user) return null;

  /* ---------------- UI ---------------- */
  return (
    <>
      <Toaster />
      
      <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-4xl">
          {/* HEADER */}
          <div className="mb-16 text-center">
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
              Your Account
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-6">
              My <em className="italic text-samara-gold">Profile</em>
            </h1>
            <p className="text-sm font-sans tracking-wide text-samara-ivory/60">
              Manage your personal information and delivery details
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12 lg:p-16 space-y-16"
          >
            {/* BASIC INFO */}
            <section className="space-y-8">
              <h2 className="text-xl md:text-2xl font-serif text-samara-gold border-b border-samara-ivory/10 pb-4">
                Personal Information
              </h2>
              
              <div className="space-y-4">
                <Label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60">Email Address</Label>
                <Input
                  value={profile.email}
                  disabled
                  className="bg-samara-void text-samara-ivory/40 border-samara-ivory/10 cursor-not-allowed rounded-none h-12 text-sm font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60">Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your full name"
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60">Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91 XXXXX XXXXX"
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors"
                  />
                </div>
              </div>

              {/* CHANGE PASSWORD UI */}
              {canChangePassword && (
                <div className="space-y-8 pt-8 mt-8 border-t border-samara-ivory/10">
                  <h3 className="text-lg md:text-xl font-serif text-samara-ivory/80">
                    Change Password
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                    />

                    {/* New Password & Hint */}
                    <div className="space-y-3">
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
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                      />
                      <p className="text-[10px] font-sans tracking-wider text-samara-ivory/40 uppercase">
                        Minimum 8 characters
                      </p>
                    </div>
                  </div>

                  <div>
                    <Button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="h-12 px-8 bg-transparent border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold transition-colors rounded-none font-sans text-[10px] tracking-[0.2em] uppercase"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* ADDRESS */}
            <section className="space-y-8">
              <h2 className="text-xl md:text-2xl font-serif text-samara-gold border-b border-samara-ivory/10 pb-4">
                Delivery Details
              </h2>
              <div className="grid grid-cols-1 gap-8">
                <Input
                  placeholder="House / Flat Number"
                  value={formData.house}
                  onChange={(e) =>
                    setFormData({ ...formData, house: e.target.value })
                  }
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                />
                <Input
                  placeholder="Building / Apartment Name"
                  value={formData.building}
                  onChange={(e) =>
                    setFormData({ ...formData, building: e.target.value })
                  }
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                />
                <Input
                  placeholder="Locality / Area"
                  value={formData.locality}
                  onChange={(e) =>
                    setFormData({ ...formData, locality: e.target.value })
                  }
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                />
                <Input
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                />
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                />
              </div>
              <Input
                placeholder="PIN / ZIP Code"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
                className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors md:w-1/2"
              />
            </section>

            {/* ACTION */}
            <div className="pt-12 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="h-14 px-12 bg-samara-gold hover:bg-samara-goldDeep text-samara-void rounded-none transition-colors w-full md:w-auto font-sans text-[11px] tracking-[0.2em] uppercase"
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