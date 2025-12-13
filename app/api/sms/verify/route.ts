import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId ?? body.session_id ?? null;
    const otp = body.otp ?? null;

    if (!sessionId || !otp) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing TWOFACTOR_API_KEY in server env' }, { status: 500 });

    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
    console.log('DEBUG: Calling 2factor VERIFY', url.replace(apiKey, '***REDACTED***'));
    const res = await fetch(url, { method: 'GET' });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('DEBUG: non-json from 2factor (verify)', text);
      return NextResponse.json({ error: 'Non-JSON response from 2factor', raw: text }, { status: 502 });
    }

    console.log('DEBUG: 2factor verify response', data);

    if (!data || data.Status !== 'Success') {
      return NextResponse.json({ error: 'OTP verification failed', detail: data }, { status: 400 });
    }

    return NextResponse.json({ success: true, detail: data });
  } catch (err) {
    console.error('sms/verify error', err);
    return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 });
  }
}

// TEMP GET to confirm route exists
export async function GET() {
  return NextResponse.json({ ok: true, info: 'sms/verify route active — POST only' });
}
