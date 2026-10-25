'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1F1B15] text-[#AAA39A] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#1A1713]">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D9A441]/10 border border-[#D9A441]/40 flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#FF9F43]" />
              </div>
              <span className="font-serif-luxury text-xl font-bold tracking-widest text-[#F6F1E8]">
                The Ember
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#8E877E]">
              A culinary sanctuary where heritage Indian charcoal craftsmanship meets contemporary gastronomic mastery. Good food, better moments.
            </p>
            <div className="flex items-center space-x-3 text-[#AAA39A]">
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-[#16130F] border border-[#262018] flex items-center justify-center hover:text-[#D9A441] hover:border-[#D9A441] transition-all">
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-[#16130F] border border-[#262018] flex items-center justify-center hover:text-[#D9A441] hover:border-[#D9A441] transition-all">
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Twitter / X" className="w-8 h-8 rounded-full bg-[#16130F] border border-[#262018] flex items-center justify-center hover:text-[#D9A441] hover:border-[#D9A441] transition-all">
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif-luxury text-sm font-bold text-[#F6F1E8] tracking-wider uppercase mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/home" className="hover:text-[#D9A441] transition-colors">Home Experience</Link></li>
              <li><Link href="/menu" className="hover:text-[#D9A441] transition-colors">Artisanal Menu</Link></li>
              <li><Link href="/about" className="hover:text-[#D9A441] transition-colors">Our Culinary Story</Link></li>
              <li><Link href="/offers" className="hover:text-[#D9A441] transition-colors">Special Offers & Combos</Link></li>
              <li><Link href="/gallery" className="hover:text-[#D9A441] transition-colors">Atmosphere Gallery</Link></li>
              <li><Link href="/orders" className="hover:text-[#D9A441] transition-colors">Track My Orders</Link></li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="font-serif-luxury text-sm font-bold text-[#F6F1E8] tracking-wider uppercase mb-4">
              Service Hours
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-[#D9A441] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#F6F1E8] font-medium block">Lunch Dining</span>
                  <span className="text-[11px] text-[#888]">12:00 PM – 3:30 PM (Daily)</span>
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-[#FF9F43] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#F6F1E8] font-medium block">Dinner & Embers</span>
                  <span className="text-[11px] text-[#888]">7:00 PM – 11:30 PM (Daily)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif-luxury text-sm font-bold text-[#F6F1E8] tracking-wider uppercase mb-4">
              Location & Enquiries
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#D9A441] flex-shrink-0 mt-0.5" />
                <span>402, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-[#D9A441] flex-shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#D9A441] flex-shrink-0" />
                <span>concierge@theember.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#777] gap-3">
          <p>© 2026 The Ember Restaurant & Hospitality Group. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-[#AAA39A] cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-[#AAA39A] cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-[#AAA39A] cursor-pointer">Refund & Cancellation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
