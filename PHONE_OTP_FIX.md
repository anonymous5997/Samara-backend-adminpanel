# Phone OTP Authentication Fix

## Issue
Users were seeing "invalid Firebase token" error when trying to verify phone OTP.

## Root Causes Identified

1. **Missing Supabase Session Creation**: The firebase-sync endpoint was only creating a profile record, not a Supabase authentication session.

2. **Incomplete Token Verification Error Handling**: Error messages weren't detailed enough to debug the actual issue.

3. **Profile Field Mismatch**: The code was trying to insert `phone_verified` field which doesn't exist in the profiles table.

## Changes Made

### 1. Enhanced Firebase Token Verification (`/lib/firebase-admin.ts`)
- Added detailed error logging for Firebase Admin initialization
- Added console logs to track initialization success
- Better error messages when environment variables are missing

### 2. Fixed Firebase Sync Endpoint (`/app/api/auth/firebase-sync/route.ts`)
**Complete rewrite to properly create Supabase auth sessions:**

- **Token Verification**: Added try-catch specifically for token verification with detailed error logging
- **User Management**:
  - Checks if user exists by firebase_uid
  - Creates Supabase Auth user (not just profile) if new
  - Links profile with Supabase user ID
- **Session Creation**:
  - Creates temporary password
  - Sets fake email (required by Supabase)
  - Signs in with Supabase to get access/refresh tokens
  - Returns tokens to client
- **Error Handling**: Better error messages at each step

### 3. Updated Phone OTP Form (`/components/auth/PhoneOtpForm.tsx`)
- Import Supabase client
- Force fresh token with `getIdToken(true)`
- Handle response properly
- Set Supabase session with returned tokens
- Better error messages for users

### 4. Added Debug Endpoint (`/app/api/auth/test-firebase/route.ts`)
**New testing endpoint to help diagnose Firebase issues:**
- GET: Check Firebase configuration
- POST: Test token verification
- Returns detailed error information

## How It Works Now

1. **User enters phone number** → Firebase sends OTP
2. **User enters OTP** → Firebase verifies and returns user
3. **Client gets Firebase token** → Sends to `/api/auth/firebase-sync`
4. **Server verifies token** → Creates/finds Supabase user
5. **Server creates session** → Returns access + refresh tokens
6. **Client sets session** → User is authenticated

## Testing the Fix

### Check Firebase Configuration
```bash
curl http://localhost:3000/api/auth/test-firebase
```

Should return:
```json
{
  "status": "Firebase Admin is configured",
  "config": {
    "hasProjectId": true,
    "hasClientEmail": true,
    "hasPrivateKey": true,
    "projectId": "samara-sms-4d6de"
  }
}
```

### Test Token Verification
After getting a Firebase token from OTP:
```bash
curl -X POST http://localhost:3000/api/auth/test-firebase \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_FIREBASE_TOKEN"}'
```

### Full OTP Flow
1. Go to `/auth/login`
2. Enter phone number with country code (e.g., +919876543210)
3. Click "Send OTP"
4. Enter the OTP received
5. Click "Verify OTP"
6. Should redirect to home page, authenticated

## Verification Checklist

After OTP verification, check:
- [ ] No "invalid Firebase token" error
- [ ] User is redirected to home page
- [ ] User is logged in (check header)
- [ ] Profile is created in database
- [ ] Supabase auth session is active

## Common Issues & Solutions

### "Invalid Firebase token"
**Cause**: Firebase Admin SDK can't verify the token
**Solutions**:
- Check FIREBASE_PRIVATE_KEY format in .env
- Ensure Firebase project ID matches between client and admin
- Check server logs for detailed error

### "Failed to create session"
**Cause**: Supabase can't create auth session
**Solutions**:
- Check SUPABASE_SERVICE_ROLE_KEY in .env
- Verify database permissions
- Check if user already exists with different auth method

### "Phone number not found in token"
**Cause**: Firebase token doesn't contain phone number
**Solutions**:
- Ensure phone authentication is enabled in Firebase Console
- Check that OTP was verified successfully before getting token

## Environment Variables Required

```env
# Firebase Client (NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema Requirements

The `profiles` table must have:
- `id` (uuid, primary key) - matches Supabase auth user ID
- `firebase_uid` (text) - stores Firebase UID
- `phone` (text) - stores phone number
- `role` (text) - user role (customer/admin)

## Security Considerations

1. **Firebase Token Verification**: Always verify tokens server-side
2. **Temporary Passwords**: Used only for session creation, not exposed to client
3. **Fake Emails**: Used for Supabase compatibility, format: `{phone_digits}@phone.local`
4. **Session Tokens**: Properly encrypted and stored by Supabase client
5. **RLS Policies**: Profile access controlled by Supabase auth

## Next Steps

If issues persist:
1. Check server logs for detailed error messages
2. Use the test endpoint to verify configuration
3. Ensure Firebase Console has phone authentication enabled
4. Verify Supabase project settings allow phone authentication
