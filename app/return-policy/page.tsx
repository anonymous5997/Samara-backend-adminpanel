import { Metadata } from 'next';
import { Package, Camera, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Return Policy | Samara',
  description: 'Learn about our return policy for handcrafted Sambalpuri sarees. 14-day return window with proof requirements.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-4xl">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Customer Care
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-6">
            Return <em className="italic text-samara-gold">Policy</em>
          </h1>
          <p className="text-sm font-sans tracking-wide text-samara-ivory/60">
            Please read our return policy carefully before placing your order
          </p>
        </div>

        {/* INTRO */}
        <div className="bg-samara-void1 border border-samara-gold/20 p-8 md:p-10 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-samara-gold/5 blur-[40px] rounded-full" />
          <div className="flex items-start md:items-center gap-4 relative z-10">
            <AlertCircle className="h-6 w-6 text-samara-gold shrink-0 mt-1 md:mt-0" />
            <div>
              <h2 className="font-serif text-xl text-samara-gold mb-2">Important Notice</h2>
              <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80">
                At Samara, we take pride in our handcrafted products. To ensure a fair return process
                for both our customers and artisans, we have established the following policy.
              </p>
            </div>
          </div>
        </div>

        {/* RULES GRID */}
        <div className="space-y-6 mb-16">
          <div className="group border border-samara-ivory/10 hover:border-samara-gold/30 bg-samara-void1 p-8 transition-colors">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-12 h-12 shrink-0 border border-samara-gold/30 flex items-center justify-center text-samara-gold group-hover:bg-samara-gold/5 transition-colors">
                <Clock className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-samara-ivory group-hover:text-samara-gold transition-colors mb-3">
                  14 Days Return Window
                </h3>
                <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/60">
                  Returns must be initiated within 14 days from the date of delivery. After this period,
                  we cannot accept any return requests.
                </p>
              </div>
            </div>
          </div>

          <div className="group border border-samara-ivory/10 hover:border-samara-gold/30 bg-samara-void1 p-8 transition-colors">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-12 h-12 shrink-0 border border-samara-gold/30 flex items-center justify-center text-samara-gold group-hover:bg-samara-gold/5 transition-colors">
                <AlertCircle className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-samara-ivory group-hover:text-samara-gold transition-colors mb-3">
                  Eligible Products Only
                </h3>
                <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/60">
                  Only defective or damaged products are eligible for return. Products must be unused,
                  unworn, and in their original packaging with all tags attached.
                </p>
              </div>
            </div>
          </div>

          <div className="group border border-red-500/20 hover:border-red-500/40 bg-[#150a0a] p-8 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[40px] rounded-full" />
            <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
              <div className="w-12 h-12 shrink-0 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-500/5 transition-colors">
                <Camera className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-red-400 mb-4">
                  Unboxing Video & Photos MANDATORY
                </h3>
                <div className="space-y-4">
                  <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/80">
                    To claim a defect or damage, you <span className="font-bold text-red-400">MUST</span> provide:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex gap-3 text-sm font-sans text-samara-ivory/60">
                      <span className="text-red-400 mt-1">•</span> Complete unboxing video showing the package opening process
                    </li>
                    <li className="flex gap-3 text-sm font-sans text-samara-ivory/60">
                      <span className="text-red-400 mt-1">•</span> Clear photos of the defect or damage from multiple angles
                    </li>
                    <li className="flex gap-3 text-sm font-sans text-samara-ivory/60">
                      <span className="text-red-400 mt-1">•</span> Photos of the product packaging and shipping label
                    </li>
                  </ul>
                  <p className="text-[10px] font-sans tracking-widest uppercase text-red-400/80 mt-4 pt-4 border-t border-red-500/20">
                    ⚠ Returns without proper unboxing proof will NOT be accepted
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group border border-samara-ivory/10 hover:border-samara-gold/30 bg-samara-void1 p-8 transition-colors">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-12 h-12 shrink-0 border border-samara-gold/30 flex items-center justify-center text-samara-gold group-hover:bg-samara-gold/5 transition-colors">
                <Package className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-samara-ivory group-hover:text-samara-gold transition-colors mb-3">
                  Original Packaging Required
                </h3>
                <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/60">
                  Products must be returned in their original packaging. This includes the product box,
                  protective wrapping, tags, and any accessories that came with the product.
                </p>
              </div>
            </div>
          </div>

          <div className="group border border-samara-ivory/10 hover:border-samara-gold/30 bg-samara-void1 p-8 transition-colors">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-12 h-12 shrink-0 border border-samara-gold/30 flex items-center justify-center text-samara-gold group-hover:bg-samara-gold/5 transition-colors">
                <CheckCircle2 className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-samara-ivory group-hover:text-samara-gold transition-colors mb-3">
                  Refund Processing
                </h3>
                <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/60">
                  Once your return is received and inspected, we will send you an email notification.
                  If approved, refunds will be processed to your original payment method within 7-10
                  business days after quality check completion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STEPS */}
        <div className="border border-samara-gold/20 p-8 md:p-12 mb-16 relative">
          <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-samara-gold/40 -mt-px -mr-px" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-samara-gold/40 -mb-px -ml-px" />
          
          <h2 className="font-serif text-2xl text-samara-gold mb-8 text-center">
            How to Initiate a Return
          </h2>
          
          <div className="grid md:grid-cols-2 gap-y-6 gap-x-12">
            {[
              "Contact our customer support within 14 days of delivery",
              "Provide your order number and reason for return",
              "Submit unboxing video and clear photos of the defect/damage",
              "Wait for return authorization and instructions",
              "Ship the product back in original packaging",
              "Receive refund after quality check approval"
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <span className="text-samara-gold font-serif text-xl italic leading-none mt-0.5">
                  0{idx + 1}.
                </span>
                <span className="text-sm font-sans tracking-wide text-samara-ivory/80 leading-relaxed">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER CTA */}
        <div className="text-center py-12 border-y border-samara-ivory/10">
          <h3 className="font-serif text-2xl text-samara-ivory mb-4">
            Questions About Our Policy?
          </h3>
          <p className="text-sm font-sans tracking-wide text-samara-ivory/60 mb-8 max-w-md mx-auto">
            If you have any questions or need clarification, please contact our customer support team.
          </p>
          <Link
            href="/contact"
            className="inline-block px-10 py-4 border border-samara-gold text-samara-gold hover:bg-samara-gold hover:text-samara-void text-[10px] font-sans tracking-[0.2em] uppercase transition-all duration-300"
          >
            Contact Support
          </Link>
        </div>

      </div>
    </div>
  );
}
