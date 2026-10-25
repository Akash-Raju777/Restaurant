'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { apiRequest } from '@/lib/api';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiRequest<{ message: string }>('/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSuccessMsg(res.message || 'Thank you! Your message has been received.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-[#D9A441] uppercase tracking-widest block">
              Guest Relations & Concierge
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl font-bold text-[#F6F1E8]">
              Contact Us
            </h1>
            <p className="text-sm text-[#AAA39A] font-light">
              We welcome private dining inquiries, catering requests, and feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Contact Info & Opening Hours */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#111111] border border-[#221D16] p-6 sm:p-8 rounded-3xl space-y-6">
                <h2 className="font-serif-luxury text-xl font-bold text-[#F6F1E8] pb-3 border-b border-[#201B14]">
                  The Ember Dining Sanctuary
                </h2>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-[#1A1813] text-[#D9A441] border border-[#262018]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-semibold text-[#F6F1E8] block">Location</strong>
                      <span className="text-[#888] leading-relaxed">
                        402, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-[#1A1813] text-[#FF9F43] border border-[#262018]">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-semibold text-[#F6F1E8] block">Direct Reservations & Hotline</strong>
                      <span className="text-[#888]">+91 98765 43210</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-[#1A1813] text-[#D9A441] border border-[#262018]">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-semibold text-[#F6F1E8] block">Electronic Inquiries</strong>
                      <span className="text-[#888]">concierge@theember.com</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-[#1A1813] text-[#D9A441] border border-[#262018]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-semibold text-[#F6F1E8] block">Operating Hours</strong>
                      <span className="text-[#888]">Lunch: 12:00 PM – 3:30 PM | Dinner: 7:00 PM – 11:30 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Message Form */}
            <div className="lg:col-span-7">
              <div className="bg-[#111111] border border-[#221D16] p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-[#201B14]">
                  <MessageSquare className="w-5 h-5 text-[#FF9F43]" />
                  <h2 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">
                    Send Us a Message
                  </h2>
                </div>

                {successMsg && (
                  <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-300 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#888] uppercase">Your Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rohan Sharma"
                        className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#888] uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="guest@example.com"
                        className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#888] uppercase">Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Private Catering / Chef Collaboration"
                      className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#888] uppercase">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your thoughts, special requests or private dining inquiries..."
                      className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs text-black uppercase tracking-wider orange-gradient-btn flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
