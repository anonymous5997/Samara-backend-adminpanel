import { NextResponse } from 'next/server';

const WINDOW_MS = 60 * 1000;
const LIMIT_COUNT = 5;
type RateEntry = { count: number; firstTs: number };
const rateMap = new Map<string, RateEntry>();

function getKey(phone: string | null, ip: string | null) {
  return `${phone ?? 'no-phone'}::${ip ?? 'no-ip'}`;
}
function isRateLimited(phone: string | null, ip: string | null) {
  const key = getKey(phone, ip);
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry) { rateMap.set(key, { count: 1, firstTs: now }); return false; }
  if (now - entry.firstTs > WINDOW_MS) { rateMap.set(key, { count: 1, firstTs: now }); return false; }
  if (entry.count >= LIMIT_COUNT) return true;
  entry.count += 1;
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone?.toString() ?? null;
    const phone = rawPhone ? rawPhone.replace(/\D/g, '') : null;
    if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 });

    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null);
    if (isRateLimited(phone, ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) {
      console.error('DEBUG: Missing TWOFACTOR_API_KEY in env');
      return NextResponse.json({ error: 'Missing TWOFACTOR_API_KEY in server env' }, { status: 500 });
    }

    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN`;
    console.log('DEBUG: Calling 2factor URL', url.replace(apiKey, '***REDACTED***'));
    const res = await fetch(url, { method: 'GET' });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('DEBUG: non-json from 2factor', text);
      return NextResponse.json({ error: 'Non-JSON response from 2factor', raw: text }, { status: 502 });
    }

    console.log('DEBUG: 2factor response', { phone, data });

    if (!data || data.Status !== 'Success') {
      return NextResponse.json({ error: '2factor rejected', detail: data }, { status: 500 });
    }

    return NextResponse.json({ sessionId: data.Details, detail: data });
  } catch (err) {
    console.error('sms/send error', err);
    return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 });
  }
}

// TEMP GET so you can open route in browser to confirm it exists (remove later)
export async function GET() {
  return NextResponse.json({ ok: true, info: 'sms/send route active — POST only' });
}
