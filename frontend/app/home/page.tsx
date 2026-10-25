'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import FoodCard from '@/components/food-card';
import FoodModal from '@/components/food-modal';
import { apiRequest } from '@/lib/api';
import { Sparkles, ArrowRight, Award, ShieldCheck, Flame, Star, ChevronDown, UtensilsCrossed, Clock, Heart, Users } from 'lucide-react';

// ---------------------------------------------------------------------------
// Module-level cache — survives between client-side navigations (SPA transitions).
// Cleared automatically when the browser tab is closed or refreshed.
// ---------------------------------------------------------------------------
let homeCache: {
  featuredDishes: any[];
  categories: any[];
  offers: any[];
} | null = null;

export default function HomePage() {
  const [featuredDishes, setFeaturedDishes] = useState<any[]>(homeCache?.featuredDishes ?? []);
  const [categories, setCategories] = useState<any[]>(homeCache?.categories ?? []);
  const [offers, setOffers] = useState<any[]>(homeCache?.offers ?? []);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  // Only show loading skeleton if we have no cached data yet
  const [loading, setLoading] = useState(homeCache === null);

  useEffect(() => {
    // If cache already has data, skip the API calls entirely
    if (homeCache !== null) return;

    async function loadHomeData() {
      try {
        const [featuredRes, catRes, offersRes] = await Promise.all([
          apiRequest<any[]>('/menu/featured').catch(() => []),
          apiRequest<any[]>('/categories').catch(() => []),
          apiRequest<any[]>('/offers').catch(() => []),
        ]);

        // Populate module-level cache so future navigations are instant
        homeCache = {
          featuredDishes: featuredRes,
          categories: catRes,
          offers: offersRes,
        };

        setFeaturedDishes(featuredRes);
        setCategories(catRes);
        setOffers(offersRes);
      } catch (e) {
        console.error('Failed to load home data', e);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);


  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      {/* CINEMATIC FULL-SCREEN PANORAMIC HERO SECTION */}
      <section className="relative min-h-[92vh] lg:min-h-screen flex flex-col justify-between pt-32 pb-12 overflow-hidden">
        {/* Master Chef Full-Bleed Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/chef-cooking.jpg"
            alt="Master Chef Cooking at The Ember"
            fill
            priority
            quality={95}
            className="object-cover object-[center_right] sm:object-center"
            sizes="100vw"
          />
          {/* Subtle cinematic gradient overlays for perfect readability */}
          {/* Left-to-right dark gradient ensuring high contrast for hero text */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 via-50% to-transparent z-[1]" />
          {/* Top subtle vignette for navbar clarity */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent z-[1]" />
          {/* Bottom subtle blend into next section */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B09] via-transparent to-transparent z-[1]" />
        </div>

        {/* Main Content (Headline & CTAs) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 my-auto">
          <div className="max-w-2xl space-y-7 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1A1611]/85 border border-[#D9A441]/40 text-xs text-[#D9A441] backdrop-blur-md shadow-lg">
              <Flame className="w-3.5 h-3.5 text-[#FF9F43] animate-pulse" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Artisanal Charcoal Gastronomy
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif-luxury text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F6F1E8] leading-[1.05]">
              WHERE FIRE <br />
              <span className="gold-gradient-text">MEETS FLAVOUR</span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#D4CDC3] max-w-xl leading-relaxed font-light drop-shadow-sm">
              Crafted with passion. Perfected by fire. Experience the theatrical symphony of cast iron, fragrant charcoal embers, and master culinary artistry.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/menu"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn flex items-center justify-center space-x-2 shadow-[0_4px_25px_rgba(255,159,67,0.4)] hover:scale-105 transition-all"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Order Now</span>
              </Link>

              <Link
                href="/menu"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold text-[#F6F1E8] uppercase tracking-wider bg-[#14120E]/80 border border-[#2D261E] hover:border-[#D9A441] backdrop-blur-md transition-all flex items-center justify-center space-x-2"
              >
                <span>Explore Menu</span>
                <ArrowRight className="w-4 h-4 text-[#D9A441]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Stats on Left + Floating Chef Card on Right */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pt-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            {/* Stat Counters matching reference screenshot */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              {/* Stat 1: Signature Dishes */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full border border-[#D9A441]/40 bg-[#16120D]/60 backdrop-blur-md flex items-center justify-center text-[#D9A441]">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#F6F1E8] font-serif-luxury leading-tight">
                    4.8+
                  </div>
                  <div className="text-[10px] text-[#AAA39A] uppercase tracking-wider font-medium">
                    Signature Dishes
                  </div>
                </div>
              </div>

              {/* Stat 2: Happy Customers */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full border border-[#D9A441]/40 bg-[#16120D]/60 backdrop-blur-md flex items-center justify-center text-[#D9A441]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#F6F1E8] font-serif-luxury leading-tight">
                    10K+
                  </div>
                  <div className="text-[10px] text-[#AAA39A] uppercase tracking-wider font-medium">
                    Happy Customers
                  </div>
                </div>
              </div>

              {/* Stat 3: Average Rating */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full border border-[#D9A441]/40 bg-[#16120D]/60 backdrop-blur-md flex items-center justify-center text-[#D9A441]">
                  <Star className="w-4 h-4 fill-[#D9A441]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#FFB300] font-serif-luxury leading-tight">
                    4.8★
                  </div>
                  <div className="text-[10px] text-[#AAA39A] uppercase tracking-wider font-medium">
                    Average Rating
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Chef Card */}
            <div className="bg-[#14110C]/85 backdrop-blur-md border border-[#D9A441]/40 rounded-2xl p-3 sm:px-4 sm:py-3 shadow-2xl flex items-center space-x-3 max-w-xs self-start lg:self-auto">
              <div className="w-10 h-10 rounded-xl bg-[#221B12] border border-[#D9A441]/40 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-[#FF9F43] animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-[#D9A441] uppercase tracking-wider font-semibold block">
                  Artisanal Wok-Hei
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#F6F1E8] block">
                  Chef Arjun Mehta
                </span>
                <span className="text-[11px] text-[#AAA39A] block">
                  Hand-Forged Charcoal Hearth
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE DISHES SECTION */}
      <section id="featured-menu" className="py-20 bg-[#0C0B09] border-t border-[#1C1813] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#D9A441] uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Culinary Masterpieces</span>
              </div>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#F6F1E8]">
                Signature Dishes
              </h2>
            </div>
            <Link
              href="/menu"
              className="text-xs font-bold text-[#D9A441] hover:text-[#F6F1E8] flex items-center space-x-1.5 transition-colors"
            >
              <span>Explore Complete Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Food Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDishes.length > 0 ? (
              featuredDishes.map((dish) => (
                <FoodCard
                  key={dish.id}
                  dish={dish}
                  onOpenDetails={(d) => setSelectedDish(d)}
                />
              ))
            ) : (
              // Fallback cards while loading
              [1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-[#14120E] border border-[#221D16] animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES SECTION */}
      <section className="py-16 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#D9A441] uppercase tracking-widest block mb-2">
              Curated Offerings
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#F6F1E8]">
              Popular Categories
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'Starters', img: '/images/food/paneer-tikka.png', count: '12 items' },
              { name: 'Main Course', img: '/images/food/butter-chicken.png', count: '18 items' },
              { name: 'Biryani & Rice', img: '/images/food/chicken-biryani.png', count: '8 items' },
              { name: 'Desserts', img: '/images/food/chocolate-lava-cake.png', count: '6 items' },
              { name: 'Beverages', img: '/images/food/mojito.png', count: '10 items' },
            ].map((cat, i) => (
              <Link
                key={i}
                href="/menu"
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] border border-[#221D16] hover:border-[#D9A441]/40 transition-all shadow-lg flex flex-col justify-end p-4 bg-black"
              >
                <Image
                  src={cat.img}
                  alt={cat.name}
                  fill
                  className="object-cover opacity-65 group-hover:scale-110 group-hover:opacity-80 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="relative z-10 space-y-0.5">
                  <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8] group-hover:text-[#D9A441] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-[#AAA39A] block">{cat.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIAL OFFERS SECTION */}
      {offers.length > 0 && (
        <section className="py-20 bg-[#0C0B09] border-t border-[#1C1813]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-semibold text-[#FF9F43] uppercase tracking-widest block mb-2">
                  Limited Dining Privileges
                </span>
                <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#F6F1E8]">
                  Special Offers & Combos
                </h2>
              </div>
              <Link href="/offers" className="text-xs font-bold text-[#D9A441] hover:underline flex items-center space-x-1">
                <span>View All Offers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-[#12100C] border border-[#262018] hover:border-[#D9A441]/40 rounded-2xl overflow-hidden p-6 flex flex-col justify-between space-y-4 group transition-all hover:-translate-y-1"
                >
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FF9F43]/15 text-[#FF9F43] border border-[#FF9F43]/30">
                      {offer.code || 'SPECIAL'}
                    </span>
                    <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-[#AAA39A] leading-relaxed">
                      {offer.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#221D16] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D9A441]">Code: {offer.code}</span>
                    <Link
                      href="/menu"
                      className="px-4 py-2 rounded-lg text-xs font-bold text-black orange-gradient-btn"
                    >
                      Order Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY CHOOSE US (4 Luxury Pillars matching reference image) */}
      <section className="py-20 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Flame,
                title: 'Fresh Ingredients',
                desc: 'Locally farmed organic produce and sustainably sourced prime cuts roasted over aromatic wood.',
              },
              {
                icon: Award,
                title: 'Expert Chefs',
                desc: 'Led by Master Chef Arjun with over 18 years of Michelin-starred heritage culinary experience.',
              },
              {
                icon: Heart,
                title: 'Cozy Ambience',
                desc: 'Dark charcoal architecture with intimate candle-lit tables and soft jazz acoustics.',
              },
              {
                icon: ShieldCheck,
                title: 'Best Service',
                desc: 'Impeccable dining hospitality and vacuum-sealed thermal food delivery across the city.',
              },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={i}
                  className="bg-[#111111] border border-[#221D16] p-6 rounded-2xl space-y-3 hover:border-[#D9A441]/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/30 flex items-center justify-center text-[#D9A441]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#8E877E] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOD DETAILS MODAL */}
      {selectedDish && (
        <FoodModal
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
          similarDishes={featuredDishes.filter((d) => d.id !== selectedDish.id)}
          onSelectSimilar={(d) => setSelectedDish(d)}
        />
      )}

      <Footer />
    </div>
  );
}
