# AWS Production Deployment Guide

Complete guide for deploying Samara E-Commerce to AWS with S3, CloudFront, EC2, SES, and SNS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Samara AWS Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Static)          Backend (Dynamic)                │
│  ┌─────────────┐            ┌─────────────┐                │
│  │   S3 Bucket │────────────│   EC2 t3    │                │
│  │  (Next.js)  │            │   (Admin)   │                │
│  └──────┬──────┘            └──────┬──────┘                │
│         │                           │                        │
│         │                           │                        │
│  ┌──────▼──────┐            ┌──────▼──────┐                │
│  │ CloudFront  │            │    Nginx    │                │
│  │     CDN     │            │   Reverse   │                │
│  └─────────────┘            │    Proxy    │                │
│                             └─────────────┘                │
│                                                               │
│  Storage & Services         Database & Auth                  │
│  ┌─────────────┐            ┌─────────────┐                │
│  │  S3 Bucket  │            │  Supabase   │                │
│  │   (Images)  │            │ PostgreSQL  │                │
│  └─────────────┘            │   + Auth    │                │
│                             └─────────────┘                │
│  ┌─────────────┐                                            │
│  │   AWS SES   │            ┌─────────────┐                │
│  │   (Email)   │            │   AWS SNS   │                │
│  │             │            │    (SMS)    │                │
│  └─────────────┘            └─────────────┘                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS Account with billing enabled
- AWS CLI installed and configured
- Node.js 18+ installed locally
- Git repository (GitHub)
- Supabase project (existing)
- Domain name (optional but recommended)

## Table of Contents

1. [AWS IAM Setup](#1-aws-iam-setup)
2. [S3 Bucket Configuration](#2-s3-bucket-configuration)
3. [CloudFront Distribution](#3-cloudfront-distribution)
4. [EC2 Instance Setup](#4-ec2-instance-setup)
5. [SES Email Configuration](#5-ses-email-configuration)
6. [SNS SMS Configuration](#6-sns-sms-configuration)
7. [Environment Variables](#7-environment-variables)
8. [GitHub Actions CI/CD](#8-github-actions-cicd)
9. [Image Migration](#9-image-migration)
10. [Monitoring & Maintenance](#10-monitoring--maintenance)

---

## 1. AWS IAM Setup

### Create IAM User for Deployments

```bash
aws iam create-user --user-name samara-deploy
```

### Create Access Keys

```bash
aws iam create-access-key --user-name samara-deploy
```

Save the `AccessKeyId` and `SecretAccessKey` securely.

### Attach Required Policies

```bash
# S3 Full Access
aws iam attach-user-policy \
  --user-name samara-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# CloudFront Full Access
aws iam attach-user-policy \
  --user-name samara-deploy \
  --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess

# SES Full Access
aws iam attach-user-policy \
  --user-name samara-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess

# SNS Full Access
aws iam attach-user-policy \
  --user-name samara-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess
```

---

## 2. S3 Bucket Configuration

### Create S3 Buckets

**For Product Images:**

```bash
aws s3 mb s3://samara-images --region ap-south-1
```

**For Frontend Static Files (optional):**

```bash
aws s3 mb s3://samara-frontend --region ap-south-1
```

### Configure CORS for Image Bucket

Create `cors.json`:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Apply CORS:

```bash
aws s3api put-bucket-cors \
  --bucket samara-images \
  --cors-configuration file://cors.json
```

### Configure Public Access (for CloudFront)

```bash
aws s3api put-public-access-block \
  --bucket samara-images \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### Set Bucket Policy

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::samara-images/*"
    }
  ]
}
```

Apply policy:

```bash
aws s3api put-bucket-policy \
  --bucket samara-images \
  --policy file://bucket-policy.json
```

---

## 3. CloudFront Distribution

### Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name samara-images.s3.ap-south-1.amazonaws.com \
  --default-root-object index.html
```

Note the **Distribution ID** and **Domain Name** from the output.

### Configure Custom Domain (Optional)

1. Create SSL certificate in AWS Certificate Manager (ACM)
2. Validate domain ownership
3. Add CNAME record in Route 53 or your DNS provider
4. Update CloudFront distribution with custom domain

---

## 4. EC2 Instance Setup

### Launch EC2 Instance

**Recommended:** t3.micro or t3.small

```bash
aws ec2 run-instances \
  --image-id ami-0a0f1259dd1c90938 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxx \
  --subnet-id subnet-xxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=samara-backend}]'
```

### Security Group Configuration

Open ports:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

### Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Run Setup Script

```bash
# Clone repository
git clone https://github.com/yourusername/samara.git /var/www/samara
cd /var/www/samara

# Run setup script
chmod +x deploy/ec2-setup.sh
./deploy/ec2-setup.sh
```

### Configure Environment Variables

```bash
cd /var/www/samara
cp .env.local.example .env
nano .env
```

Fill in all required values (see [Environment Variables](#7-environment-variables))

### Initial Deployment

```bash
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
```

---

## 5. SES Email Configuration

### Verify Email Address or Domain

**Verify single email:**

```bash
aws ses verify-email-identity \
  --email-address noreply@yourdomain.com \
  --region ap-south-1
```

**Verify domain (recommended for production):**

```bash
aws ses verify-domain-identity \
  --domain yourdomain.com \
  --region ap-south-1
```

Add the verification records to your DNS.

### Move Out of Sandbox Mode

1. Go to AWS Console > SES
2. Click "Request Production Access"
3. Fill out the form explaining your use case
4. Wait for approval (usually 24-48 hours)

### Test Email Sending

```bash
# After setup, test from your app or CLI
aws ses send-email \
  --from noreply@yourdomain.com \
  --destination ToAddresses=test@example.com \
  --message Subject={Data="Test"},Body={Text={Data="Hello from Samara"}} \
  --region ap-south-1
```

### Enable in Application

Update `.env`:

```env
USE_AWS_SES=true
SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## 6. SNS SMS Configuration

### Configure SMS Settings

```bash
aws sns set-sms-attributes \
  --attributes DefaultSMSType=Transactional
```

### Set Spending Limit (Optional)

```bash
aws sns set-sms-attributes \
  --attributes MonthlySpendLimit=100
```

### Request Origination Number (India)

For India, you need to register a sender ID:

1. Go to AWS Console > SNS
2. Click "Text messaging (SMS)" > "Sender IDs"
3. Request a sender ID (e.g., "SAMARA")
4. Wait for approval

### Alternative: Use MSG91 (Recommended for India)

AWS SNS SMS can be expensive in India. Use MSG91 instead:

1. Sign up at [MSG91](https://msg91.com/)
2. Get API key and sender ID
3. Update `.env`:

```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=SAMARA
```

---

## 7. Environment Variables

### Production Environment Variables

On EC2 instance, create `/var/www/samara/.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# S3
NEXT_PUBLIC_USE_S3=true
AWS_S3_BUCKET=samara-images
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# SES
USE_AWS_SES=true
SES_FROM_EMAIL=noreply@yourdomain.com

# SNS/SMS
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_msg91_key
MSG91_SENDER_ID=SAMARA

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret
```

---

## 8. GitHub Actions CI/CD

### Add GitHub Secrets

Go to your GitHub repository > Settings > Secrets and add:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BUCKET
AWS_S3_FRONTEND_BUCKET
AWS_CLOUDFRONT_DOMAIN
AWS_CLOUDFRONT_DISTRIBUTION_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_USE_S3
EC2_HOST
EC2_USERNAME
EC2_SSH_KEY
```

### Enable Workflows

Workflows are in `.github/workflows/`:

- `test.yml` - Runs on every push
- `deploy-backend.yml` - Deploys to EC2
- `deploy-frontend.yml` - Deploys to S3+CloudFront

Push to `main` branch to trigger deployments.

---

## 9. Image Migration

### Migrate Existing Images to S3

Run the migration script:

```bash
npm install
npx ts-node scripts/migrate-images-to-s3.ts
```

This will:
1. Fetch all images from Supabase Storage
2. Upload to S3
3. Update database URLs
4. Preserve image metadata

**Before migration:**
- Backup your database
- Test with a few images first
- Ensure S3 bucket is configured

---

## 10. Monitoring & Maintenance

### CloudWatch Metrics

Monitor:
- EC2 CPU/Memory usage
- S3 request counts
- CloudFront cache hit ratio
- SES bounce/complaint rates

### Logs

**EC2 Application Logs:**

```bash
pm2 logs samara-app
```

**Nginx Logs:**

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Strategy

**Database (Supabase):**
- Automatic daily backups
- Manual backups before deployments

**S3 Images:**
- Enable versioning:
  ```bash
  aws s3api put-bucket-versioning \
    --bucket samara-images \
    --versioning-configuration Status=Enabled
  ```

### Cost Optimization

**Estimated Monthly Costs:**

- EC2 t3.micro: $10/month
- S3 storage (100GB): $2.30/month
- CloudFront (1TB transfer): $85/month
- SES (10K emails): $1/month
- SNS SMS (via MSG91): Variable

**Total: ~$100-150/month**

### Security Best Practices

1. **Rotate IAM keys** every 90 days
2. **Enable MFA** on AWS root account
3. **Use SSL certificates** (Let's Encrypt)
4. **Update packages** regularly
5. **Monitor CloudWatch** for suspicious activity
6. **Implement rate limiting** on API routes

---

## Deployment Checklist

### Initial Setup
- [ ] Create AWS account
- [ ] Configure IAM user
- [ ] Create S3 buckets
- [ ] Set up CloudFront distribution
- [ ] Launch EC2 instance
- [ ] Configure SES email
- [ ] Configure SNS/MSG91 SMS
- [ ] Add GitHub secrets

### Before Each Deployment
- [ ] Backup database
- [ ] Test locally
- [ ] Update environment variables
- [ ] Run migrations if needed

### After Deployment
- [ ] Test admin panel
- [ ] Test order placement
- [ ] Test email sending
- [ ] Test SMS sending
- [ ] Check CloudWatch logs
- [ ] Verify S3 uploads

---

## Estimated 1-Year Cost (Low Traffic, Approximate)

Below are approximate costs in INR for running Samara on AWS with **low traffic** (development or early-stage production). These are rough estimates and actual costs will vary based on usage patterns, region pricing, and AWS plan changes.

### Monthly Cost Breakdown (in INR)

| Service | Usage Assumption | Approximate Monthly Cost (INR) |
|---------|------------------|-------------------------------|
| **EC2 t3.micro** | 730 hours/month (always-on) | ₹750 |
| **S3 Storage** | 50 GB stored data | ₹115 |
| **S3 Requests** | 100K PUT, 500K GET per month | ₹50 |
| **CloudFront** | 100 GB data transfer out | ₹800 |
| **SES Emails** | 5,000 emails/month | ₹0 (within free tier of 62K emails/month if sending from EC2) |
| **SNS SMS** | 100 SMS/month (India) | ₹500 (₹5/SMS approximate) |
| **Route 53** | 1 hosted zone + queries | ₹50 |
| **CloudWatch Logs** | 5 GB ingestion, 5 GB storage | ₹200 |
| **Data Transfer** | 10 GB additional transfer | ₹100 |
| **Supabase Free Tier** | 500 MB database, 1 GB file storage | ₹0 |
| **Total (Monthly)** | | **~₹2,565** |

### Annual Cost Estimate

**Yearly Total:** ₹2,565 × 12 = **~₹30,780 per year**

### Scaling Considerations

As traffic increases, costs will scale:

**Medium Traffic (10K orders/month):**
- EC2: Consider t3.small (~₹1,500/month)
- CloudFront: 500 GB transfer (~₹4,000/month)
- SMS: 500 SMS (~₹2,500/month)
- Supabase: Paid plan ~₹2,000/month
- **Estimated:** ₹12,000–15,000/month

**High Traffic (50K orders/month):**
- EC2: t3.medium or multiple instances (~₹3,000–6,000/month)
- CloudFront: 2 TB transfer (~₹16,000/month)
- RDS/Managed DB recommended (~₹6,000–10,000/month)
- **Estimated:** ₹30,000–50,000/month

### Cost Optimization Tips

1. **Use Reserved Instances:** Save up to 40% on EC2 by committing to 1–3 year reserved instances
2. **S3 Intelligent-Tiering:** Automatically moves infrequently accessed objects to cheaper storage
3. **CloudFront Cache Settings:** Increase cache TTL to reduce origin requests
4. **Compress Assets:** Enable gzip/brotli compression to reduce bandwidth
5. **Use MSG91 for SMS:** More cost-effective than SNS for Indian SMS (₹0.10–0.20/SMS)
6. **Enable CloudWatch Alarms:** Get notified before costs exceed budget

### Free Tier Eligibility

**AWS Free Tier (first 12 months):**
- EC2: 750 hours/month of t2.micro or t3.micro
- S3: 5 GB standard storage
- CloudFront: 1 TB data transfer out
- SES: 62,000 emails/month (if sending from EC2)

**Supabase Free Tier (permanent):**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests

### Important Notes

- All prices are approximate and based on ap-south-1 (Mumbai) region pricing as of December 2024
- GST (18%) may apply on top of AWS charges in India
- Currency conversion: 1 USD ≈ ₹83.50 (subject to change)
- These estimates assume efficient resource usage and proper optimization
- Monitor your AWS Cost Explorer dashboard regularly
- Set up billing alerts to avoid unexpected charges

### Monthly Cost Monitoring

Track costs using:
```bash
# AWS CLI cost command
aws ce get-cost-and-usage \
  --time-period Start=2024-12-01,End=2024-12-31 \
  --granularity MONTHLY \
  --metrics "UnblendedCost"
```

Or use AWS Cost Explorer in the console: https://console.aws.amazon.com/cost-management/

---

## End-to-End QA Checklist

Use this comprehensive checklist to verify all features before and after deployment.

### Pre-Deployment Checklist

- [ ] All environment variables configured in `.env`
- [ ] Database migrations applied in Supabase
- [ ] RLS policies enabled for all tables
- [ ] AWS credentials configured and tested
- [ ] S3 bucket created and CORS configured
- [ ] CloudFront distribution created
- [ ] SES email addresses verified
- [ ] SMS provider (SNS or MSG91) configured
- [ ] GitHub Actions secrets configured
- [ ] SSL certificate obtained (if using custom domain)

### Storefront & Product Catalog

#### Homepage
- [ ] Homepage loads without errors
- [ ] Products display with images
- [ ] Featured products/categories visible
- [ ] Navigation menu works correctly
- [ ] Footer links functional
- [ ] Mobile responsive design works

#### Product Listing (/shop)
- [ ] All saree products visible
- [ ] Product images load correctly (S3/Cloudinary/Supabase)
- [ ] Filtering by category works
- [ ] Sorting (price, name) works
- [ ] Pagination displays correctly
- [ ] Search functionality works
- [ ] "No results" message displays when appropriate

#### Product Detail Page (/products/[slug])
- [ ] Product images display in gallery
- [ ] Image zoom/lightbox works
- [ ] Product variants (size, color) selectable
- [ ] Variant stock levels display correctly
- [ ] Price updates when variant selected
- [ ] Currency switcher works (INR/USD/AED)
- [ ] Converted prices display correctly
- [ ] Additional price for variants shown
- [ ] Add to Cart button functional
- [ ] Add to Wishlist button works
- [ ] "Try with Camera" button appears
- [ ] Camera overlay loads and works
- [ ] Virtual try-on experience smooth
- [ ] Product description renders correctly
- [ ] Related products display

### Shopping Cart & Checkout

#### Cart (/cart)
- [ ] Cart items display correctly
- [ ] Quantities can be updated
- [ ] Remove item functionality works
- [ ] Cart total calculates correctly
- [ ] Variant details show in cart
- [ ] Currency conversion applies to cart total
- [ ] Empty cart message displays when cart is empty
- [ ] "Continue Shopping" link works
- [ ] Analytics event fires on add-to-cart

#### Coupon System
- [ ] Coupon input field appears
- [ ] Valid coupon applies discount
- [ ] Invalid coupon shows error message
- [ ] Expired coupon rejected
- [ ] Usage limit enforced
- [ ] Minimum order value enforced
- [ ] Discount reflects in total

#### Checkout (/checkout)
- [ ] Checkout page loads
- [ ] Shipping form validates required fields
- [ ] Email format validation works
- [ ] Phone number validation works
- [ ] Pincode validation works
- [ ] Order summary displays correctly
- [ ] Selected variants show correctly
- [ ] Payment method (Razorpay) initializes
- [ ] Test payment with Razorpay test cards works
- [ ] Payment success redirects correctly
- [ ] Payment failure shows error message
- [ ] Order created in database on success
- [ ] Order items recorded correctly
- [ ] Analytics event fires on checkout_started
- [ ] Analytics event fires on order_placed

### User Account & Authentication

#### Registration
- [ ] Email/password signup works
- [ ] Email validation enforced
- [ ] Password strength requirements enforced
- [ ] Duplicate email prevented
- [ ] User profile created automatically
- [ ] SMS OTP works (if enabled)
- [ ] Magic link works (if enabled)

#### Login (/auth/login)
- [ ] Email/password login works
- [ ] Invalid credentials show error
- [ ] "Forgot password" link works
- [ ] Password reset email sends
- [ ] Password reset link works
- [ ] User redirected after login
- [ ] Session persists across page reloads

#### Profile (/profile)
- [ ] User profile displays
- [ ] Name and email editable
- [ ] Phone number editable
- [ ] Profile updates save correctly
- [ ] Password change works
- [ ] Logout functionality works

#### Order History (/orders)
- [ ] Past orders display
- [ ] Order list sorted by date
- [ ] Order status displays correctly
- [ ] Order details link works
- [ ] Empty state shows for new users

#### Wishlist (/wishlist)
- [ ] Wishlist items display
- [ ] Remove from wishlist works
- [ ] Add to cart from wishlist works
- [ ] Empty wishlist message shows
- [ ] Wishlist persists after logout/login

### Admin Panel

#### Admin Access
- [ ] Admin login works
- [ ] Non-admin users redirected
- [ ] Admin dashboard loads
- [ ] Sidebar navigation works
- [ ] Dark charcoal sidebar with gold accents
- [ ] "Samara Admin" title in gold

#### Dashboard (/admin)
- [ ] KPI cards display
- [ ] Saree sales stats accurate
- [ ] Revenue charts render
- [ ] Last 30 days line chart works
- [ ] Category breakdown bar chart works
- [ ] Cart vs Order conversion % displays
- [ ] Analytics data updates

#### Products Management (/admin/products)
- [ ] Product list displays
- [ ] Search products works
- [ ] Filter by status works
- [ ] "Add Product" button works
- [ ] Variant count badges display

#### Product Create/Edit
- [ ] Create new product form works
- [ ] All fields validate correctly
- [ ] Category dropdown populated
- [ ] Brand dropdown works
- [ ] Image upload works (S3/Cloudinary/Supabase)
- [ ] Multiple images can be uploaded
- [ ] Primary image selection works
- [ ] Image deletion works
- [ ] Variant table displays
- [ ] Add variant form works
- [ ] Edit variant inline works
- [ ] Delete variant confirmation works
- [ ] Stock levels update correctly
- [ ] Additional price for variants works
- [ ] Save product creates/updates correctly
- [ ] Slug auto-generates or accepts manual entry
- [ ] Product status toggle works

#### Orders Management (/admin/orders)
- [ ] Orders list displays
- [ ] Search by order number works
- [ ] Search by customer email works
- [ ] Search by customer name works
- [ ] Pagination controls work
- [ ] 20 orders per page
- [ ] Status filter dropdown works
- [ ] Order date displays correctly
- [ ] View order detail link works

#### Order Detail (/admin/orders/[id])
- [ ] Order header displays order number
- [ ] Status badges show correct colors
- [ ] Payment status badge displays
- [ ] Created date formatted correctly
- [ ] Status update dropdown works
- [ ] Status change saves to database
- [ ] Customer info section displays
- [ ] Shipping address complete
- [ ] Payment details section shows
- [ ] Total amount correct
- [ ] Razorpay order ID displays (if available)
- [ ] Razorpay payment ID displays (if available)
- [ ] Order items table displays
- [ ] Product images show in items
- [ ] Variant details (size/color) display
- [ ] Variant additional price shown
- [ ] Item quantities correct
- [ ] Subtotals calculate correctly
- [ ] Grand total matches

#### Categories Management (/admin/categories)
- [ ] Category list displays
- [ ] Add category works
- [ ] Edit category works
- [ ] Delete category works
- [ ] Category image upload works

#### Coupons Management (/admin/coupons)
- [ ] Coupon list displays
- [ ] Create coupon form works
- [ ] Coupon code validates (unique)
- [ ] Discount type (percentage/fixed) works
- [ ] Expiry date picker works
- [ ] Usage limit enforced
- [ ] Minimum order value enforced
- [ ] Active/Inactive toggle works
- [ ] Delete coupon works

#### Currency Management (/admin/currency)
- [ ] Currency rates table displays
- [ ] USD rate input works
- [ ] AED rate input works
- [ ] Conversion preview displays
- [ ] Example conversions accurate
- [ ] Save rates updates database
- [ ] Last updated timestamp shows
- [ ] Quick reference calculations accurate

### Analytics & Tracking

#### Event Tracking
- [ ] Add to cart events recorded
- [ ] Checkout started events recorded
- [ ] Order placed events recorded
- [ ] User ID captured (if logged in)
- [ ] Session ID captured
- [ ] Event data complete (product_id, variant_id, etc.)
- [ ] Analytics dashboard reflects events
- [ ] Event timestamps accurate

#### Admin Analytics
- [ ] Saree sales count accurate
- [ ] Total revenue matches order totals
- [ ] Last 30 days chart displays data
- [ ] Cart-to-order conversion % calculates correctly
- [ ] Category breakdown accurate
- [ ] Date filters work correctly

### AWS Integrations

#### S3 Image Storage
- [ ] Product image upload via presigned URL works
- [ ] Image accessible via CloudFront URL
- [ ] Image displays on storefront
- [ ] Image displays in admin
- [ ] CORS configuration allows uploads
- [ ] Image deletion works (if implemented)

#### SES Email Service
- [ ] Order confirmation email sends
- [ ] Email contains correct order details
- [ ] Email HTML template renders correctly
- [ ] Email plain text fallback works
- [ ] Reply-to address correct
- [ ] From address not marked as spam
- [ ] SES sending limits not exceeded
- [ ] Bounce/complaint handling works

#### SNS/MSG91 SMS Service
- [ ] SMS OTP sends correctly
- [ ] OTP code received within 1 minute
- [ ] OTP code format correct
- [ ] Order status SMS sends (if enabled)
- [ ] SMS delivery rate acceptable
- [ ] SMS provider credentials valid
- [ ] Sender ID displays correctly

### Performance & Security

#### Performance
- [ ] Page load time < 3 seconds
- [ ] Images optimized and lazy-loaded
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] CloudFront cache hit rate > 80%
- [ ] No memory leaks on EC2
- [ ] PM2 processes stable

#### Security
- [ ] HTTPS enforced
- [ ] RLS policies prevent unauthorized access
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] API keys not exposed in client code
- [ ] Environment variables secure
- [ ] Admin panel requires authentication
- [ ] Password hashing secure (Supabase Auth)
- [ ] Session management secure

### Mobile Responsiveness

- [ ] Homepage mobile-friendly
- [ ] Product listing mobile-friendly
- [ ] Product detail mobile-friendly
- [ ] Cart mobile-friendly
- [ ] Checkout form mobile-friendly
- [ ] Admin panel usable on tablet
- [ ] Touch interactions work smoothly
- [ ] Mobile navigation menu works

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Post-Deployment Verification

- [ ] Production URL accessible
- [ ] SSL certificate valid
- [ ] DNS records correct
- [ ] CloudFront distribution active
- [ ] EC2 instance running
- [ ] PM2 processes active
- [ ] Nginx reverse proxy working
- [ ] Database connections stable
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

---

## Troubleshooting

### EC2 Deployment Issues

**App won't start:**
```bash
pm2 logs samara-app --lines 100
```

**Out of memory:**
```bash
pm2 restart samara-app --max-memory-restart 800M
```

### S3 Upload Issues

**CORS errors:**
- Check CORS configuration
- Verify CloudFront distribution settings

**403 Forbidden:**
- Check bucket policy
- Verify IAM permissions

### Email Issues

**SES in sandbox:**
- Request production access
- Verify recipient emails

**High bounce rate:**
- Check email format
- Verify DNS records

---

## Support

For issues:
1. Check CloudWatch logs
2. Review GitHub Actions logs
3. Verify environment variables
4. Check AWS service health dashboard

---

**Deployment Status:** Ready for Production
**Last Updated:** December 2024
**Version:** 1.0
