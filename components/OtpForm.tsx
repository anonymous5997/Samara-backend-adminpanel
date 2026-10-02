'use client';

import { useState } from 'react';
import { fieldClass, goldButtonClass } from '@/components/content/formStyles';

export default function OtpForm() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [stage, setStage] = useState<'send' | 'verify'>('send');

  async function sendOtp() {
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error);

    setSessionId(data.sessionId);
    setStage('verify');
  }

  async function verifyOtp() {
    const res = await fetch('/api/sms/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, otp }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error);

    alert('OTP Verified Successfully!');
  }

  return (
    <div className="w-full space-y-4 text-samara-ivory">
      {stage === 'send' && (
        <>
          <input
            placeholder="Phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className={fieldClass}
          />
          <button onClick={sendOtp} className={goldButtonClass}>Send Voice OTP</button>
        </>
      )}

      {stage === 'verify' && (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className={`${fieldClass} h-16 text-center indent-[0.5em] font-sans text-2xl font-light tabular-nums tracking-[0.5em] placeholder:font-sans placeholder:text-sm placeholder:uppercase placeholder:tracking-eyebrow placeholder:indent-0`}
          />
          <button onClick={verifyOtp} className={goldButtonClass}>Verify OTP</button>
        </>
      )}
    </div>
  );
}
