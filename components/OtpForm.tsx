'use client';

import { useState } from 'react';

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
    <div>
      {stage === 'send' && (
        <>
          <input
            placeholder="Phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <button onClick={sendOtp}>Send Voice OTP</button>
        </>
      )}

      {stage === 'verify' && (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}
    </div>
  );
}
