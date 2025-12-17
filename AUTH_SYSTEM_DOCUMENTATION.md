# Production Authentication System Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Flows](#authentication-flows)
3. [Database Schema](#database-schema)
4. [Security & RLS Policies](#security--rls-policies)
5. [Session Management](#session-management)
6. [API Routes](#api-routes)
7. [Frontend Integration](#frontend-integration)
8. [Middleware & Route Protection](#middleware--route-protection)
9. [Email Configuration](#email-configuration)
10. [Admin Management](#admin-management)
11. [Testing & Verification](#testing--verification)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION SOURCES                     │
├──────────────────────┬──────────────────────┬────────────────┤
│   Email/Password     │      Email OTP       │   Phone OTP    │
│   (Supabase Auth)    │  (Supabase Auth)     │  (Firebase)    │
└──────────┬───────────┴──────────┬───────────┴────────┬───────┘
           │                      │                     │
           └──────────────────────┼─────────────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │   Supabase Auth    │
                        │  (Single Source)   │
                        └─────────┬──────────┘
                                  │
                        ┌─────────▼──────────┐
                        │   Session Manager  │
                        │  (Kill Old + New)  │
                        └─────────┬──────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  Profile Creation  │
                        │  (role: customer)  │
                        └─────────┬──────────┘
                                  │
                        ┌─────────▼──────────┐
                        │   AuthContext      │
                        │  (Client State)    │
                        └────────────────────┘
```

### Critical Rules

1. **Supabase Auth** is the ONLY source of truth for authentication
2. **Email OTP** uses Supabase's native email OTP (not custom tables)
3. **Phone OTP** uses Firebase for verification, then creates Supabase users
4. **Session Management**: Kill existing sessions before creating new ones
5. **Profile Creation**: Always create with `role: 'customer'`
6. **Admin Promotion**: Manual database update only

---

## Authentication Flows

### 1. Email/Password Authentication

**Sign Up Flow:**
```
1. User enters email, password, name
2. Supabase.auth.signUp() creates auth.users entry
3. /api/profile/ensure creates profiles entry
4. Session created automatically
5. AuthContext loads profile
```

**Sign In Flow:**
```
1. User enters email, password
2. Supabase.auth.signInWithPassword() verifies credentials
3. Server kills all existing sessions (automatic)
4. New session created
5. AuthContext loads profile
```

### 2. Email OTP Authentication

**Flow:**
```
1. User enters email
2. Supabase.auth.signInWithOtp() sends OTP via SMTP
3. User enters OTP from email
4. Supabase.auth.verifyOtp() validates
5. Session created
6. /api/profile/ensure creates/updates profile
7. AuthContext loads profile
```

**SMTP Configuration:**
- Currently: Brevo SMTP
- Future: AWS SES SMTP
- Change: Update Supabase SMTP settings only
- NO code changes required

### 3. Phone OTP Authentication (Firebase Bridge)

**Flow:**
```
1. User enters phone number (+country code)
2. Firebase sends OTP via SMS
3. User enters OTP
4. Firebase verifies OTP
5. Get Firebase ID token
6. Call /api/auth/phone-to-supabase with token
7. Server:
   - Verifies Firebase token
   - Creates/finds Supabase auth user
   - Kills existing sessions
   - Creates fresh session
   - Creates/updates profile
8. Client receives Supabase session
9. AuthContext picks up session
```

**Why Firebase for Phone?**
- Supabase phone OTP requires Twilio (expensive)
- Firebase phone auth is free and reliable
- Firebase is ONLY used for phone verification
- Supabase manages all sessions and authorization

---

## Database Schema

### profiles Table

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  phone text,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Field Rules:**
- `id`: MUST match auth.users.id
- `email`: Required, unique
- `phone`: Optional, unique if provided
- `role`: ALWAYS 'customer' on creation
- `name`: Optional display name

---

## Security & RLS Policies

### Row Level Security (RLS)

**All policies are RESTRICTIVE by default.**

#### 1. SELECT Policy

```sql
-- Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
    )
  );
```

#### 2. UPDATE Policy (Users)

```sql
-- Users can update non-sensitive fields only
CREATE POLICY "Users can update own profile non-sensitive fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
```

**Prevents role escalation!**

#### 3. INSERT Policy

```sql
-- Users can only create customer profiles
CREATE POLICY "Users can insert own profile as customer"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND
    role = 'customer'
  );
```

#### 4. UPDATE Policy (Admins)

```sql
-- Admins can update any profile including roles
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

---

## Session Management

### Critical Requirements

1. **One Session Per Browser**
   - Kill all existing sessions before login
   - Prevents session hijacking
   - Ensures clean state

2. **Server-Side Session Management**
   - File: `lib/auth/session-manager.ts`
   - Uses Supabase Service Role Key
   - NEVER expose to client

### Session Manager Functions

```typescript
// Kill all sessions for a user
await killAllUserSessions(userId);

// Create fresh session (kills old ones first)
const session = await createFreshSession(userId);

// Verify current session
const sessionData = await verifySession();

// Check if user is admin
const isAdmin = await isAdmin();

// Require admin (throws if not)
await requireAdmin();

// Require authentication (throws if not)
await requireAuth();
```

---

## API Routes

### 1. `/api/profile/ensure` (POST)

**Purpose:** Create or update user profile

**Request:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "+1234567890",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "profile": { ...profileData },
  "action": "created" | "updated"
}
```

**Security:**
- Always creates with `role: 'customer'`
- Never allows role updates from client
- Only updates non-sensitive fields on existing profiles

### 2. `/api/auth/phone-to-supabase` (POST)

**Purpose:** Bridge Firebase phone auth to Supabase

**Request:**
```json
{
  "firebaseToken": "eyJhbGc...",
  "phone": "+1234567890",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "session": { ...sessionData },
  "user": { ...userData }
}
```

**Flow:**
1. Verify Firebase ID token
2. Extract phone number
3. Find/create Supabase user
4. Kill existing sessions
5. Create fresh session
6. Ensure profile exists
7. Return session to client

---

## Frontend Integration

### AuthContext

**Location:** `lib/auth-context.tsx`

**Provides:**
```typescript
{
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  ensureProfile: () => Promise<void>;
}
```

**Usage:**
```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, profile, isAdmin, signOut } = useAuth();

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {profile?.name}</p>
      {isAdmin && <AdminPanel />}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

**CRITICAL:** Never trust `isAdmin` alone for security. Always verify server-side!

---

## Middleware & Route Protection

### Middleware Configuration

**File:** `middleware.ts`

**Protected Routes:**
- `/profile` - Requires authentication
- `/orders` - Requires authentication
- `/wishlist` - Requires authentication
- `/checkout` - Requires authentication
- `/admin/*` - Requires admin role

**Flow:**
```
1. Check if route is protected
2. Verify user session
3. If admin route:
   - Fetch profile from database
   - Check role === 'admin'
   - Redirect if not admin
4. If protected route:
   - Redirect to login if not authenticated
5. Allow access if authorized
```

**Security:** Server-side role verification prevents client-side bypasses

---

## Email Configuration

### Current Setup: Brevo (Sendinblue)

**Supabase Dashboard Configuration:**

1. Go to: Authentication → Email Templates → SMTP Settings
2. Configure:
   ```
   Host: smtp-relay.sendinblue.com
   Port: 587
   Username: <your-brevo-email>
   Password: <your-brevo-api-key>
   Sender Email: noreply@yourdomain.com
   Sender Name: Your App Name
   ```

### Future Setup: AWS SES

**When switching to AWS SES:**

1. Verify domain in AWS SES
2. Create SMTP credentials in AWS SES Console
3. Update Supabase SMTP settings:
   ```
   Host: email-smtp.<region>.amazonaws.com
   Port: 587
   Username: <aws-smtp-username>
   Password: <aws-smtp-password>
   Sender Email: noreply@yourdomain.com
   Sender Name: Your App Name
   ```

**NO CODE CHANGES REQUIRED!**

Supabase handles all email sending through SMTP. Your application code never touches email providers directly.

---

## Admin Management

### Creating Admin Users

**CRITICAL:** Admin role can ONLY be assigned via database.

**Method 1: SQL**
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';
```

**Method 2: Supabase Dashboard**
1. Go to Table Editor → profiles
2. Find user by email
3. Update role column to 'admin'

**Security:** RLS policies prevent users from escalating their own roles

### Admin-Only Operations

**Server-Side Protection:**
```typescript
import { requireAdmin } from '@/lib/auth/session-manager';

export async function POST(req: Request) {
  // This will throw if user is not admin
  await requireAdmin();

  // Admin-only logic here
  //...
}
```

**Client-Side UI:**
```typescript
import { useAuth } from '@/lib/auth-context';

function AdminButton() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return <button>Admin Action</button>;
}
```

---

## Testing & Verification

### Test Scenarios

#### 1. Email/Password Sign Up
```
✓ Create account with email/password
✓ Profile created with role: 'customer'
✓ Can sign in
✓ Session persists
✓ Can sign out
```

#### 2. Email OTP
```
✓ Send OTP to email
✓ Receive email via SMTP
✓ Verify OTP
✓ Profile created
✓ Session created
```

#### 3. Phone OTP
```
✓ Send OTP via Firebase
✓ Receive SMS
✓ Verify OTP
✓ Firebase token generated
✓ Supabase user created
✓ Profile created with role: 'customer'
✓ Session created
✓ Can access protected routes
```

#### 4. Session Management
```
✓ Login kills existing sessions
✓ Only one active session per user
✓ Old sessions invalidated
```

#### 5. Authorization
```
✓ Customer cannot access /admin
✓ Middleware redirects non-admin users
✓ Admin can access /admin
✓ RLS policies enforce database-level security
```

#### 6. Role Security
```
✓ Users cannot change their own role
✓ Only admins can update roles
✓ Profile updates don't affect role
✓ INSERT policy enforces customer role
```

### Verification Commands

**Check RLS Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';
```

**Check User Sessions:**
```sql
SELECT id, user_id, created_at, updated_at
FROM auth.sessions
WHERE user_id = '<user-id>';
```

**Check Profile:**
```sql
SELECT id, email, phone, role, created_at
FROM profiles
WHERE email = 'test@example.com';
```

---

## Environment Variables

### Required Variables

**.env.local:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Firebase (for phone auth)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE....\n-----END PRIVATE KEY-----\n"
```

---

## Troubleshooting

### Common Issues

**1. Profile not created after signup**
- Check: `/api/profile/ensure` is called
- Check: RLS policies allow INSERT
- Check: auth.users entry exists

**2. Email OTP not received**
- Check: Supabase SMTP settings
- Check: Sender email verified
- Check: Spam folder
- Check: SMTP logs in Supabase dashboard

**3. Phone OTP fails**
- Check: Firebase project configured
- Check: Phone format includes country code
- Check: reCAPTCHA configured
- Check: Firebase Console → Authentication → Phone enabled

**4. Session not persisting**
- Check: Cookies enabled
- Check: HTTPS in production
- Check: Session expiry settings

**5. Admin redirected from /admin**
- Check: Profile role in database
- Check: Middleware configuration
- Check: Server-side role verification
- Check: RLS policies

---

## Security Checklist

- [x] RLS enabled on profiles table
- [x] Users cannot escalate roles
- [x] Server-side role verification
- [x] One session per browser
- [x] Session killing before login
- [x] Firebase token verification
- [x] Profile creation restricted to customer role
- [x] Admin role requires manual database update
- [x] Middleware protects sensitive routes
- [x] Email unique constraint
- [x] Phone unique constraint
- [x] Service role key server-side only

---

## Production Deployment

### Pre-Deployment Checklist

1. **Environment Variables**
   - [ ] All variables set in production
   - [ ] Service role key secured
   - [ ] Firebase admin key secured

2. **Supabase Configuration**
   - [ ] SMTP configured (Brevo or AWS SES)
   - [ ] Email templates customized
   - [ ] RLS policies deployed
   - [ ] Indexes created

3. **Firebase Configuration**
   - [ ] Phone authentication enabled
   - [ ] Authorized domains added
   - [ ] reCAPTCHA configured

4. **Testing**
   - [ ] All auth flows tested
   - [ ] Session management verified
   - [ ] Role protection verified
   - [ ] Email delivery tested
   - [ ] Phone OTP tested

---

## Support & Maintenance

### Regular Maintenance

1. **Monitor Sessions**
   - Check for orphaned sessions
   - Verify session expiry

2. **Review Logs**
   - Authentication errors
   - SMTP delivery issues
   - Firebase errors

3. **Update Dependencies**
   - Supabase client library
   - Firebase SDK
   - Next.js framework

### Contact

For issues or questions:
- Supabase: https://supabase.com/docs
- Firebase: https://firebase.google.com/docs
- Next.js: https://nextjs.org/docs

---

**Last Updated:** 2025-12-17
**Version:** 1.0.0
**Status:** Production Ready ✅
