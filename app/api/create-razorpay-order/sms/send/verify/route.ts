import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sessionId, otp } = await req.json();

    if (!sessionId || !otp)
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const apiKey = process.env.TWOFACTOR_API_KEY;

    const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;

    const res = await fetch(url, { method: "GET" });
    const data = await res.json();

    if (data.Status !== "Success") {
      return NextResponse.json({ error: "OTP verification failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
