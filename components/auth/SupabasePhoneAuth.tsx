'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SupabasePhoneAuth() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }

    // Validate phone format (must include country code with +)
    if (!phone.startsWith('+')) {
      toast.error('Phone number must start with + and country code (e.g., +91)');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });

      if (error) {
        console.error('Error sending OTP:', error);
        toast.error(error.message || 'Failed to send OTP');
        return;
      }

      toast.success('OTP sent to your phone!');
      setStep('otp');
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp.trim(),
        type: 'sms',
      });

      if (error) {
        console.error('Error verifying OTP:', error);
        toast.error(error.message || 'Invalid OTP');
        return;
      }

      if (data.session) {
        toast.success('Signed in successfully!');

        // Wait a moment for the auth state to propagate
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    await sendOtp();
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
  };

  return (
    <div className="space-y-6 text-samara-ivory">
      {step === 'phone' ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="phone" className="mb-2.5 block font-sans text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-mute">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 1234567890"
              className="h-12 w-full rounded-none border border-samara-line bg-transparent px-4 font-sans text-sm text-samara-ivory placeholder:text-samara-mute/70 focus:border-samara-gold focus-visible:ring-1 focus-visible:ring-samara-gold focus-visible:ring-offset-0"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendOtp();
                }
              }}
            />
            <p className="mt-2 font-sans text-xs text-samara-mute">
              Include country code (e.g., +91 for India)
            </p>
          </div>

          <Button
            onClick={sendOtp}
            className="sm-btn h-auto w-full rounded-none bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
            disabled={loading}
            size="lg"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="otp" className="mb-2.5 block font-sans text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-mute">
              Enter OTP
            </Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="h-12 w-full rounded-none border border-samara-line bg-transparent px-4 font-sans text-sm text-samara-ivory placeholder:text-samara-mute/70 focus:border-samara-gold focus-visible:ring-1 focus-visible:ring-samara-gold focus-visible:ring-offset-0 h-16 text-center indent-[0.5em] font-sans text-2xl font-light tabular-nums tracking-[0.5em]"
              disabled={loading}
              maxLength={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && otp.length === 6) {
                  verifyOtp();
                }
              }}
            />
            <p className="mt-2 font-sans text-xs text-samara-mute text-center">
              Sent to {phone}
            </p>
          </div>

          <Button
            onClick={verifyOtp}
            className="sm-btn h-auto w-full rounded-none bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
            disabled={loading || otp.length !== 6}
            size="lg"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleBack}
              variant="outline"
              className="sm-btn h-auto rounded-none border-samara-line bg-transparent px-4 text-samara-ivory hover:border-samara-ivory hover:bg-transparent hover:text-samara-ivory flex-1"
              disabled={loading}
            >
              Change Number
            </Button>
            <Button
              onClick={handleResendOtp}
              variant="outline"
              className="sm-btn h-auto rounded-none border-samara-line bg-transparent px-4 text-samara-ivory hover:border-samara-ivory hover:bg-transparent hover:text-samara-ivory flex-1"
              disabled={loading}
            >
              Resend OTP
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
