import admin from "firebase-admin";

function initializeFirebase() {
  if (admin.apps.length) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Firebase Admin] Missing environment variables:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
    });
    throw new Error('[Firebase Admin] Missing required environment variables');
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    console.log('[Firebase Admin] Successfully initialized');
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
    throw error;
  }
}

export async function verifyFirebaseToken(token: string) {
  initializeFirebase();
  return admin.auth().verifyIdToken(token);
}

export function getAdminAuth() {
  initializeFirebase();
  return admin.auth();
}
