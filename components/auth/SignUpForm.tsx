// components/auth/SignUpForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { fieldClass, goldButtonClass, labelClass, outlineButtonClass } from '@/components/content/formStyles';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [smsOtp, setSmsOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      // Grab user id if immediately available (may be null until confirmation)
      const userId = data?.user?.id ?? null;

      if (phone) {
        const r = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const json = await r.json();
        if (json.sessionId) {
          setSessionId(json.sessionId);
          alert('SMS OTP sent — enter it below to verify.');
        } else {
          console.error(json);
          alert('Failed to send SMS OTP');
        }
      } else {
        alert('Check your email for confirmation instructions from Supabase.');
      }
    } catch (err) {
      console.error(err);
      alert('Sign up error');
    } finally {
      setLoading(false);
    }
  };

  const verifySms = async () => {
    if (!sessionId) return alert('No SMS sessionId available.');
    setLoading(true);
    try {
      // fetch current user id if available
      const userResp = await supabase.auth.getUser?.();
      const userId = userResp?.data?.user?.id ?? null;

      const r = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp: smsOtp, userId, phone })
      });
      const json = await r.json();
      if (json.success) {
        alert('Phone verified successfully');
        // optionally refresh profile or redirect to dashboard
      } else {
        console.error(json);
        alert('Verification failed: ' + (json?.error ?? 'unknown'));
      }
    } catch (err) {
      console.error(err);
      alert('Verify error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] text-samara-ivory">
      <form onSubmit={handleSignup} className="space-y-6">
        <div>
          <label className={labelClass}>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Phone (digits only, include country code)</label>
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+9199..." className={fieldClass} />
        </div>

        <button type="submit" disabled={loading} className={goldButtonClass}>{loading ? 'Please wait...' : 'Sign up'}</button>
      </form>

      {sessionId && (
        <div className="mt-8 space-y-4 border-t border-samara-line pt-8">
          <label className={labelClass}>Enter SMS OTP</label>
          <input value={smsOtp} onChange={(e)=>setSmsOtp(e.target.value)} className={`${fieldClass} h-16 text-center indent-[0.5em] font-sans text-2xl font-light tabular-nums tracking-[0.5em]`} />
          <button onClick={verifySms} disabled={loading} className={outlineButtonClass}>Verify SMS</button>
        </div>
      )}
    </div>
  );
}
