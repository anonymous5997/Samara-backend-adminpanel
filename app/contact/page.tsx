'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';
import { PageHero } from '@/components/content/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { fieldClass, goldButtonClass, labelClass } from '@/components/content/formStyles';

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
    <div className="bg-samara-black text-samara-ivory">
      <PageHero
        eyebrow="Customer care"
        accent="Contact"
        intro="We'd love to hear from you"
      />

      <section className="bg-samara-forest">
        <div className="sm-container grid gap-14 py-16 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
          <Reveal className="lg:col-span-5">
            <h2 className="sm-display-m font-light">
              Get in <span className="sm-accent">Touch</span>
            </h2>
            <p className="sm-body mt-6 max-w-md">
              Have a question about our sarees, need styling advice, or want to learn more
              about our collections? Our team is here to help. We typically respond within
              24-48 hours.
            </p>

            <dl className="mt-12 border-t border-samara-line">
              <div className="flex items-start gap-5 border-b border-samara-line py-6">
                <Mail aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-samara-gold" strokeWidth={1.25} />
                <div>
                  <dt className="sm-eyebrow">Email</dt>
                  <dd className="mt-2 font-serif text-xl font-light text-samara-ivory">
                    hello@samara.com
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-5 border-b border-samara-line py-6">
                <Phone aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-samara-gold" strokeWidth={1.25} />
                <div>
                  <dt className="sm-eyebrow">Phone</dt>
                  <dd className="mt-2 font-serif text-xl font-light text-samara-ivory">
                    +91 98765 43210
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-5 border-b border-samara-line py-6">
                <MapPin aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-samara-gold" strokeWidth={1.25} />
                <div>
                  <dt className="sm-eyebrow">Location</dt>
                  <dd className="mt-2 font-serif text-xl font-light leading-snug text-samara-ivory">
                    Samara Boutique
                    <br />
                    Mumbai, India
                  </dd>
                </div>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={150} className="lg:col-span-6 lg:col-start-7">
            <div className="border border-samara-line bg-samara-black/40 px-5 py-10 sm:px-10 sm:py-12">
              <h3 className="sm-display-s font-light">
                Send us a <span className="sm-accent">Message</span>
              </h3>
              <form onSubmit={handleSubmit} className="mt-10 space-y-7">
                <div className="grid gap-7 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={fieldClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="message" className={labelClass}>
                    Message
                  </label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`${fieldClass} h-auto min-h-[9rem] resize-none py-3.5`}
                    required
                  />
                </div>

                <Button type="submit" className={goldButtonClass}>
                  Send Message
                </Button>

                <p className="text-center font-sans text-xs leading-relaxed text-samara-mute">
                  We typically respond within 24-48 hours during business days
                </p>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
