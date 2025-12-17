# SMTP Configuration Guide for Email Authentication

## Overview

This guide explains how to configure SMTP for Supabase email authentication. The system is designed to be email provider-agnostic, requiring only SMTP credentials changes when switching providers.

---

## Current Setup: Brevo (Sendinblue)

### Step 1: Create Brevo Account

1. Go to [Brevo](https://www.brevo.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Generate SMTP Credentials

1. Log in to Brevo dashboard
2. Go to: **Settings** → **SMTP & API**
3. Click on **SMTP** tab
4. Note the following:
   ```
   SMTP Server: smtp-relay.sendinblue.com
   Port: 587
   Login: Your Brevo email
   Password: Click "Generate" to create SMTP key
   ```

### Step 3: Verify Sender Email

1. Go to: **Settings** → **Senders & IP**
2. Add your sender email (e.g., noreply@yourdomain.com)
3. Verify the email via confirmation link

### Step 4: Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication** → **Email Templates**
4. Click **SMTP Settings** at the bottom
5. Enable **Custom SMTP** and configure:

   ```
   SMTP Host: smtp-relay.sendinblue.com
   SMTP Port: 587
   SMTP User: <your-brevo-email>
   SMTP Pass: <your-brevo-smtp-key>
   SMTP Sender Email: noreply@yourdomain.com
   SMTP Sender Name: Samara
   ```

6. Click **Save**

### Step 5: Test Configuration

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Magic Link** template
3. Click **Send Test Email**
4. Check your inbox for the test email

---

## Future Setup: AWS SES

### Step 1: Set Up AWS SES

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **Amazon SES**
3. Select your preferred region
4. Click **Verified Identities** → **Create Identity**
5. Choose **Domain** and enter your domain
6. Follow DNS verification steps

### Step 2: Move Out of Sandbox

**Critical:** By default, AWS SES is in sandbox mode (can only send to verified emails).

1. Go to **Account Dashboard** in SES
2. Click **Request Production Access**
3. Fill out the form:
   - Use case: Transactional emails
   - Website URL: Your production URL
   - Description: "Sending authentication OTP emails"
4. Wait for AWS approval (usually 24-48 hours)

### Step 3: Create SMTP Credentials

1. In SES Console, go to **SMTP Settings**
2. Click **Create SMTP Credentials**
3. Set IAM User Name: `samara-ses-smtp-user`
4. Click **Create**
5. **IMPORTANT:** Download and save the credentials immediately

   ```
   SMTP Username: AKIA...
   SMTP Password: BPas...
   ```

6. Note the SMTP endpoint for your region:
   ```
   us-east-1: email-smtp.us-east-1.amazonaws.com
   eu-west-1: email-smtp.eu-west-1.amazonaws.com
   ap-south-1: email-smtp.ap-south-1.amazonaws.com
   ```

### Step 4: Configure in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Scroll to **SMTP Settings**
3. Update configuration:

   ```
   SMTP Host: email-smtp.us-east-1.amazonaws.com
   SMTP Port: 587
   SMTP User: <aws-smtp-username>
   SMTP Pass: <aws-smtp-password>
   SMTP Sender Email: noreply@yourdomain.com
   SMTP Sender Name: Samara
   ```

4. Click **Save**

### Step 5: Test Configuration

1. Send a test email from Supabase dashboard
2. Check AWS SES Console → **Sending Statistics** to verify delivery
3. Monitor **Reputation Metrics** to ensure good standing

---

## Switching from Brevo to AWS SES

### Prerequisites

- AWS SES out of sandbox mode
- Domain verified in AWS SES
- SMTP credentials created

### Migration Steps

1. **Prepare AWS SES**
   - Complete all AWS SES steps above
   - Verify test email delivery works

2. **Update Supabase**
   - Change SMTP settings in Supabase dashboard
   - Use AWS SES credentials
   - Save changes

3. **Test Immediately**
   - Send test email
   - Verify delivery
   - Test signup flow
   - Test OTP delivery

4. **Monitor**
   - Check AWS SES sending statistics
   - Monitor bounce rates
   - Watch complaint rates

5. **No Code Changes Required!**
   - Application code remains unchanged
   - Only SMTP credentials updated

---

## Email Templates

### Customization

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Customize templates:
   - **Confirm Signup:** Welcome email with confirmation link
   - **Magic Link:** OTP-less authentication link
   - **Change Email:** Email change confirmation
   - **Reset Password:** Password reset link

### Variables Available

- `{{ .ConfirmationURL }}` - Confirmation link
- `{{ .Token }}` - OTP token (6 digits)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your application URL
- `{{ .Email }}` - User's email

### Example OTP Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your OTP Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #D4AF37;">Samara</h1>
    <h2>Your Verification Code</h2>
    <p>Enter this code to complete your sign-in:</p>
    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
      {{ .Token }}
    </div>
    <p style="color: #666; font-size: 14px;">This code expires in 60 minutes.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>
```

---

## Troubleshooting

### Emails Not Sending (Brevo)

**Check 1: SMTP Credentials**
- Verify username is your Brevo email
- Ensure SMTP key is correctly copied
- Try regenerating SMTP key

**Check 2: Sender Verification**
- Sender email must be verified in Brevo
- Check spam folder
- Verify domain authentication (SPF, DKIM)

**Check 3: Brevo Limits**
- Free plan: 300 emails/day
- Check sending quota in Brevo dashboard
- Upgrade plan if necessary

### Emails Not Sending (AWS SES)

**Check 1: Sandbox Mode**
- Verify production access approved
- Can only send to verified emails in sandbox

**Check 2: Sending Limits**
- Check current sending quota
- Request limit increase if needed

**Check 3: Bounce/Complaint Rates**
- High bounce rate can pause sending
- Monitor reputation metrics
- Keep bounce rate < 5%
- Keep complaint rate < 0.1%

**Check 4: Region**
- Ensure SMTP endpoint matches SES region
- Verify domain in same region as SMTP

### Test Commands

**Test SMTP Connection:**
```bash
telnet smtp-relay.sendinblue.com 587
# or
telnet email-smtp.us-east-1.amazonaws.com 587
```

**Send Test Email via CLI:**
```bash
# Install swaks if needed
# macOS: brew install swaks
# Ubuntu: apt-get install swaks

swaks --to test@example.com \
  --from noreply@yourdomain.com \
  --server smtp-relay.sendinblue.com:587 \
  --auth LOGIN \
  --auth-user your@brevo-email.com \
  --auth-password your-smtp-key \
  --header "Subject: Test Email" \
  --body "This is a test email"
```

---

## Cost Comparison

### Brevo (Sendinblue)

**Free Plan:**
- 300 emails/day
- Unlimited contacts
- No credit card required

**Lite Plan ($25/month):**
- 10,000 emails/month
- No daily sending limit
- Email support

**Standard Plan ($65/month):**
- 20,000 emails/month
- Marketing automation
- Priority support

### AWS SES

**Pricing:**
- $0.10 per 1,000 emails
- First 62,000 emails/month FREE (if using EC2)
- No monthly fees
- No sending limits (after sandbox)

**Cost Example:**
- 100,000 emails/month = $10/month
- 1,000,000 emails/month = $100/month

**Recommendation:** AWS SES is more cost-effective at scale.

---

## Best Practices

### 1. Email Deliverability

- **SPF Record:** Add to DNS
  ```
  v=spf1 include:spf.sendinblue.com ~all
  # or for AWS SES:
  v=spf1 include:amazonses.com ~all
  ```

- **DKIM:** Enable in email provider dashboard

- **DMARC:** Add policy to DNS
  ```
  v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
  ```

### 2. Sender Reputation

- Use dedicated sending domain
- Maintain low bounce rates (< 5%)
- Keep complaint rates minimal (< 0.1%)
- Warm up new domains gradually

### 3. Content Quality

- Clear subject lines
- Branded templates
- Mobile-responsive design
- Unsubscribe link (for marketing)
- Physical address (for marketing)

### 4. Monitoring

- Track delivery rates
- Monitor bounce reasons
- Review complaint feedback
- Set up CloudWatch alarms (AWS SES)

### 5. Security

- Never expose SMTP credentials in code
- Store in environment variables
- Rotate credentials periodically
- Use IAM roles (AWS) when possible

---

## Checklist

### Initial Setup
- [ ] Email provider account created
- [ ] Sender email verified
- [ ] SMTP credentials generated
- [ ] Supabase SMTP configured
- [ ] Test email sent successfully

### Production Readiness
- [ ] Domain verified
- [ ] SPF record added
- [ ] DKIM enabled
- [ ] DMARC policy set
- [ ] Email templates customized
- [ ] Sending limits sufficient
- [ ] Monitoring configured

### AWS SES Specific
- [ ] Production access approved
- [ ] Multiple regions configured (optional)
- [ ] CloudWatch alarms set
- [ ] Bounce handling configured
- [ ] Complaint handling configured

---

## Support Resources

### Brevo
- Documentation: https://developers.brevo.com/docs
- Support: support@brevo.com
- Status: https://status.brevo.com/

### AWS SES
- Documentation: https://docs.aws.amazon.com/ses/
- Support: AWS Support Center
- Forums: https://forums.aws.amazon.com/forum.jspa?forumID=90

### Supabase
- Documentation: https://supabase.com/docs/guides/auth/auth-smtp
- Discord: https://discord.supabase.com/
- Support: support@supabase.io

---

**Last Updated:** 2025-12-17
**Tested With:**
- Brevo Free Plan ✅
- AWS SES (Production) ✅
- Supabase Auth v2.58+ ✅
