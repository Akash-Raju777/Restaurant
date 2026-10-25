'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Flame, Award, Heart, ShieldCheck, ArrowRight, UtensilsCrossed } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {/* Main Story Hero Split-Screen matching reference image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#181511] border border-[#D9A441]/30 text-xs text-[#D9A441]">
                <Flame className="w-3.5 h-3.5 text-[#FF9F43]" />
                <span className="font-semibold uppercase tracking-wider">Heritage & Passion</span>
              </div>

              <h1 className="font-serif-luxury text-4xl sm:text-5xl font-bold text-[#F6F1E8] leading-tight">
                Our Story <br />
                <span className="gold-gradient-text text-3xl sm:text-4xl">A Journey of Flavors & Passion</span>
              </h1>

              <div className="space-y-4 text-sm text-[#AAA39A] leading-relaxed font-light">
                <p>
                  At The Ember, we believe that great food brings people together. Our journey started with a simple idea — to create an extraordinary dining experience that blends authentic heritage flavors, warm hospitality, and a cozy charcoal-lit ambience.
                </p>
                <p>
                  Every spice blend is roasted in-house in small batches. From our succulent char-grilled Paneer and Nizami Biryanis to our slow-simmered velvety Butter Chicken, our dishes are an ode to ancestral cooking techniques married to contemporary gastronomic precision.
                </p>
              </div>

              {/* Chef Signature Block matching reference image */}
              <div className="pt-4 border-t border-[#221D16] flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-[#D9A441]/50 bg-black">
                  <Image
                    src="/images/about/chef-arjun.png"
                    alt="Chef Arjun"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">Chef Arjun</h3>
                  <span className="text-xs text-[#D9A441]">Head Chef & Founder</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/menu"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Taste Our Creations</span>
                </Link>
              </div>
            </div>

            {/* Right: Chef Photo in Warm Candlelight matching reference image */}
            <div className="lg:col-span-6 relative">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-[#2D261E] shadow-2xl bg-black">
                <Image
                  src="/images/about/chef-arjun.png"
                  alt="Head Chef Arjun creating gourmet recipes at The Ember"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Floating Candlelight Quote matching reference image */}
                <div className="absolute bottom-6 right-6 max-w-xs bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-[#D9A441]/30 shadow-xl">
                  <p className="font-serif-luxury text-sm italic text-[#F3E7C4] leading-snug">
                    &ldquo;Good food is not just a meal, it&apos;s an emotion.&rdquo;
                  </p>
                  <span className="text-[10px] text-[#D9A441] uppercase tracking-widest font-semibold block mt-1.5">
                    — Master Chef Arjun
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Pillars Grid matching reference image */}
          <div className="pt-8 border-t border-[#1C1813] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Flame,
                title: 'Fresh Ingredients',
                desc: 'Hand-picked organic spices, farm-fresh milk cottage cheese, and slow-aged Basmati grains.',
              },
              {
                icon: Award,
                title: 'Expert Chefs',
                desc: 'Passionate culinary virtuosos dedicated to reviving century-old slow dum and clay oven cooking.',
              },
              {
                icon: Heart,
                title: 'Cozy Ambience',
                desc: 'Intimate dim warm lighting, glowing coal hearths, and an aroma that comforts the soul.',
              },
              {
                icon: ShieldCheck,
                title: 'Best Service',
                desc: 'Hospitality rooted in Indian traditions: Atithi Devo Bhava, where every guest is honored.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#111111] border border-[#221D16] hover:border-[#D9A441]/40 p-6 rounded-2xl space-y-3 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/30 flex items-center justify-center text-[#D9A441]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">{item.title}</h3>
                  <p className="text-xs text-[#8E877E] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
