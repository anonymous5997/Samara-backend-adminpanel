# Functional Parity & Performance Baseline

## 1. Functional Parity Checklist
**Discovery & Navigation**
- [ ] Header links navigate to correct categories/pages.
- [ ] Mobile menu opens and closes correctly.
- [ ] Search overlay opens, typing yields suggestions, and clicking a suggestion navigates to PDP.
- [ ] Currency selector updates URL `?currency=XXX` and prices reflect this change.

**Product & Collections**
- [ ] Collections grid renders accurately.
- [ ] Filters (Category, Sort, Price Range) correctly update the product list without full page reload.
- [ ] Product cards display correct variant pricing, discount tags, and navigate to PDP on click.
- [ ] Wishlist toggle works on product cards (requires login).

**Product Detail Page (PDP)**
- [ ] Image gallery switches active image on click.
- [ ] Price updates if a different variant is selected (if applicable).
- [ ] 'Buy Now' directly opens checkout or cart depending on flow.
- [ ] 'Add to Bag' updates the cart count in the header.
- [ ] Reviews section displays correctly.

**Cart & Checkout**
- [ ] Cart page/drawer accurately lists added items, quantities, and prices.
- [ ] Quantity adjustments (increment/decrement) work and update subtotal.
- [ ] Item removal works.
- [ ] Checkout flow correctly captures address details.
- [ ] Payment gateway (Razorpay Test Mode) initializes correctly.

**Authentication & User Account**
- [ ] Login (Email/OAuth) successful.
- [ ] Profile page displays user details.
- [ ] Orders page lists previous orders.

**Admin Panel Integrity**
- [ ] `/admin` routes load correctly without being affected by storefront CSS changes.
- [ ] Admin typography, spacing, and layout remain identical to pre-redesign.

## 2. Performance Baseline (Lighthouse Mobile)
*(Estimated/Simulated for local dev environment)*
- **Homepage (`/`)**: LCP ~2.5s, CLS 0.05, INP 100ms
- **Shop (`/shop`)**: LCP ~2.8s, CLS 0.08, INP 120ms
- **PDP (`/products/[slug]`)**: LCP ~2.4s, CLS 0.02, INP 90ms

**Goal for Redesign**: Ensure heavy imagery and new typography do not degrade LCP below 2.5s and keep CLS near zero.
