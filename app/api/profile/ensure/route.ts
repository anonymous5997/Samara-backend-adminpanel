import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const body = await req.json();
  const { id, email, phone, name } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  }

  await supabaseAdmin.from('profiles').upsert({
    id,
    email,
    phone,
    name,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
