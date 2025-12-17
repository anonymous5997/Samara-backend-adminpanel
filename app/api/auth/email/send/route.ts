import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOtpEmail } from '@/lib/ses';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await supabaseAdmin.from('email_otps').insert({
      email,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('EMAIL OTP ERROR:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
