import { NextRequest, NextResponse } from 'next/server';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderId } = body;

    /* ---------------- VALIDATION ---------------- */
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Valid orderId is required' },
        { status: 400 }
      );
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials missing');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    /* ---------------- RAZORPAY PAYLOAD ---------------- */
    const razorpayOrderPayload = {
      amount: Math.round(amount * 100), // INR → paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        order_id: orderId,
      },
    };

    /* ---------------- CREATE ORDER ---------------- */
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify(razorpayOrderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Razorpay API Error:', data);
      return NextResponse.json(
        { error: data?.error?.description || 'Razorpay order failed' },
        { status: response.status }
      );
    }

    /* ---------------- SUCCESS ---------------- */
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Razorpay Order Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
