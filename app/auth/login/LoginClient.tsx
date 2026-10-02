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
import type { SiteImage } from '@/lib/site-images/slots';
import { SiteImageBackdrop } from '@/components/site-images/SiteImageBackdrop';
import {
  fieldClass,
  goldButtonClass,
  outlineButtonClass,
  textLinkClass,
} from '@/components/content/formStyles';

type AuthMode =
  | 'login'
  | 'signup'
  | 'forgot'
  | 'verify-otp'
  | 'set-password';

export default function LoginPage({ brandImage = null }: { brandImage?: SiteImage | null }) {
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

    // ✅ CHECK #2: UX Safety Guard
    // If user is in signup flow but lost the name (e.g. refresh), force restart
    if (isSignupFlow && !localStorage.getItem('pending_name')) {
      toast.error('Signup name missing. Please restart signup.');
      setMode('signup');
      return;
    }

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

    // ✅ CHECK #1: Critical Fix (Upsert Profile)
    // Fetch latest user state to ensure we have the ID
    const { data: { user } } = await supabase.auth.getUser();
    const pendingName = localStorage.getItem('pending_name');

    if (user && pendingName) {
      // 1️⃣ Save name into auth metadata
      await supabase.auth.updateUser({
        data: { name: pendingName },
      });

      // 2️⃣ UPSERT profile name (handles race condition & ensures profile exists)
      await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email!,
            name: pendingName,
            role: 'customer',
          },
          { onConflict: 'id' }
        );

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

  /* ---------------- SET PASSWORD ---------------- */
  const setPassword = async () => {
    if (!form.password || form.password.length < 8) {
      toast.error(
        'Password must be at least 8 characters'
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
    <div className="grid bg-samara-black lg:min-h-[calc(100svh-var(--sm-header-h))] lg:grid-cols-2">
      {/* BRAND PANEL (desktop) */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden border-r border-samara-line bg-samara-forest lg:flex lg:items-center lg:justify-center"
      >
        {brandImage && (
          <SiteImageBackdrop
            image={brandImage}
            sizes="50vw"
            overlayClassName="bg-gradient-to-b from-samara-forest/70 via-samara-forest/60 to-samara-black/80"
          />
        )}
        <div className="absolute inset-10 border border-samara-gold/30 xl:inset-14" />
        <div className="absolute inset-12 border border-samara-gold/10 xl:inset-16" />
        <div className="relative flex flex-col items-center px-16 text-center">
          <Image
            src="/brand/samara-logo-transparent.png"
            alt=""
            width={717}
            height={214}
            priority
            className="h-auto w-[min(22rem,70%)]"
          />
          <span className="mt-12 flex items-center gap-4">
            <span className="block h-px w-10 bg-samara-gold/40" />
            <span className="block h-1.5 w-1.5 rotate-45 border border-samara-gold/70" />
            <span className="block h-px w-10 bg-samara-gold/40" />
          </span>
          <p className="mt-10 font-serif text-4xl font-light leading-tight text-samara-ivory xl:text-5xl">
            Woven for <span className="sm-accent">every woman</span>
          </p>
        </div>
      </aside>

      {/* FORM */}
      <div className="flex items-start justify-center px-[var(--sm-gutter)] py-14 sm:py-20 lg:items-center lg:px-[clamp(3rem,6vw,7rem)]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[26rem] text-samara-ivory"
      >
        {/* LOGO */}
        <p className="sm-eyebrow mb-6 flex items-center gap-4 text-samara-gold">
          Samara
          <span aria-hidden className="block h-px w-12 bg-samara-gold/50" />
        </p>

        <h2 className="sm-display-m font-light">
          {mode === 'set-password' ? <>Set <span className="sm-accent">Password</span></> : <>Welcome <span className="sm-accent">Back</span></>}
        </h2>
        <p className="sm-body mb-10 mt-3">
          {mode === 'set-password' ? 'Secure your account' : 'Sign in to continue'}
        </p>

        {/* TABS */}
        {mode !== 'verify-otp' && mode !== 'set-password' && (
          <div className="mb-8 flex border-b border-samara-line">
            {['password', 'email', 'phone'].map(t => (
              <button
                key={t}
                type="button"
                className={`-mb-px flex-1 border-b py-3.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-samara-gold ${
                  tab === t
                    ? 'border-samara-gold text-samara-ivory'
                    : 'border-transparent text-samara-mute hover:text-samara-ivory'
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
            aria-label="Name"
            className={`${fieldClass} mb-4`}
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
                aria-label="Email"
                className={`${fieldClass} mb-4`}
              />
            )}
            {tab === 'phone' && (
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                aria-label="Phone"
                className={`${fieldClass} mb-4`}
              />
            )}
          </>
        )}

        {/* PASSWORD */}
        {(mode === 'login' && tab === 'password') || mode === 'set-password' ? (
          <div className="relative mb-4">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'set-password' ? "New Password" : "Password"}
              value={form.password}
              onChange={e => update('password', e.target.value)}
              aria-label={mode === 'set-password' ? "New Password" : "Password"}
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-samara-mute transition-colors hover:text-samara-gold focus-visible:text-samara-gold focus-visible:outline-none"
              onClick={() => setShowPassword(p => !p)}
            >
              <Eye size={18} strokeWidth={1.25} />
            </button>
          </div>
        ) : null}

        {/* OTP */}
        {mode === 'verify-otp' && (
          <Input
            placeholder="Enter OTP"
            value={form.otp}
            onChange={e => update('otp', e.target.value)}
            aria-label="Enter OTP"
            className={`${fieldClass} mb-4 h-16 text-center indent-[0.5em] font-sans text-2xl font-light tabular-nums tracking-[0.5em] placeholder:indent-0 placeholder:font-sans placeholder:text-sm placeholder:tracking-eyebrow placeholder:uppercase`}
          />
        )}

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          disabled={loading}
          className={`${goldButtonClass} mt-4`}
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
          <div className="mt-10">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-samara-line" />
              <span className="font-sans text-[0.625rem] font-medium uppercase tracking-eyebrow text-samara-mute">OR CONTINUE WITH</span>
              <div className="h-px flex-1 bg-samara-line" />
            </div>
            <div className="grid gap-3">
              <Button
                type="button"
                onClick={() => signInWithProvider('google')}
                className={`${outlineButtonClass} gap-3 px-4 normal-case tracking-[0.04em]`}
              >
                <Image src="/icons/google.svg" alt="Google" width={18} height={18} />
                Continue with Google
              </Button>
              <Button
                type="button"
                onClick={() => signInWithProvider('facebook')}
                className={`${outlineButtonClass} gap-3 px-4 normal-case tracking-[0.04em]`}
              >
                <Image src="/icons/facebook.svg" alt="Facebook" width={18} height={18} />
                Continue with Facebook
              </Button>
            </div>
          </div>
        )}

        {/* FOOTER LINKS */}
        {mode === 'login' && (
          <div className="mt-10 border-t border-samara-line pt-8 text-center font-sans text-sm">
            {tab === 'password' && (
              <button
                type="button"
                className={`${textLinkClass} min-h-[44px]`}
                onClick={() => setMode('forgot')}
              >
                Forgot password?
              </button>
            )}
            <div className="mt-3 text-samara-mute">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className={`${textLinkClass} ml-1 min-h-[44px]`}
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
            className={`${textLinkClass} mx-auto mt-6 flex min-h-[44px] items-center transition-opacity disabled:cursor-not-allowed disabled:text-samara-mute disabled:opacity-70`}
            onClick={sendOtp}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        )}
      </form>
      </div>
    </div>
  );
}
