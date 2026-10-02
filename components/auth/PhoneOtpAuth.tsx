'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { supabase } from '@/lib/supabase/client';

/**
 * Phone OTP Authentication Component
 *
 * ARCHITECTURE FLOW:
 * 1. User enters phone number
 * 2. Firebase sends OTP via SMS
 * 3. User enters OTP
 * 4. Firebase verifies OTP
 * 5. Get Firebase ID token
 * 6. Send to /api/auth/phone-to-supabase bridge
 * 7. Server creates Supabase user + session
 * 8. Client receives Supabase session
 * 9. AuthContext picks up session automatically
 */

interface PhoneOtpAuthProps {
  mode: 'signin' | 'signup';
  name?: string;
  onNameChange?: (name: string) => void;
}

export function PhoneOtpAuth({ mode, name, onNameChange }: PhoneOtpAuthProps) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('[Phone Auth] reCAPTCHA verified');
          },
        }
      );
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number format
      if (!phone.startsWith('+')) {
        toast.error('Please include country code (e.g., +91 for India)');
        setLoading(false);
        return;
      }

      // Setup reCAPTCHA
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;

      // Send OTP via Firebase
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);

      toast.success('OTP sent to your phone');
      console.log('[Phone Auth] OTP sent successfully');
    } catch (error: any) {
      console.error('Error sending OTP:', error);

      if (error.code === 'auth/invalid-phone-number') {
        toast.error('Invalid phone number format');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }

      // Reset reCAPTCHA on error
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!confirmationResult) {
        toast.error('Please request OTP first');
        setLoading(false);
        return;
      }

      // Verify OTP with Firebase
      const firebaseResult = await confirmationResult.confirm(otp);
      const firebaseUser = firebaseResult.user;

      console.log('[Phone Auth] Firebase OTP verified:', firebaseUser.uid);

      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      // Bridge to Supabase
      const response = await fetch('/api/auth/phone-to-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseToken,
          phone,
          name: name || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const { session } = await response.json();

      console.log('[Phone Auth] Supabase session created:', session.user.id);

      // Set Supabase session
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      toast.success('Successfully signed in!');
      router.push('/');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);

      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid OTP. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        toast.error('OTP expired. Please request a new one.');
      } else {
        toast.error(error.message || 'Failed to verify OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="recaptcha-container"></div>

      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-6 text-samara-ivory">
          {mode === 'signup' && (
            <div>
              <Label htmlFor="name-phone" className="mb-2.5 block font-sans text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-mute">
                Full Name
              </Label>
              <Input
                id="name-phone"
                type="text"
                required
                value={name || ''}
                onChange={(e) => onNameChange?.(e.target.value)}
                placeholder="Your name"
                className="h-12 w-full rounded-none border border-samara-line bg-transparent px-4 font-sans text-sm text-samara-ivory placeholder:text-samara-mute/70 focus:border-samara-gold focus-visible:ring-1 focus-visible:ring-samara-gold focus-visible:ring-offset-0"
              />
            </div>
          )}

          <div>
            <Label htmlFor="phone" className="mb-2.5 block font-sans text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-mute">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 1234567890"
              className="h-12 w-full rounded-none border border-samara-line bg-transparent px-4 font-sans text-sm text-samara-ivory placeholder:text-samara-mute/70 focus:border-samara-gold focus-visible:ring-1 focus-visible:ring-samara-gold focus-visible:ring-offset-0"
            />
            <p className="mt-2 font-sans text-xs text-samara-mute">
              Include country code (e.g., +91 for India)
            </p>
          </div>

          <Button
            type="submit"
            className="sm-btn h-auto w-full rounded-none bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6 text-samara-ivory">
          <div>
            <Label htmlFor="otp" className="mb-2.5 block font-sans text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-mute">
              Enter OTP
            </Label>
            <Input
              id="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="h-12 w-full rounded-none border border-samara-line bg-transparent px-4 font-sans text-sm text-samara-ivory placeholder:text-samara-mute/70 focus:border-samara-gold focus-visible:ring-1 focus-visible:ring-samara-gold focus-visible:ring-offset-0"
            />
            <p className="mt-2 font-sans text-xs text-samara-mute">OTP sent to {phone}</p>
          </div>

          <Button
            type="submit"
            className="sm-btn h-auto w-full rounded-none bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="sm-btn h-auto w-full rounded-none text-samara-gold hover:bg-transparent hover:text-samara-ivory"
            onClick={() => {
              setOtpSent(false);
              setOtp('');
              setConfirmationResult(null);
            }}
          >
            Use different phone
          </Button>
        </form>
      )}
    </>
  );
}
