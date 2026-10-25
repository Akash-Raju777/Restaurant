'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { getSession, clearSession, UserSession } from '@/lib/api';
import { Flame, ShoppingBag, User, LogOut, Menu as MenuIcon, X, UtensilsCrossed, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount, setIsDrawerOpen, clearCart } = useCart();
  const [session, setSessionState] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sync session state on mount and whenever auth state changes
  useEffect(() => {
    const syncSession = () => setSessionState(getSession());
    syncSession();
    window.addEventListener('ember_auth_change', syncSession);
    return () => window.removeEventListener('ember_auth_change', syncSession);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Scroll listener: attach once. The scrolled state naturally resets to false
  // on new page loads because window.scrollY starts at 0.
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    // Set initial value immediately in case page is already scrolled
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    clearCart();
    clearSession();
    setSessionState(null);
    router.push('/');
  };

  const navLinks = [
    { label: 'Home', href: '/home' },
    { label: 'Menu', href: '/menu' },
    { label: 'My Orders', href: '/orders' },
    { label: 'About', href: '/about' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Offers', href: '/offers' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#080808]/95 backdrop-blur-md border-b border-[#26221C] py-3.5 shadow-2xl'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/home" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#D9A441]/20 to-[#FF9F43]/30 border border-[#D9A441]/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-[#FF9F43] drop-shadow-[0_0_8px_rgba(255,159,67,0.8)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif-luxury text-xl font-bold tracking-widest text-[#F6F1E8] group-hover:text-[#D9A441] transition-colors">
              The Ember
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#AAA39A]">Fine Gastronomy</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide font-medium transition-colors relative py-1 ${
                  isActive ? 'text-[#D9A441]' : 'text-[#AAA39A] hover:text-[#F6F1E8]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D9A441] to-transparent rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          {/* Cart Icon */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Cart"
            className="relative w-8 h-8 flex items-center justify-center text-[#F6F1E8] hover:text-[#D9A441] bg-[#181511]/80 border border-[#26221C] hover:border-[#D9A441]/40 rounded-full transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF9F43] text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {totalCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth State */}
          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-xs font-medium text-[#F6F1E8] bg-[#181511] border border-[#26221C] hover:border-[#D9A441]/50 px-3.5 py-1.5 rounded-full hover:bg-[#1E1913] transition-all cursor-pointer shadow-md"
                aria-expanded={userMenuOpen}
              >
                <User className="w-3.5 h-3.5 text-[#D9A441]" />
                <span className="max-w-[100px] truncate font-semibold">
                  {session.fullName?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#888] transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180 text-[#D9A441]' : ''
                  }`}
                />
              </button>

              {/* User Dropdown with Logout and Quick Links */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#12100D] border border-[#2B241A] rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(217,164,65,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[#221D16] mb-1">
                    <p className="text-xs font-bold text-[#F6F1E8] truncate">
                      {session.fullName}
                    </p>
                    <p className="text-[10px] text-[#AAA39A] truncate">
                      {session.email}
                    </p>
                    {session.role === 'ROLE_ADMIN' && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#FF9F43]/15 text-[#FF9F43] border border-[#FF9F43]/30">
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 text-xs text-[#AAA39A] hover:text-[#F6F1E8] hover:bg-[#1A1612] rounded-xl transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#D9A441]" />
                      <span>My Orders</span>
                    </Link>

                    {session.role === 'ROLE_ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-3 py-2 text-xs text-[#AAA39A] hover:text-[#F6F1E8] hover:bg-[#1A1612] rounded-xl transition-colors"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF9F43]" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors text-left font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/"
              className="hidden sm:flex items-center space-x-1.5 text-xs text-[#AAA39A] hover:text-[#D9A441] transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Primary CTA Order Now */}
          <Link
            href="/menu"
            className="hidden sm:inline-flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Order Now</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#AAA39A] hover:text-[#F6F1E8]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111111] border-b border-[#26221C] px-4 pt-4 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg text-sm font-medium ${
                  pathname === link.href ? 'bg-[#1D1914] text-[#D9A441]' : 'text-[#AAA39A] hover:text-[#F6F1E8]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#26221C] flex items-center justify-between">
            {session ? (
              <div className="flex items-center justify-between w-full">
                <Link
                  href={session.role === 'ROLE_ADMIN' ? '/admin' : '/orders'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#D9A441] flex items-center space-x-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>{session.fullName} ({session.role === 'ROLE_ADMIN' ? 'Admin' : 'My Orders'})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg text-xs font-bold text-black orange-gradient-btn"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
