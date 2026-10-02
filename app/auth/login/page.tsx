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
import { Toaster } from '@/components/ui/sonner';

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
    <>
      <Toaster />
      <div className="min-h-screen bg-samara-void text-samara-ivory flex items-center justify-center pt-32 pb-24 md:pb-32 px-4 relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-samara-gold/30 to-transparent" />
        <div className="absolute -top-[500px] -right-[500px] w-[1000px] h-[1000px] rounded-full bg-samara-gold/5 blur-[120px] pointer-events-none" />

        <form
          onSubmit={onSubmit}
          className="w-full max-w-md bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12 relative z-10"
        >
          {/* HEADER */}
          <div className="text-center mb-10">
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-3 block">
              Authentication
            </span>
            <h2 className="text-3xl font-serif text-samara-ivory mb-2">
              {mode === 'set-password' ? 'Set Password' : mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-[11px] font-sans tracking-widest uppercase text-samara-ivory/40">
              {mode === 'set-password' ? 'Secure your account' : mode === 'signup' ? 'Join the Samara collective' : 'Sign in to continue'}
            </p>
          </div>

          {/* TABS */}
          {mode !== 'verify-otp' && mode !== 'set-password' && mode !== 'signup' && mode !== 'forgot' && (
            <div className="flex mb-8 border-b border-samara-ivory/10">
              {['password', 'email', 'phone'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={`flex-1 py-3 text-[10px] font-sans tracking-[0.2em] uppercase transition-colors relative ${
                    tab === t
                      ? 'text-samara-gold'
                      : 'text-samara-ivory/40 hover:text-samara-ivory'
                  }`}
                  onClick={() => {
                    setTab(t as any);
                    setMode('login');
                    setIsSignupFlow(false);
                    localStorage.removeItem('pending_name'); 
                  }}
                >
                  {t}
                  {tab === t && (
                    <div className="absolute bottom-0 left-0 w-full h-px bg-samara-gold" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {/* NAME */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">Full Name</label>
                <Input
                  placeholder="Your Name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors"
                />
              </div>
            )}

            {/* EMAIL / PHONE */}
            {mode !== 'set-password' && (
              <>
                {tab !== 'phone' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">Email Address</label>
                    <Input
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors"
                    />
                  </div>
                )}
                {tab === 'phone' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">Phone Number</label>
                    <Input
                      placeholder="+91 XXXXXXXXXX"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors"
                    />
                  </div>
                )}
              </>
            )}

            {/* PASSWORD */}
            {(mode === 'login' && tab === 'password') || mode === 'set-password' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'set-password' ? "Enter new password" : "Enter password"}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-samara-ivory/40 hover:text-samara-gold transition-colors"
                    onClick={() => setShowPassword(p => !p)}
                  >
                    <Eye className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* OTP */}
            {mode === 'verify-otp' && (
              <div className="space-y-2">
                <label className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">One Time Password</label>
                <Input
                  placeholder="6-digit code"
                  value={form.otp}
                  onChange={e => update('otp', e.target.value)}
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/20 transition-colors tracking-[0.5em] text-center"
                />
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-8 h-12 bg-samara-gold hover:bg-samara-goldDeep text-samara-void rounded-none font-sans text-[11px] tracking-[0.2em] uppercase transition-colors"
          >
            {loading
              ? 'Processing...'
              : mode === 'verify-otp'
              ? 'Verify Code'
              : mode === 'signup'
              ? 'Send Code'
              : mode === 'set-password'
              ? 'Save & Login'
              : tab === 'email' || tab === 'phone'
              ? 'Send Code'
              : 'Sign In'}
          </Button>

          {/* RESEND OTP */}
          {mode === 'verify-otp' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold border-b border-samara-gold/30 hover:border-samara-gold pb-1 disabled:opacity-50 disabled:border-transparent transition-colors"
                onClick={sendOtp}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          )}

          {/* SOCIAL LOGIN */}
          {mode === 'login' && (
            <div className="mt-8 pt-8 border-t border-samara-ivory/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-samara-ivory/10" />
                <span className="text-[9px] font-sans tracking-[0.3em] uppercase text-samara-ivory/40">Or Continue With</span>
                <div className="flex-1 h-px bg-samara-ivory/10" />
              </div>
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={() => signInWithProvider('google')}
                  className="w-full h-12 bg-transparent border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold rounded-none font-sans text-[11px] tracking-[0.1em] uppercase transition-colors flex items-center justify-center gap-3"
                >
                  <Image src="/icons/google.svg" alt="Google" width={16} height={16} className="opacity-80 group-hover:opacity-100" />
                  Google
                </Button>
                {/* 
                <Button
                  type="button"
                  onClick={() => signInWithProvider('facebook')}
                  className="w-full h-12 bg-transparent border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold rounded-none font-sans text-[11px] tracking-[0.1em] uppercase transition-colors flex items-center justify-center gap-3"
                >
                  <Image src="/icons/facebook.svg" alt="Facebook" width={16} height={16} className="opacity-80 group-hover:opacity-100" />
                  Facebook
                </Button>
                */}
              </div>
            </div>
          )}

          {/* FOOTER LINKS */}
          {mode === 'login' && (
            <div className="text-center mt-8 space-y-4">
              {tab === 'password' && (
                <button
                  type="button"
                  className="block w-full text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40 hover:text-samara-gold transition-colors"
                  onClick={() => setMode('forgot')}
                >
                  Forgot your password?
                </button>
              )}
              <div className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60">
                New to Samara?{' '}
                <button
                  type="button"
                  className="text-samara-gold hover:text-samara-goldDeep transition-colors ml-1"
                  onClick={() => {
                    setMode('signup');
                    setTab('password'); // Optional default for signup
                  }}
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
          
          {(mode === 'signup' || mode === 'forgot') && (
            <div className="text-center mt-8">
              <button
                type="button"
                className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 hover:text-samara-gold transition-colors"
                onClick={() => setMode('login')}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}