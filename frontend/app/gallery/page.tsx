'use client';

import React from 'react';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Camera, Sparkles } from 'lucide-react';

export default function GalleryPage() {
  const photos = [
    { src: '/images/gallery/gallery-1.png', title: 'Clay Tandoor Roasting', cat: 'Kitchen Craft' },
    { src: '/images/about/restaurant-ambience.png', title: 'Main Dining Hearth', cat: 'Ambience' },
    { src: '/images/gallery/gallery-2.png', title: 'Intimate Candlelight Setting', cat: 'Interior' },
    { src: '/images/food/butter-chicken.png', title: 'Royal Butter Chicken', cat: 'Signature Dish' },
    { src: '/images/gallery/gallery-3.png', title: 'Artisanal Plating', cat: 'Chef Showcase' },
    { src: '/images/food/chocolate-lava-cake.png', title: 'Molten Belgian Lava Cake', cat: 'Desserts' },
    { src: '/images/gallery/gallery-4.png', title: 'Craft Cocktails & Mocktails', cat: 'Beverages' },
    { src: '/images/food/paneer-tikka.png', title: 'Charcoal Paneer Tikka', cat: 'Starters' },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header matching reference image */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#D9A441] uppercase tracking-widest">
              <Camera className="w-3.5 h-3.5" />
              <span>Visual Journey</span>
            </div>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl font-bold text-[#F6F1E8]">
              Atmosphere & Craft
            </h1>
            <p className="text-sm text-[#AAA39A] font-light">
              A glimpse of our kitchen, dishes and warm charcoal ambience.
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {photos.map((item, idx) => (
              <div
                key={idx}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-black border border-[#221D16] hover:border-[#D9A441]/50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9A441]">
                    {item.cat}
                  </span>
                  <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
