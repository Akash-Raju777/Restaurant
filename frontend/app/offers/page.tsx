'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { apiRequest } from '@/lib/api';
import { Tag, Sparkles, Clock, Check, ArrowRight, Utensils } from 'lucide-react';

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      try {
        const data = await apiRequest<any[]>('/offers');
        setOffers(data || []);
      } catch (e) {
        console.error('Failed to load offers', e);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header matching reference image */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#FF9F43] uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gourmet Savings</span>
            </div>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl font-bold text-[#F6F1E8]">
              Special Offers & Combos
            </h1>
            <p className="text-sm text-[#AAA39A] font-light">
              Great food. Better moments. Exceptional value.
            </p>
          </div>

          {/* Offers Grid matching reference image cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-[#111111] border border-[#221D16] animate-pulse" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-20 bg-[#111111] border border-[#221D16] rounded-3xl space-y-3">
              <Tag className="w-10 h-10 text-[#D9A441] mx-auto" />
              <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">No Active Offers</h3>
              <p className="text-xs text-[#AAA39A]">Check back soon for upcoming culinary festivals and holiday combos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-[#111111] border border-[#221D16] hover:border-[#D9A441]/40 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1.5 group"
                >
                  {/* Banner Image */}
                  <div className="relative w-full h-48 bg-black overflow-hidden">
                    <Image
                      src={offer.bannerImageUrl || '/images/offers/weekend-special.png'}
                      alt={offer.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/30" />

                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#FF9F43]">
                      {offer.discountType === 'PERCENTAGE'
                        ? `${offer.discountValue}% OFF`
                        : `Save ₹${offer.discountValue}`}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-serif-luxury text-2xl font-bold text-[#F6F1E8] group-hover:text-[#D9A441] transition-colors">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-[#AAA39A] leading-relaxed">
                        {offer.description}
                      </p>

                      {offer.comboItems && (
                        <div className="pt-2 text-xs text-[#D9A441] bg-[#16130F] p-2.5 rounded-xl border border-[#221D16]">
                          <strong className="block text-[11px] text-[#F6F1E8] mb-0.5">Includes:</strong>
                          {offer.comboItems}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#1F1B15]">
                      {/* Coupon Copy Box */}
                      {offer.code && (
                        <div className="flex items-center justify-between bg-[#181511] border border-dashed border-[#D9A441]/40 rounded-xl px-3.5 py-2">
                          <div>
                            <span className="text-[10px] text-[#888] uppercase block">Coupon Code</span>
                            <span className="font-mono text-xs font-bold text-[#F6F1E8] tracking-wider">
                              {offer.code}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(offer.code)}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#D9A441]/10 text-[#D9A441] hover:bg-[#D9A441]/20 transition-colors"
                          >
                            {copiedCode === offer.code ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                      )}

                      {/* Order Now CTA */}
                      <Link
                        href="/menu"
                        className="w-full py-3 rounded-xl text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn flex items-center justify-center space-x-2"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Order This Deal</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
