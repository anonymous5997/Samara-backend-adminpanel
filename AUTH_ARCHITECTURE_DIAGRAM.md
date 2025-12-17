# Authentication System Architecture Diagram

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Email/Pass   │  │  Email OTP   │  │  Phone OTP   │             │
│  │   Form       │  │    Form      │  │    Form      │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
└─────────┼──────────────────┼──────────────────┼──────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │  Supabase Auth │  │  Supabase Auth │  │  Firebase Auth │        │
│  │  signInWith    │  │  signInWithOtp │  │  Phone Verify  │        │
│  │  Password()    │  │  ()            │  │                │        │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘        │
│           │                   │                     │                │
│           └───────────────────┼─────────────────────┘                │
│                               │                                      │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Firebase → Supabase   │
                    │ Bridge API            │
                    │ (Phone Auth Only)     │
                    └───────────┬───────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SUPABASE AUTH (SINGLE SOURCE)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  auth.users table                                       │        │
│  │  - id (primary key)                                     │        │
│  │  - email                                                │        │
│  │  - phone                                                │        │
│  │  - encrypted_password                                   │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SESSION MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  1. Kill All Existing Sessions                          │        │
│  │     - Use Service Role Key                              │        │
│  │     - admin.signOut(userId, 'global')                   │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                │                                     │
│  ┌─────────────────────────────▼───────────────────────────┐        │
│  │  2. Create Fresh Session                                │        │
│  │     - One active session per browser                    │        │
│  │     - admin.createSession({ user_id })                  │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PROFILE MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  /api/profile/ensure                                    │        │
│  │  - Check if profile exists                              │        │
│  │  - Create if missing (role: 'customer')                 │        │
│  │  - Update non-sensitive fields only                     │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                │                                     │
│  ┌─────────────────────────────▼───────────────────────────┐        │
│  │  profiles table                                         │        │
│  │  - id → auth.users.id                                   │        │
│  │  - email (required)                                     │        │
│  │  - phone (optional)                                     │        │
│  │  - name (optional)                                      │        │
│  │  - role ('customer' | 'admin')                          │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT STATE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  AuthContext (React Context)                            │        │
│  │  - user: User | null                                    │        │
│  │  - profile: Profile | null                              │        │
│  │  - loading: boolean                                     │        │
│  │  - isAdmin: boolean                                     │        │
│  │  - signOut()                                            │        │
│  │  - refreshProfile()                                     │        │
│  │  - ensureProfile()                                      │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Email/Password Authentication Flow

```
┌──────┐
│ User │
└──┬───┘
   │
   │ 1. Enter email & password
   ▼
┌──────────────────┐
│  Sign Up Form    │
└────────┬─────────┘
         │
         │ 2. supabase.auth.signUp()
         ▼
┌───────────────────────┐
│   Supabase Auth       │
│   Creates auth.users  │
└──────────┬────────────┘
           │
           │ 3. User created
           ▼
┌──────────────────────────┐
│ Session Auto-Created     │
│ (by Supabase)            │
└──────────┬───────────────┘
           │
           │ 4. Trigger profile ensure
           ▼
┌───────────────────────────┐
│ /api/profile/ensure       │
│ Creates profiles entry    │
│ role: 'customer'          │
└──────────┬────────────────┘
           │
           │ 5. Profile created
           ▼
┌────────────────────────┐
│ AuthContext loads      │
│ user + profile         │
└────────────┬───────────┘
             │
             │ 6. User authenticated
             ▼
        ┌─────────┐
        │ Success │
        └─────────┘
```

---

## Email OTP Authentication Flow

```
┌──────┐
│ User │
└──┬───┘
   │
   │ 1. Enter email
   ▼
┌─────────────────────┐
│ Email OTP Form      │
└─────────┬───────────┘
          │
          │ 2. supabase.auth.signInWithOtp()
          ▼
┌───────────────────────────┐
│ Supabase Auth             │
│ Generates 6-digit OTP     │
└──────────┬────────────────┘
           │
           │ 3. Send OTP via SMTP
           ▼
┌──────────────────────────────┐
│ Email Provider (Brevo/SES)   │
│ Delivers email with OTP      │
└──────────┬───────────────────┘
           │
           │ 4. User receives OTP
           ▼
┌────────────────────┐
│ User enters OTP    │
└─────────┬──────────┘
          │
          │ 5. supabase.auth.verifyOtp()
          ▼
┌──────────────────────────┐
│ Supabase Auth validates  │
│ Creates/finds user       │
└──────────┬───────────────┘
           │
           │ 6. Session created
           ▼
┌───────────────────────────┐
│ /api/profile/ensure       │
│ Creates/updates profile   │
└──────────┬────────────────┘
           │
           │ 7. Profile ready
           ▼
┌────────────────────────┐
│ AuthContext loads      │
└────────────┬───────────┘
             │
             ▼
        ┌─────────┐
        │ Success │
        └─────────┘
```

---

## Phone OTP Authentication Flow (Firebase Bridge)

```
┌──────┐
│ User │
└──┬───┘
   │
   │ 1. Enter phone number (+country code)
   ▼
┌────────────────────┐
│ Phone OTP Form     │
└─────────┬──────────┘
          │
          │ 2. Firebase.signInWithPhoneNumber()
          ▼
┌───────────────────────────┐
│ Firebase Auth             │
│ Sends SMS with OTP        │
└──────────┬────────────────┘
           │
           │ 3. User receives SMS
           ▼
┌────────────────────┐
│ User enters OTP    │
└─────────┬──────────┘
          │
          │ 4. Firebase verifies OTP
          ▼
┌──────────────────────────┐
│ Firebase Auth validates  │
│ Returns Firebase ID token│
└──────────┬───────────────┘
           │
           │ 5. Get Firebase token
           ▼
┌─────────────────────────────────┐
│ Call /api/auth/phone-to-supabase│
│ { firebaseToken, phone, name }  │
└──────────┬──────────────────────┘
           │
           │ 6. Server-side
           ▼
┌─────────────────────────────────────┐
│ Server Side (Node.js)               │
│ ┌─────────────────────────────────┐ │
│ │ 1. Verify Firebase ID token     │ │
│ └───────────────┬─────────────────┘ │
│                 │                   │
│ ┌───────────────▼─────────────────┐ │
│ │ 2. Find/Create Supabase user    │ │
│ │    admin.auth.admin.createUser()│ │
│ └───────────────┬─────────────────┘ │
│                 │                   │
│ ┌───────────────▼─────────────────┐ │
│ │ 3. Kill existing sessions       │ │
│ │    killAllUserSessions()        │ │
│ └───────────────┬─────────────────┘ │
│                 │                   │
│ ┌───────────────▼─────────────────┐ │
│ │ 4. Create fresh session         │ │
│ │    createFreshSession()         │ │
│ └───────────────┬─────────────────┘ │
│                 │                   │
│ ┌───────────────▼─────────────────┐ │
│ │ 5. Ensure profile exists        │ │
│ │    role: 'customer'             │ │
│ └───────────────┬─────────────────┘ │
│                 │                   │
│ ┌───────────────▼─────────────────┐ │
│ │ 6. Return Supabase session      │ │
│ └───────────────┬─────────────────┘ │
└─────────────────┼───────────────────┘
                  │
                  │ 7. Session data returned
                  ▼
┌─────────────────────────────────┐
│ Client sets Supabase session    │
│ supabase.auth.setSession()      │
└──────────┬──────────────────────┘
           │
           │ 8. AuthContext picks up session
           ▼
┌────────────────────────┐
│ User authenticated     │
└────────────┬───────────┘
             │
             ▼
        ┌─────────┐
        │ Success │
        └─────────┘
```

---

## Row Level Security (RLS) Enforcement

```
┌──────────────────────────────────────────────────────────┐
│                    Client Request                         │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  Next.js Middleware                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Check protected routes                              │  │
│  │ - /admin/* → Verify admin role from DB              │  │
│  │ - /profile, /orders → Verify authentication         │  │
│  └─────────────────────┬──────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 Supabase Database                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ RLS Policies (RESTRICTIVE)                         │  │
│  │                                                     │  │
│  │ SELECT: auth.uid() = id OR is_admin               │  │
│  │ UPDATE: auth.uid() = id AND role unchanged        │  │
│  │ INSERT: auth.uid() = id AND role = 'customer'     │  │
│  │ ADMIN UPDATE: EXISTS admin check                   │  │
│  └─────────────────────┬──────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  Data Returned                            │
│  - Users see own data only                                │
│  - Admins see all data                                    │
│  - No role escalation possible                            │
└──────────────────────────────────────────────────────────┘
```

---

## Session Management Flow

```
┌──────────────┐
│ User Login   │
└──────┬───────┘
       │
       │ 1. Login request
       ▼
┌───────────────────────────────────┐
│ Session Manager (Server-Side)    │
│ ┌───────────────────────────────┐ │
│ │ Step 1: killAllUserSessions() │ │
│ │ - Find all active sessions    │ │
│ │ - Delete from auth.sessions   │ │
│ │ - Invalidate refresh tokens   │ │
│ └───────────────┬───────────────┘ │
│                 │                 │
│ ┌───────────────▼───────────────┐ │
│ │ Step 2: createFreshSession()  │ │
│ │ - Generate new access token   │ │
│ │ - Generate new refresh token  │ │
│ │ - Store in auth.sessions      │ │
│ └───────────────┬───────────────┘ │
└─────────────────┼─────────────────┘
                  │
                  │ 2. Session created
                  ▼
┌─────────────────────────────────────┐
│ Client Receives Session             │
│ - access_token                      │
│ - refresh_token                     │
│ - Stored in httpOnly cookies        │
└──────────────┬──────────────────────┘
               │
               │ 3. Session active
               ▼
┌──────────────────────────────────┐
│ Benefits:                        │
│ ✓ One session per browser        │
│ ✓ Old sessions invalidated       │
│ ✓ Prevents session hijacking     │
│ ✓ Clean authentication state     │
└──────────────────────────────────┘
```

---

## Profile Creation & Role Management

```
┌────────────────────────┐
│ New User Created       │
│ in auth.users          │
└──────────┬─────────────┘
           │
           │ Trigger profile creation
           ▼
┌────────────────────────────────────────┐
│ /api/profile/ensure                    │
│ ┌────────────────────────────────────┐ │
│ │ Check: Profile exists?             │ │
│ │   YES → Update non-sensitive only  │ │
│ │   NO  → Create new profile         │ │
│ └──────────────┬─────────────────────┘ │
│                │                       │
│ ┌──────────────▼─────────────────────┐ │
│ │ ALWAYS enforce:                    │ │
│ │ - role: 'customer' on CREATE       │ │
│ │ - role: UNCHANGED on UPDATE        │ │
│ │ - email from auth.users            │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
           │
           │ Profile created/updated
           ▼
┌────────────────────────────────────────┐
│ profiles table                         │
│ ┌────────────────────────────────────┐ │
│ │ id: uuid (→ auth.users.id)         │ │
│ │ email: text (required)             │ │
│ │ name: text (optional)              │ │
│ │ phone: text (optional)             │ │
│ │ role: 'customer' | 'admin'         │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
           │
           │ RLS Policies protect:
           ▼
┌────────────────────────────────────────┐
│ Role Escalation Prevention             │
│ ┌────────────────────────────────────┐ │
│ │ ✓ Users CANNOT change own role     │ │
│ │ ✓ Only admins can update roles     │ │
│ │ ✓ INSERT enforces 'customer'       │ │
│ │ ✓ UPDATE requires admin for role   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
           │
           │ To promote to admin:
           ▼
┌────────────────────────────────────────┐
│ Manual Database Update ONLY            │
│ SQL:                                   │
│ UPDATE profiles                        │
│ SET role = 'admin'                     │
│ WHERE email = 'admin@example.com';     │
└────────────────────────────────────────┘
```

---

## Email Provider Configuration (Swappable)

```
┌─────────────────────────────────────────┐
│         Application Code                │
│ ┌─────────────────────────────────────┐ │
│ │ supabase.auth.signInWithOtp()       │ │
│ │ - NO direct email provider code     │ │
│ │ - NO SMTP configuration in code     │ │
│ └──────────────┬──────────────────────┘ │
└────────────────┼────────────────────────┘
                 │
                 │ Uses Supabase Auth
                 ▼
┌─────────────────────────────────────────┐
│      Supabase Auth Service              │
│ ┌─────────────────────────────────────┐ │
│ │ Configured SMTP Settings:           │ │
│ │ - Host                              │ │
│ │ - Port                              │ │
│ │ - Username                          │ │
│ │ - Password                          │ │
│ │ - Sender Email                      │ │
│ └──────────────┬──────────────────────┘ │
└────────────────┼────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
┌──────────────┐  ┌──────────────┐
│ Brevo SMTP   │  │ AWS SES SMTP │
│ (Current)    │  │ (Future)     │
└──────────────┘  └──────────────┘

Switching Providers:
1. Update SMTP settings in Supabase Dashboard
2. NO code changes required
3. Test email delivery
4. Done!
```

---

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ app/layout.tsx                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ClientProviders                                     │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ AuthProvider (AuthContext)                      │ │ │
│ │ │ ┌─────────────────────────────────────────────┐ │ │ │
│ │ │ │ CartProvider                                │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ Header (uses useAuth)                   │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────┘ │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ Main Content (children)                 │ │ │ │ │
│ │ │ │ │ - Public pages                          │ │ │ │ │
│ │ │ │ │ - Protected pages (middleware guards)   │ │ │ │ │
│ │ │ │ │ - Admin pages (middleware + RLS)        │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────┘ │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ Footer                                  │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Auth Flow in Components:
1. AuthProvider monitors auth state changes
2. On SIGNED_IN: Load profile from DB
3. Profile includes role ('customer' or 'admin')
4. isAdmin flag computed from profile.role
5. Components use isAdmin for conditional rendering
6. Server-side guards use database for actual security
```

---

**Legend:**
- `┌─┐ └─┘` = Container/Component
- `▼` = Data flow
- `→` = Process step
- `├─┤` = Decision point

**Color Coding (if supported):**
- 🔵 Blue = Supabase services
- 🟢 Green = Firebase services
- 🟡 Yellow = Custom API routes
- 🔴 Red = Security-critical operations

---

**Last Updated:** 2025-12-17
**Version:** 1.0.0
