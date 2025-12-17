'use client';

import { useEffect, useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: any;
  }
}

export default function PhoneOtpForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,                    // ✅ auth FIRST
        'recaptcha-container',   // ✅ container ID
        { size: 'invisible' }
      );
    }
  }, []);

  const sendOtp = async () => {
    try {
      setLoading(true);

      const confirmation = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier!
      );

      window.confirmationResult = confirmation;
      setStep('otp');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      const result = await window.confirmationResult.confirm(otp);
      const token = await result.user.getIdToken();

      await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseToken: token }),
      });

      window.location.href = '/'; // ✅ redirect works
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'phone' ? (
        <>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="w-full p-3 bg-black border border-yellow-500 text-white"
          />
          <button
            onClick={sendOtp}
            className="w-full bg-yellow-500 py-3 text-black"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full p-3 bg-black border border-yellow-500 text-white"
          />
          <button
            onClick={verifyOtp}
            className="w-full bg-yellow-500 py-3 text-black"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </>
      )}

      <div id="recaptcha-container" />
    </div>
  );
}
