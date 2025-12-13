// app/api/sms/send/route.ts
import { NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter keyed by phone and IP.
 * - LIMIT_COUNT calls allowed per WINDOW_MS
 * - This is *not* persistent across server restarts and only works when you
 *   have a single Node process. For production, use Redis or another shared store.
 */
const WINDOW_MS = 60 * 1000; // 1 minute window
const LIMIT_COUNT = 5;

type RateEntry = { count: number; firstTs: number };
const rateMap = new Map<string, RateEntry>();

function getKey(phone: string | null, ip: string | null) {
  // combine both to be safer
  return `${phone ?? 'no-phone'}::${ip ?? 'no-ip'}`;
}

function isRateLimited(phone: string | null, ip: string | null) {
  const key = getKey(phone, ip);
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry) {
    rateMap.set(key, { count: 1, firstTs: now });
    return false;
  }

  if (now - entry.firstTs > WINDOW_MS) {
    // reset window
    rateMap.set(key, { count: 1, firstTs: now });
    return false;
  }

  if (entry.count >= LIMIT_COUNT) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawPhone = body.phone?.toString() ?? null;
    const phone = rawPhone ? rawPhone.replace(/\D/g, '') : null;
    if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 });

    // try to get IP (best-effort)
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null);

    if (isRateLimited(phone, ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN`;
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();

    if (!data || data.Status !== 'Success') {
      // log for debugging
      console.error('2factor send error', { phone, data });
      return NextResponse.json({ error: 'Failed to send OTP', detail: data }, { status: 500 });
    }

    return NextResponse.json({ sessionId: data.Details });
  } catch (err) {
    console.error('sms/send error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
