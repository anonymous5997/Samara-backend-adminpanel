'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
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

  /* ---------------- STATE ---------------- */
  const [tab, setTab] = useState<'password' | 'email' | 'phone'>('password');
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
  });

  const [loading, setLoading] = useState(false);

  /* ---------------- HELPERS ---------------- */
  const update = (k: string, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  /* ---------------- LOGIN ---------------- */
  const loginPassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (error) toast.error(error.message);
    else router.push('/');
  };

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    setLoading(true);

    const payload =
      tab === 'phone'
        ? { phone: form.phone }
        : { email: form.email };

    const { error } = await supabase.auth.signInWithOtp(payload);

    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('OTP sent');
      setMode('verify-otp');
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async () => {
    setLoading(true);

    const payload =
      tab === 'phone'
        ? { phone: form.phone, token: form.otp, type: 'sms' }
        : { email: form.email, token: form.otp, type: 'email' };

    const { error } = await supabase.auth.verifyOtp(payload as any);

    setLoading(false);

    if (error) toast.error(error.message);
    else setMode('set-password');
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
    const { error } = await supabase.auth.updateUser({
      password: form.password,
    });
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('Password reset successfully');
      router.push('/');
    }
  };

  /* ---------------- SIGNUP START ---------------- */
  const signupStart = async () => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
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
          Welcome Back
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Sign in to continue
        </p>

        {/* TABS */}
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
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

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

        {/* PASSWORD — ONLY WHEN NEEDED */}
        {(mode === 'login' && tab === 'password') ||
        mode === 'set-password' ? (
          <div className="relative mb-3">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#1a1a1a] text-white"
        >
          {loading ? 'Please wait...' : 'Sign In'}
        </Button>

        {/* LINKS */}
        {mode === 'login' && (
          <div className="text-center mt-5 text-sm">
            <button
              type="button"
              className="text-[#D4AF37]"
              onClick={() => setMode('forgot')}
            >
              Forgot password?
            </button>
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

        {mode === 'verify-otp' && (
          <button
            type="button"
            className="text-xs text-[#D4AF37] mt-4 block mx-auto"
            onClick={sendOtp}
          >
            Resend OTP
          </button>
        )}
      </form>
    </div>
  );
}
