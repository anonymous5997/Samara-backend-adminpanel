import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const sessionId = body.sessionId ?? body.session_id;
    const otp = body.otp;

    if (!sessionId || !otp) {
      return NextResponse.json(
        { error: 'Missing sessionId or otp' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing TWOFACTOR_API_KEY' },
        { status: 500 }
      );
    }

    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
    const res = await fetch(url);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: '2Factor returned non-JSON', raw: text },
        { status: 502 }
      );
    }

    if (data.Status !== 'Success') {
      return NextResponse.json(
        { error: 'OTP verification failed', detail: data },
        { status: 400 }
      );
    }

    // ✅ SUCCESS
    return NextResponse.json({
      success: true,
      sessionId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', detail: String(err) },
      { status: 500 }
    );
  }
}

// ✅ THIS IS IMPORTANT FOR curl testing
export async function GET() {
  return NextResponse.json({
    ok: true,
    info: 'sms/verify route active — POST only',
  });
}
