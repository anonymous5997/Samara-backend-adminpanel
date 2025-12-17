import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { email, otp } = await req.json();

  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  const { data } = await supabaseAdmin
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .eq('otp_hash', otpHash)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!data) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }

  await supabaseAdmin
    .from('email_otps')
    .update({ used: true })
    .eq('id', data.id);

  // 🔐 Create Supabase auth user
  const { data: authUser } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

  return NextResponse.json({ user: authUser.user });
}
