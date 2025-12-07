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
    <div className="bg-black text-white min-h-screen">
      <section className="py-24 bg-gradient-to-b from-black to-luxury-charcoal">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-gold tracking-tighter">
                Contact
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                We'd love to hear from you
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-gold tracking-luxury mb-6">
                    Get in Touch
                  </h2>
                  <p className="text-gray-400 leading-relaxed mb-8">
                    Have a question about our sarees, need styling advice, or want to learn more
                    about our collections? Our team is here to help. We typically respond within
                    24-48 hours.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gold mb-1">Email</h3>
                      <p className="text-gray-400">hello@samara.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gold mb-1">Phone</h3>
                      <p className="text-gray-400">+91 98765 43210</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gold mb-1">Location</h3>
                      <p className="text-gray-400">
                        Samara Boutique
                        <br />
                        Mumbai, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-luxury-charcoal rounded-lg p-8 border border-gold/20">
                <h3 className="font-serif text-2xl font-bold text-gold tracking-luxury mb-6">
                  Send us a Message
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                      Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-black border-gold/20 text-white focus:border-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-black border-gold/20 text-white focus:border-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-black border-gold/20 text-white focus:border-gold"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-black border-gold/20 text-white focus:border-gold resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gold-gradient hover:shadow-xl hover:shadow-gold/40 text-black font-semibold py-6"
                  >
                    Send Message
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    We typically respond within 24-48 hours during business days
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
