'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AccountHero, BTN_GHOST, BTN_GOLD, FIELD, FIELD_LABEL, FOCUS, StepHeading } from '@/components/account/ui';

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
      <div className="flex min-h-[70vh] items-center justify-center bg-samara-ink sm-eyebrow animate-pulse motion-reduce:animate-none">
        Loading session...
      </div>
    );
  }
  if (!user) return null;
  if (!profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-samara-ink sm-eyebrow animate-pulse motion-reduce:animate-none">
        Creating profile...
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
      <div className="bg-samara-ink text-samara-ivory">
          {/* HEADER */}
          <AccountHero
            eyebrow="Account"
            title={<>My <span className="sm-accent">Profile</span></>}
            intro="Manage your personal information and delivery address"
          />

        <div className="sm-container grid grid-cols-1 gap-12 pb-20 pt-10 md:pb-28 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16 lg:pt-14 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-24">
          {/* ACCOUNT NAV */}
          <aside className="h-fit lg:sticky lg:top-[calc(var(--sm-header-h)+2rem)]">
            <div className="border-b border-samara-line pb-6">
              <p className="font-serif text-[1.625rem] font-light leading-tight text-samara-ivory">{formData.name || profile.email}</p>
              <p className="mt-2 break-all font-sans text-xs text-samara-mute">{profile.email}</p>
            </div>
            <nav aria-label="Account" className="mt-2">
              <ul className="grid grid-cols-1 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-1">
                {[
                  { href: '/orders', label: 'My Orders' },
                  { href: '/wishlist', label: 'My Wishlist' },
                  { href: '/track-order', label: 'Track Order' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn('group flex min-h-[52px] items-center justify-between border-b border-samara-line font-sans text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-samara-mute transition-colors duration-300 hover:text-samara-ivory', FOCUS)}
                    >
                      {link.label}
                      <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.25} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="min-w-0 space-y-14 md:space-y-16"
          >
            {/* BASIC INFO */}
            <section className="space-y-8">
              <StepHeading n="01" title="Personal Information" />
              
              <div>
                <Label htmlFor="profile-email" className={FIELD_LABEL}>Email</Label>
                <Input
                  id="profile-email"
                  value={profile.email}
                  disabled
                  className={FIELD}
                />
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2">
                <div>
                  <Label htmlFor="profile-name" className={FIELD_LABEL}>Full Name</Label>
                  <Input
                    id="profile-name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your full name"
                    className={FIELD}
                  />
                </div>
                <div>
                  <Label htmlFor="profile-phone" className={FIELD_LABEL}>Phone</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91XXXXXXXXXX"
                    className={FIELD}
                  />
                </div>
              </div>

              {/* CHANGE PASSWORD UI (Hidden for social logins) */}
              {canChangePassword && (
                <div className="space-y-6 border border-samara-line bg-samara-char px-6 py-7 sm:px-8">
                  <h3 className="font-serif text-[1.375rem] font-light text-samara-ivory">
                    Change Password
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2">
                    {/* Current Password */}
                    <div>
                    <Label htmlFor="profile-current-password" className={FIELD_LABEL}>Current Password</Label>
                    <Input
                      id="profile-current-password"
                      type="password"
                      autoComplete="current-password"
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
                      className={FIELD}
                    />
                    </div>

                    {/* New Password & Hint */}
                    <div>
                      <Label htmlFor="profile-new-password" className={FIELD_LABEL}>New Password</Label>
                      <Input
                        id="profile-new-password"
                        type="password"
                        autoComplete="new-password"
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
                        className={FIELD}
                      />
                      {/* ✅ Password Hint */}
                      <p className="mt-2 font-sans text-xs text-samara-mute">
                        Minimum 8 characters recommended
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className={cn(BTN_GHOST, 'w-full sm:w-auto')}
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ADDRESS */}
            <section className="space-y-8">
              <StepHeading n="02" title="Delivery Address" />
              <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2">
                <div>
                <Label htmlFor="profile-house" className={FIELD_LABEL}>House / Flat Number</Label>
                <Input
                  id="profile-house"
                  placeholder="House / Flat Number"
                  value={formData.house}
                  onChange={(e) =>
                    setFormData({ ...formData, house: e.target.value })
                  }
                  className={FIELD}
                />
                </div>
                <div>
                <Label htmlFor="profile-building" className={FIELD_LABEL}>Building / Apartment Name</Label>
                <Input
                  id="profile-building"
                  placeholder="Building / Apartment Name"
                  value={formData.building}
                  onChange={(e) =>
                    setFormData({ ...formData, building: e.target.value })
                  }
                  className={FIELD}
                />
                </div>
                <div className="md:col-span-2">
                <Label htmlFor="profile-locality" className={FIELD_LABEL}>Locality / Area</Label>
                <Input
                  id="profile-locality"
                  placeholder="Locality / Area"
                  value={formData.locality}
                  onChange={(e) =>
                    setFormData({ ...formData, locality: e.target.value })
                  }
                  className={FIELD}
                />
                </div>
                <div>
                <Label htmlFor="profile-city" className={FIELD_LABEL}>City</Label>
                <Input
                  id="profile-city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className={FIELD}
                />
                </div>
                <div>
                <Label htmlFor="profile-district" className={FIELD_LABEL}>District</Label>
                <Input
                  id="profile-district"
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  className={FIELD}
                />
                </div>
                <div>
                <Label htmlFor="profile-state" className={FIELD_LABEL}>State</Label>
                <Input
                  id="profile-state"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className={FIELD}
                />
                </div>
                <div>
                <Label htmlFor="profile-country" className={FIELD_LABEL}>Country</Label>
                <Input
                  id="profile-country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className={FIELD}
                />
                </div>
                <div>
              <Label htmlFor="profile-pin" className={FIELD_LABEL}>PIN / ZIP Code</Label>
              <Input
                id="profile-pin"
                placeholder="PIN / ZIP Code"
                value={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.value })
                }
                className={cn(FIELD, 'tabular-nums')}
              />
                </div>
              </div>
            </section>

            {/* ACTION */}
            <div className="flex justify-end border-t border-samara-line pt-8">
              <button
                type="submit"
                disabled={saving}
                className={cn(BTN_GOLD, 'w-full md:w-auto md:min-w-[240px]')}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}