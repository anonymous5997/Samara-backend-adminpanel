'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

type AuthMode =
  | 'login'
  | 'signup'
  | 'forgot'
  | 'verify-otp'
  | 'set-password';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  /* ---------------- STATE ---------------- */
  const [tab, setTab] = useState<'password' | 'email' | 'phone'>('password');
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  // Track signup flow locally to control UI transitions
  const [isSignupFlow, setIsSignupFlow] = useState(false);

  // Cooldown state for Resend OTP
  const [cooldown, setCooldown] = useState(0);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
  });

  const [loading, setLoading] = useState(false);

  /* ---------------- 1. SAFE AUTO-REDIRECT EFFECT ---------------- */
  useEffect(() => {
    // Wait for auth to load
    if (authLoading || !user) return;

    // Check if user has explicitly set a password via our flow
    const hasPassword = user.user_metadata?.has_password;

    // BLOCK REDIRECT if user is in signup flow but hasn't set password yet
    // This prevents the user from being kicked to home before finishing registration
    if (isSignupFlow && !hasPassword) return;

    // Also block if we are visibly in set-password mode
    if (mode === 'set-password') return;

    router.replace('/'); 
  }, [user, authLoading, router, isSignupFlow, mode]);

  /* ---------------- 2. REFRESH SAFETY CHECK ---------------- */
  // If user refreshes while on "Set Password", this keeps them there
  useEffect(() => {
    if (user && !user.user_metadata?.has_password) {
      // Only force this for Email/Phone providers (not Google/Facebook)
      const isSocial = user.app_metadata?.provider !== 'email' && user.app_metadata?.provider !== 'phone';
      
      if (!isSocial) {
        setMode('set-password');
        setIsSignupFlow(true); // Re-establish flow state
      }
    }
  }, [user]);

  /* ---------------- HELPERS ---------------- */
  const update = (k: string, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const startCooldown = () => {
    setCooldown(30);
    const timer = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const signInWithProvider = async (
    provider: 'google' | 'facebook'
  ) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/login/callback`,
      },
    });

    if (error) toast.error(error.message);
  };

  /* ---------------- LOGIN (PASSWORD) ---------------- */
  const loginPassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (error) toast.error(error.message);
    // Redirect handled by useEffect
  };

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    if (loading || cooldown > 0) return;

    if (!form.email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: form.email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('OTP sent to your email');
    setMode('verify-otp');
    startCooldown();
  };

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async () => {
    if (loading) return;

    if (!form.otp || form.otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: form.email.trim(),
      token: form.otp.trim(),
      type: 'email',
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || 'Invalid or expired OTP');
      return;
    }

    // Handle pending name update
    const pendingName = localStorage.getItem('pending_name');
    if (pendingName) {
      await supabase.auth.updateUser({
        data: { name: pendingName },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({ name: pendingName })
          .eq('id', user.id);
      }
      localStorage.removeItem('pending_name');
    }

    // If this was a signup, force password creation
    if (isSignupFlow) {
      setMode('set-password');
      return;
    }

    toast.success('Logged in successfully');
    // Redirect handled by useEffect
  };

  /* ---------------- SET PASSWORD (CRITICAL FIX) ---------------- */
  const setPassword = async () => {
    if (!form.password || form.password.length < 8) {
      toast.error(
        'Password must be at least 8 characters, include 1 capital & 1 special character'
      );
      return;
    }

    setLoading(true);

    // ✅ Update user AND set 'has_password' metadata
    const { error } = await supabase.auth.updateUser({
      password: form.password,
      data: {
        has_password: true, // 🔑 This flag allows the redirect to happen
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success(isSignupFlow ? 'Account created successfully' : 'Password reset successfully');
    
    // Explicitly navigate, though the useEffect would also catch the metadata change
    router.replace('/');
  };

  /* ---------------- SIGNUP START ---------------- */
  const signupStart = async () => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    localStorage.setItem('pending_name', form.name);
    
    // Mark flow as signup
    setIsSignupFlow(true);

    await sendOtp();
  };

  /* ---------------- FORGOT PASSWORD ---------------- */
  const forgotStart = async () => {
    await sendOtp();
  };

  /* ---------------- SUBMIT HANDLER ---------------- */
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login' && tab === 'password') return loginPassword();
    if (mode === 'login' && (tab === 'email' || tab === 'phone')) return sendOtp();
    if (mode === 'signup') return signupStart();
    if (mode === 'forgot') return forgotStart();
    if (mode === 'verify-otp') return verifyOtp();
    if (mode === 'set-password') return setPassword();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form
        onSubmit={onSubmit}
        className="w-[380px] rounded-2xl border border-[#D4AF37]/40 p-8 bg-black text-white"
      >
        {/* LOGO */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center font-bold text-xl">
            S
          </div>
          <span className="text-[#D4AF37] text-xl font-semibold tracking-widest">
            SAMARA
          </span>
        </div>

        <h2 className="text-2xl font-semibold text-[#D4AF37] text-center">
          {mode === 'set-password' ? 'Set Password' : 'Welcome Back'}
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          {mode === 'set-password' ? 'Secure your account' : 'Sign in to continue'}
        </p>

        {/* TABS */}
        {mode !== 'verify-otp' && mode !== 'set-password' && (
          <div className="flex mb-5 bg-[#111] rounded-lg p-1">
            {['password', 'email', 'phone'].map(t => (
              <button
                key={t}
                type="button"
                className={`flex-1 py-2 rounded-md text-sm ${
                  tab === t
                    ? 'bg-white text-black'
                    : 'text-gray-400'
                }`}
                onClick={() => {
                  setTab(t as any);
                  setMode('login');
                  setIsSignupFlow(false);
                  localStorage.removeItem('pending_name'); 
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* NAME */}
        {mode === 'signup' && (
          <Input
            placeholder="Name"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="mb-3 bg-white text-black"
          />
        )}

        {/* EMAIL / PHONE */}
        {mode !== 'set-password' && (
          <>
            {tab !== 'phone' && (
              <Input
                placeholder="Email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className="mb-3 bg-white text-black"
              />
            )}

            {tab === 'phone' && (
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                className="mb-3 bg-white text-black"
              />
            )}
          </>
        )}

        {/* PASSWORD */}
        {(mode === 'login' && tab === 'password') || mode === 'set-password' ? (
          <div className="relative mb-3">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'set-password' ? "New Password" : "Password"}
              value={form.password}
              onChange={e => update('password', e.target.value)}
              className="bg-white text-black pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(p => !p)}
            >
              <Eye size={18} />
            </button>
          </div>
        ) : null}

        {/* OTP */}
        {mode === 'verify-otp' && (
          <Input
            placeholder="Enter OTP"
            value={form.otp}
            onChange={e => update('otp', e.target.value)}
            className="mb-3 bg-white text-black"
          />
        )}

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#1a1a1a] text-white"
        >
          {loading
            ? 'Please wait...'
            : mode === 'verify-otp'
            ? 'Verify OTP'
            : mode === 'signup'
            ? 'Get OTP'
            : mode === 'set-password'
            ? 'Save Password & Login'
            : tab === 'email' || tab === 'phone'
            ? 'Send OTP'
            : 'Sign In'}
        </Button>

        {/* SOCIAL LOGIN */}
        {mode === 'login' && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-xs text-gray-400">OR CONTINUE WITH</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => signInWithProvider('google')}
                className="w-full bg-white text-black hover:bg-gray-200 font-medium flex items-center justify-center gap-3"
              >
                <Image src="/icons/google.svg" alt="Google" width={18} height={18} />
                Continue with Google
              </Button>

              <Button
                type="button"
                onClick={() => signInWithProvider('facebook')}
                className="w-full bg-[#1877F2] text-white hover:bg-[#145dbf] font-medium flex items-center justify-center gap-3"
              >
                <Image src="/icons/facebook.svg" alt="Facebook" width={18} height={18} />
                Continue with Facebook
              </Button>
            </div>
          </div>
        )}

        {/* FOOTER LINKS */}
        {mode === 'login' && (
          <div className="text-center mt-5 text-sm">
            {tab === 'password' && (
              <button
                type="button"
                className="text-[#D4AF37]"
                onClick={() => setMode('forgot')}
              >
                Forgot password?
              </button>
            )}
            <div className="mt-3 text-gray-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-[#D4AF37]"
                onClick={() => setMode('signup')}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* RESEND OTP */}
        {mode === 'verify-otp' && (
          <button
            type="button"
            disabled={cooldown > 0 || loading}
            className="text-xs text-[#D4AF37] mt-4 block mx-auto disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            onClick={sendOtp}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        )}
      </form>
    </div>
  );
}