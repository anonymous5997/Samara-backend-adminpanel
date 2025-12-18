# Supabase Phone Authentication Setup Guide

This guide will help you configure phone authentication in your Supabase project using an SMS provider.

## Overview

Supabase supports phone authentication through several SMS providers:
- **Twilio** (Recommended - Most popular and reliable)
- **MessageBird**
- **Textlocal**
- **Vonage**

## Step 1: Choose an SMS Provider

### Option A: Twilio (Recommended)

Twilio is the most popular SMS provider with excellent reliability and global coverage.

#### 1. Create a Twilio Account
- Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
- Sign up for a free account (includes trial credits)
- Verify your email and phone number

#### 2. Get Your Twilio Credentials
After signing up:
- Go to your [Twilio Console](https://console.twilio.com/)
- Find your **Account SID** and **Auth Token** on the dashboard
- Keep these safe - you'll need them in the next step

#### 3. Get a Phone Number
- In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
- Choose a number that supports SMS
- Purchase the number (trial accounts can get one free number)

### Option B: MessageBird

MessageBird is popular in Europe with good pricing.

#### 1. Create a MessageBird Account
- Go to [https://www.messagebird.com](https://www.messagebird.com)
- Sign up for an account

#### 2. Get Your API Key
- Go to **Developers** → **API Keys**
- Copy your **Live API Key**

### Option C: Vonage (formerly Nexmo)

Vonage offers competitive pricing and good API documentation.

#### 1. Create a Vonage Account
- Go to [https://dashboard.nexmo.com/sign-up](https://dashboard.nexmo.com/sign-up)
- Sign up for an account

#### 2. Get Your API Credentials
- Find your **API Key** and **API Secret** in the dashboard

## Step 2: Configure Supabase

### 1. Open Supabase Dashboard
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project: `wrsrobuicquzpfgnfnmh`

### 2. Navigate to Authentication Settings
- Click on **Authentication** in the left sidebar
- Go to **Providers** tab

### 3. Enable Phone Authentication
- Find **Phone** in the list of providers
- Toggle it to **Enabled**

### 4. Configure Your SMS Provider

#### For Twilio:
1. Select **Twilio** as your SMS provider
2. Enter your credentials:
   - **Twilio Account SID**: (from step 1)
   - **Twilio Auth Token**: (from step 1)
   - **Twilio Phone Number**: Your purchased number (format: +1234567890)
3. Click **Save**

#### For MessageBird:
1. Select **MessageBird** as your SMS provider
2. Enter your **API Key**
3. Enter your **Originator** (sender name or number)
4. Click **Save**

#### For Vonage:
1. Select **Vonage** as your SMS provider
2. Enter your **API Key** and **API Secret**
3. Enter your **From** number
4. Click **Save**

### 5. Configure Phone Authentication Settings

Still in the Authentication settings:

1. **Enable phone confirmations** (optional)
   - If enabled, phone numbers must be verified before users can sign in
   - Recommended for production

2. **Phone OTP expiry**
   - Default: 60 seconds
   - Adjust based on your needs (60-300 seconds recommended)

3. **Rate limiting**
   - Configure to prevent abuse
   - Recommended: Max 5 attempts per hour per phone number

## Step 3: Test Your Setup

### 1. Use the Test Component
The application includes a test component at:
```
/app/auth/login
```

Navigate to the **Phone** tab and test:
1. Enter your phone number with country code (e.g., +91 1234567890)
2. Click "Send OTP"
3. Check your phone for the OTP
4. Enter the OTP and verify

### 2. Verify in Supabase Dashboard
- Go to **Authentication** → **Users**
- After successful login, you should see a new user with:
  - Phone number populated
  - `phone_confirmed_at` timestamp

## Step 4: Production Checklist

Before going live, ensure:

- [ ] Phone provider is configured with production credentials (not trial)
- [ ] Rate limiting is enabled to prevent abuse
- [ ] Phone confirmation is enabled for security
- [ ] Test with multiple phone numbers from different countries (if international)
- [ ] Monitor SMS delivery rates in your provider's dashboard
- [ ] Set up billing alerts in your SMS provider account

## Troubleshooting

### OTP Not Received

1. **Check SMS provider dashboard**
   - Verify the message was sent
   - Check for delivery errors
   - Ensure sufficient credits/balance

2. **Check phone number format**
   - Must include country code with `+`
   - Example: `+91 1234567890` (India), `+1 5551234567` (US)

3. **Check Supabase logs**
   - Go to **Logs** → **Auth Logs**
   - Look for errors related to phone authentication

### Invalid OTP Error

1. **Check OTP expiry time**
   - Default is 60 seconds
   - User must enter OTP before it expires

2. **Verify phone number matches**
   - The phone number used to request OTP must match verification

3. **Check for typos**
   - OTP is case-sensitive (usually 6 digits)

### User Already Exists

- If a user with that phone number already exists, they'll be signed in
- To create a new account, the user must use a different phone number

## Cost Estimation

### Twilio (US/India)
- India: ~₹0.50-1.00 per SMS
- US: ~$0.0075 per SMS
- Free trial: $15 credit

### MessageBird
- Starting at €0.045 per SMS
- Free trial: €10 credit

### Vonage
- Starting at $0.0067 per SMS
- Free trial: €2 credit

## Security Best Practices

1. **Enable Rate Limiting**
   - Prevent brute force attacks
   - Limit OTP requests per phone number

2. **Use HTTPS Only**
   - Never send phone numbers over unencrypted connections

3. **Implement Phone Verification**
   - Require users to verify their phone before critical actions

4. **Monitor for Abuse**
   - Watch for unusual patterns in your SMS provider dashboard
   - Set up alerts for high-volume usage

5. **Row Level Security (RLS)**
   - Already configured in the project
   - Ensures users can only access their own data

## Additional Resources

- [Supabase Phone Auth Documentation](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio Documentation](https://www.twilio.com/docs)
- [MessageBird Documentation](https://developers.messagebird.com/)
- [Vonage Documentation](https://developer.vonage.com/)

## Support

If you encounter issues:
1. Check Supabase Auth Logs
2. Check SMS provider delivery reports
3. Review this guide's troubleshooting section
4. Contact your SMS provider support
5. Check [Supabase Discord](https://discord.supabase.com/) for community help
