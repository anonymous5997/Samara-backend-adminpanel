import { Metadata } from 'next';
import { Package, Camera, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Return Policy | Samara',
  description: 'Learn about our return policy for handcrafted Sambalpuri sarees. 14-day return window with proof requirements.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4">
            Return Policy
          </h1>
          <p className="text-gray-400 text-lg">
            Please read our return policy carefully before placing your order
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/20 rounded-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-6 w-6 text-[#D4AF37]" />
            <h2 className="font-serif text-2xl font-semibold text-[#D4AF37]">
              Important Notice
            </h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            At Samara, we take pride in our handcrafted products. To ensure a fair return process
            for both our customers and artisans, we have established the following policy.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl font-semibold text-[#D4AF37] mb-2">
                  14 Days Return Window
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Returns must be initiated within 14 days from the date of delivery. After this period,
                  we cannot accept any return requests.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl font-semibold text-[#D4AF37] mb-2">
                  Eligible Products Only
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Only defective or damaged products are eligible for return. Products must be unused,
                  unworn, and in their original packaging with all tags attached.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-red-500/20 rounded-lg p-6 hover:border-red-500/40 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/10 p-3 rounded-lg">
                <Camera className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl font-semibold text-red-500 mb-3">
                  Unboxing Video & Photos MANDATORY
                </h3>
                <div className="space-y-2 text-gray-300">
                  <p className="leading-relaxed">
                    To claim a defect or damage, you <span className="font-bold text-red-500">MUST</span> provide:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Complete unboxing video showing the package opening process</li>
                    <li>Clear photos of the defect or damage from multiple angles</li>
                    <li>Photos of the product packaging and shipping label</li>
                  </ul>
                  <p className="font-bold text-red-500 mt-3">
                    ⚠ Returns without proper unboxing proof will NOT be accepted
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-lg">
                <Package className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl font-semibold text-[#D4AF37] mb-2">
                  Original Packaging Required
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Products must be returned in their original packaging. This includes the product box,
                  protective wrapping, tags, and any accessories that came with the product.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-[#D4AF37]/10 p-3 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl font-semibold text-[#D4AF37] mb-2">
                  Refund Processing
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Once your return is received and inspected, we will send you an email notification.
                  If approved, refunds will be processed to your original payment method within 7-10
                  business days after quality check completion.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 rounded-lg p-8 mt-10">
          <h2 className="font-serif text-2xl font-semibold text-[#D4AF37] mb-4">
            How to Initiate a Return
          </h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#D4AF37] mt-1">1.</span>
              <span>Contact our customer support within 14 days of delivery</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#D4AF37] mt-1">2.</span>
              <span>Provide your order number and reason for return</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#D4AF37] mt-1">3.</span>
              <span>Submit unboxing video and clear photos of the defect/damage</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#D4AF37] mt-1">4.</span>
              <span>Wait for return authorization and instructions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#D4AF37] mt-1">5.</span>
              <span>Ship the product back in original packaging</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-bold text-[#D4AF37] mt-1">6.</span>
              <span>Receive refund after quality check approval</span>
            </li>
          </ol>
        </div>

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#D4AF37]/20 rounded-lg p-8 mt-8 text-center">
          <h3 className="font-serif text-xl font-semibold text-[#D4AF37] mb-3">
            Questions About Our Return Policy?
          </h3>
          <p className="text-gray-300 mb-6">
            If you have any questions or need clarification, please contact our customer support team.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg hover:shadow-[#D4AF37]/50 text-black font-bold rounded-lg transition-all duration-300 hover:scale-105"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
