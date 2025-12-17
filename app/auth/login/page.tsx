'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loginMethod, setLoginMethod] = useState<'password' | 'email-otp' | 'phone-otp'>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // NEW: store 2Factor sessionId returned by /api/sms/send
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        console.log('[Login] Sign in successful:', data.user.email);
        console.log('[Login] Session:', data.session?.access_token ? 'Yes' : 'No');
        toast.success('Signed in successfully');

        // Force a small delay to ensure session is set
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      }
    } catch (error) {
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          name,
          role: 'customer',
        });

        toast.success('Account created successfully');
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === 'signup',
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ---------- UPDATED: Phone OTP handlers using your /api endpoints ----------
  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Normalize phone if you need (server will strip non-digits)
      const payload = { phone: phone };

      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('sms/send failed', json);
        toast.error(json?.error || 'Failed to send OTP via SMS');
        setLoading(false);
        return;
      }

      // store sessionId for verification; 2Factor returns it in Details
      const sId = json.sessionId ?? json.session_id ?? null;
      setSessionId(sId);
      setPhoneOtpSent(true);
      toast.success('OTP sent to your phone');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send OTP. Phone authentication may not be enabled.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!sessionId) {
        toast.error('No SMS session found. Please request a new OTP.');
        setLoading(false);
        return;
      }

      const payload = { sessionId, otp, phone };

      const res = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        console.error('sms/verify failed', json);
        toast.error(json?.error || 'OTP verification failed');
        setLoading(false);
        return;
      }

      // If verify was successful, mark phone verified in profiles table.
      // We try to find an existing profile by phone; if none, we insert one.
      // NOTE: This does not create a Supabase auth session for the user.
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (!existing) {
        // Insert a new profile row (no auth user created here)
        await supabase.from('profiles').insert({
          phone,
          name: name || '',
          phone_verified: true,
          role: 'customer',
        });
      } else {
        // Update existing profile to mark phone verified
        await supabase
          .from('profiles')
          .update({ phone_verified: true })
          .eq('phone', phone);
      }

      toast.success('Phone verified successfully');

      // Decide what you want to do next:
      // - If this is sign-in for an existing account you will need server-side logic to
      //   sign the user in (create a session) because Supabase auth phone OTP isn't used.
      // - If this is a signup, you may want to create a Supabase auth user server-side
      //   using the service role key and then return credentials/session.
      // For now, we'll redirect to home or you can show the "set password" flow.
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };
  // -------------------------------------------------------------------------

  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email!,
            name: name || '',
            role: 'customer',
          });
        }

        toast.success('Signed in successfully');
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-[#000000] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30">
                <span className="text-black font-serif text-2xl font-bold">S</span>
              </div>
              <span className="font-serif text-2xl font-bold text-[#D4AF37] tracking-wide">SAMARA</span>
            </Link>
            <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-[#888]">
              {mode === 'signin' ? 'Sign in to continue shopping' : 'Join Samara today'}
            </p>
          </div>

          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-lg p-8 shadow-xl">
            <Tabs defaultValue="password" onValueChange={(val) => setLoginMethod(val as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-[#1a1a1a]">
                <TabsTrigger value="password" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                  <Lock className="h-4 w-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="email-otp" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone-otp" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <form onSubmit={mode === 'signin' ? handlePasswordSignIn : handlePasswordSignUp} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <Label htmlFor="name" className="text-[#F5F5F5]">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email" className="text-[#F5F5F5]">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-[#F5F5F5]">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#D4AF37]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="email-otp">
                {!emailOtpSent ? (
                  <form onSubmit={handleSendEmailOTP} className="space-y-4">
                    {mode === 'signup' && (
                      <div>
                        <Label htmlFor="name-email" className="text-[#F5F5F5]">Full Name</Label>
                        <Input
                          id="name-email"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="email-otp" className="text-[#F5F5F5]">Email</Label>
                      <Input
                        id="email-otp"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                    <div>
                      <Label htmlFor="otp-email" className="text-[#F5F5F5]">Enter OTP</Label>
                      <Input
                        id="otp-email"
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                      />
                      <p className="text-sm text-[#888] mt-2">
                        OTP sent to {email}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-[#D4AF37] hover:text-[#F4D03F]"
                      onClick={() => {
                        setEmailOtpSent(false);
                        setOtp('');
                      }}
                    >
                      Use different email
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="phone-otp">
                {!phoneOtpSent ? (
                  <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                    {mode === 'signup' && (
                      <div>
                        <Label htmlFor="name-phone" className="text-[#F5F5F5]">Full Name</Label>
                        <Input
                          id="name-phone"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="phone-otp" className="text-[#F5F5F5]">Phone Number</Label>
                      <Input
                        id="phone-otp"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                      />
                      <p className="text-sm text-[#666] mt-1">Include country code (e.g., +91 for India)</p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                    <div>
                      <Label htmlFor="otp-phone" className="text-[#F5F5F5]">Enter OTP</Label>
                      <Input
                        id="otp-phone"
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="bg-[#1a1a1a] border-[#D4AF37]/30 text-[#F5F5F5] focus:border-[#D4AF37]"
                      />
                      <p className="text-sm text-[#888] mt-2">
                        OTP sent to {phone}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-[#D4AF37] hover:text-[#F4D03F]"
                      onClick={() => {
                        setPhoneOtpSent(false);
                        setOtp('');
                      }}
                    >
                      Use different phone
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-[#D4AF37] hover:text-[#F4D03F] font-medium"
              >
                {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-[#666]">
              <p>
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-[#D4AF37] hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#D4AF37] hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}