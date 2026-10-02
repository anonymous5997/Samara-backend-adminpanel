import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { LegalLayout } from '@/components/content/LegalLayout';

export const metadata: Metadata = {
  title: 'Return Policy | Samara',
  description: 'Learn about our return policy for handcrafted Sambalpuri sarees. 14-day return window with proof requirements.',
};

const RETURN_STEPS = [
  'Contact our customer support within 14 days of delivery',
  'Provide your order number and reason for return',
  'Submit unboxing video and clear photos of the defect/damage',
  'Wait for return authorization and instructions',
  'Ship the product back in original packaging',
  'Receive refund after quality check approval',
];

export default function ReturnPolicyPage() {
  return (
    <LegalLayout
      eyebrow="Customer care"
      title="Return"
      accent="Policy"
      intro="Please read our return policy carefully before placing your order"
      sections={[
        {
          id: 'important-notice',
          title: 'Important Notice',
          body: (
            <p className="font-serif text-xl font-light leading-relaxed text-samara-cream-ink sm:text-[1.375rem]">
              At Samara, we take pride in our handcrafted products. To ensure a fair return process
              for both our customers and artisans, we have established the following policy.
            </p>
          ),
        },
        {
          id: 'return-window',
          title: '14 Days Return Window',
          body: (
            <p>
              Returns must be initiated within 14 days from the date of delivery. After this period,
              we cannot accept any return requests.
            </p>
          ),
        },
        {
          id: 'eligible-products',
          title: 'Eligible Products Only',
          body: (
            <p>
              Only defective or damaged products are eligible for return. Products must be unused,
              unworn, and in their original packaging with all tags attached.
            </p>
          ),
        },
        {
          id: 'unboxing-proof',
          title: 'Unboxing Video & Photos MANDATORY',
          tone: 'warning',
          body: (
            <>
              <p>
                To claim a defect or damage, you{' '}
                <span className="font-semibold text-[#9E3F2A]">MUST</span> provide:
              </p>
              <ul className="space-y-2 border-l border-samara-cream-2 pl-5">
                <li className="relative before:absolute before:-left-5 before:top-[0.85em] before:h-px before:w-3 before:bg-samara-gold-deep">
                  Complete unboxing video showing the package opening process
                </li>
                <li className="relative before:absolute before:-left-5 before:top-[0.85em] before:h-px before:w-3 before:bg-samara-gold-deep">
                  Clear photos of the defect or damage from multiple angles
                </li>
                <li className="relative before:absolute before:-left-5 before:top-[0.85em] before:h-px before:w-3 before:bg-samara-gold-deep">
                  Photos of the product packaging and shipping label
                </li>
              </ul>
              <p className="flex items-start gap-3 border border-[#9E3F2A]/30 px-4 py-3.5 font-semibold text-[#9E3F2A]">
                <AlertCircle aria-hidden className="mt-[0.2em] h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                Returns without proper unboxing proof will NOT be accepted
              </p>
            </>
          ),
        },
        {
          id: 'original-packaging',
          title: 'Original Packaging Required',
          body: (
            <p>
              Products must be returned in their original packaging. This includes the product box,
              protective wrapping, tags, and any accessories that came with the product.
            </p>
          ),
        },
        {
          id: 'refund-processing',
          title: 'Refund Processing',
          body: (
            <p>
              Once your return is received and inspected, we will send you an email notification.
              If approved, refunds will be processed to your original payment method within 7-10
              business days after quality check completion.
            </p>
          ),
        },
        {
          id: 'how-to-return',
          title: 'How to Initiate a Return',
          body: (
            <ol className="!mt-2">
              {RETURN_STEPS.map((step, i) => (
                <li
                  key={step}
                  className="flex items-baseline gap-5 border-b border-samara-cream-2 py-3.5 last:border-b-0"
                >
                  <span className="w-6 flex-shrink-0 font-serif text-lg italic text-samara-gold-deep">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ),
        },
      ]}
      footer={
        <div className="mt-14 bg-samara-forest px-6 py-10 text-samara-ivory sm:px-10 sm:py-12">
          <h3 className="font-serif text-[1.75rem] font-light leading-tight">
            Questions About Our <span className="sm-accent">Return Policy?</span>
          </h3>
          <p className="sm-body mt-4 max-w-md">
            If you have any questions or need clarification, please contact our customer support team.
          </p>
          <Link
            href="/contact"
            className="sm-btn mt-8 bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
          >
            Contact Support
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} />
          </Link>
        </div>
      }
    />
  );
}
