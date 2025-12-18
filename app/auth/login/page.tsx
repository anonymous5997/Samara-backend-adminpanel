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
import SupabasePhoneAuth from '@/components/auth/SupabasePhoneAuth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loginMethod, setLoginMethod] = useState<'password' | 'email-otp' | 'phone-otp'>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

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
        setLoading(false);
        return;
      }

      if (data.session) {
        console.log('[Login] Sign in successful:', data.user.email);

        // Set session server-side to ensure cookies are properly set
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          }),
        });

        if (!sessionResponse.ok) {
          console.error('[Login] Failed to set session server-side');
          toast.error('Failed to complete sign in');
          setLoading(false);
          return;
        }

        console.log('[Login] Session established server-side');
        toast.success('Signed in successfully');

        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use window.location for hard navigation to ensure cookies are sent
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[Login] Sign in error:', error);
      toast.error('Failed to sign in');
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
        setLoading(false);
        return;
      }

      if (data.session) {
        // Set session server-side to ensure cookies are properly set
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          }),
        });

        if (!sessionResponse.ok) {
          console.error('[Signup] Failed to set session server-side');
          toast.error('Failed to complete signup');
          setLoading(false);
          return;
        }

        toast.success('Account created successfully');

        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use window.location for hard navigation
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[Signup] Error:', error);
      toast.error('Failed to create account');
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
        setLoading(false);
        return;
      }

      if (data.session) {
        // Set session server-side to ensure cookies are properly set
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          }),
        });

        if (!sessionResponse.ok) {
          console.error('[EmailOTP] Failed to set session server-side');
          toast.error('Failed to complete sign in');
          setLoading(false);
          return;
        }

        toast.success('Signed in successfully');

        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use window.location for hard navigation
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[EmailOTP] Error:', error);
      toast.error('Failed to verify OTP');
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
                <SupabasePhoneAuth />
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