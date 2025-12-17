import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

    return NextResponse.json({
      status: 'Firebase Admin is configured',
      config: {
        hasProjectId,
        hasClientEmail,
        hasPrivateKey,
        projectId: process.env.FIREBASE_PROJECT_ID,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Firebase Admin configuration error',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    const decoded = await verifyFirebaseToken(token);

    return NextResponse.json({
      success: true,
      decoded: {
        uid: decoded.uid,
        phone_number: decoded.phone_number,
        email: decoded.email,
      }
    });
  } catch (error: any) {
    console.error('Token verification test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.toString()
    }, { status: 401 });
  }
}
