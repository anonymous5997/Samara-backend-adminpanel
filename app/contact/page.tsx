'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-6xl">
        
        {/* HEADER */}
        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-samara-ivory/10 -z-10" />
          <div className="inline-block bg-samara-void px-8">
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
              Inquiries
            </span>
            <h1 className="text-5xl md:text-6xl font-serif text-samara-ivory mb-2">
              Get in <em className="italic text-samara-gold">Touch</em>
            </h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* INFO SIDE */}
          <div>
            <h2 className="text-3xl font-serif text-samara-ivory mb-6">
              How can we assist you?
            </h2>
            <p className="text-sm font-sans tracking-wide leading-relaxed text-samara-ivory/60 mb-12 max-w-md">
              Have a question about our sarees, need styling advice, or want to learn more
              about our collections? Our team is here to help. We typically respond within
              24-48 hours.
            </p>

            <div className="space-y-10">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-samara-gold mb-1">
                  <Mail className="w-4 h-4 stroke-[1.5]" />
                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase">Email Us</span>
                </div>
                <a href="mailto:hello@samara.com" className="text-lg font-serif text-samara-ivory hover:text-samara-gold transition-colors">
                  hello@samara.com
                </a>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-samara-gold mb-1">
                  <Phone className="w-4 h-4 stroke-[1.5]" />
                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase">Call Us</span>
                </div>
                <p className="text-lg font-serif text-samara-ivory">
                  +91 98765 43210
                </p>
                <p className="text-[10px] font-sans tracking-widest text-samara-ivory/40 uppercase">
                  Mon - Sat, 10am - 6pm IST
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-samara-gold mb-1">
                  <MapPin className="w-4 h-4 stroke-[1.5]" />
                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase">Visit Us</span>
                </div>
                <p className="text-lg font-serif text-samara-ivory">
                  Samara Boutique
                </p>
                <p className="text-sm font-sans tracking-wide text-samara-ivory/60">
                  123 Heritage Lane, Silk City<br />
                  Mumbai - 400001, India
                </p>
              </div>
            </div>
          </div>

          {/* FORM SIDE */}
          <div className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12 relative">
            <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-samara-gold/30 -mt-px -mr-px hidden md:block" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b border-l border-samara-gold/30 -mb-px -ml-px hidden md:block" />

            <h3 className="text-2xl font-serif text-samara-gold mb-8">
              Send a Message
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">
                  Your Message
                </label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none text-sm font-sans transition-colors resize-none p-4"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-samara-gold hover:bg-samara-goldDeep text-samara-void rounded-none font-sans text-[11px] tracking-[0.2em] uppercase transition-colors mt-4"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
