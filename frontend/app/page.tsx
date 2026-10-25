'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { setSession } from '@/lib/api';
import { Flame, Eye, EyeOff, Lock, Mail, User as UserIcon, Phone, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [isRegistering, setIsRegistering] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick role selection helper
  const fillCustomerDemo = () => {
    setActiveTab('customer');
    setIsRegistering(false);
    setEmail('customer@theember.com');
    setPassword('');
    setErrorMsg('');
  };

  const fillAdminDemo = () => {
    setActiveTab('admin');
    setIsRegistering(false);
    setEmail('admin@theember.com');
    setPassword('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

    try {
      if (isRegistering) {
        // Customer Registration
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password, phoneNumber }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        setSession(data);
        router.push('/home');
      } else {
        // Login
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid credentials');

        // Verify role segregation: Admin tab requires ROLE_ADMIN
        if (activeTab === 'admin' && data.role !== 'ROLE_ADMIN') {
          throw new Error('Access denied. Administrator privileges required for Admin Portal.');
        }

        setSession(data);

        if (data.role === 'ROLE_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/home');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#080808]">
      {/* Left Column: Cinematic Visual Showcase */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-3/5 bg-black overflow-hidden flex-col justify-between p-12 lg:p-16">
        <Image
          src="/images/about/restaurant-ambience.png"
          alt="The Ember Luxury Ambiance"
          fill
          className="object-cover opacity-60 scale-105 animate-pulse duration-[10000ms]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-[#080808]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/60" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D9A441]/20 to-[#FF9F43]/30 border border-[#D9A441]/50 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#FF9F43]" />
          </div>
          <div>
            <h1 className="font-serif-luxury text-2xl font-bold tracking-widest text-[#F6F1E8]">
              The Ember
            </h1>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#D9A441]">
              Artisanal Charcoal Gastronomy
            </span>
          </div>
        </div>

        {/* Hero Quote */}
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-[#181511]/90 border border-[#D9A441]/30 text-xs text-[#D9A441]">
            Curated Culinary Excellence
          </div>
          <h2 className="font-serif-luxury text-3xl lg:text-4xl font-bold text-[#F6F1E8] leading-tight">
            &ldquo;Good food is not just a meal, it&apos;s an emotion.&rdquo;
          </h2>
          <p className="text-sm text-[#AAA39A] leading-relaxed">
            Welcome to The Ember. Sign in to immerse in signature slow-charred delicacies, live order tracking, and bespoke chef creations.
          </p>

          {/* Quick Demo Shortcuts for Testing */}
          <div className="pt-4 flex flex-wrap gap-2 text-xs">
            <button
              onClick={fillCustomerDemo}
              className="px-3 py-1.5 rounded-lg bg-[#181511] border border-[#2E2820] text-[#D9A441] hover:border-[#D9A441] transition-all flex items-center space-x-1"
            >
              <span>Demo Customer Login</span>
            </button>
            <button
              onClick={fillAdminDemo}
              className="px-3 py-1.5 rounded-lg bg-[#181511] border border-[#2E2820] text-[#FF9F43] hover:border-[#FF9F43] transition-all flex items-center space-x-1"
            >
              <span>Demo Admin Portal</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-xs text-[#666]">
          Bengaluru • Michelin-Inspired Slow-Charred Dining
        </div>
      </div>

      {/* Right Column: Split Screen Authentication Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 relative z-10">
        <div className="w-full max-w-md mx-auto space-y-7">
          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center space-x-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#D9A441]/20 border border-[#D9A441]/50 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF9F43]" />
            </div>
            <span className="font-serif-luxury text-xl font-bold tracking-widest text-[#F6F1E8]">
              The Ember
            </span>
          </div>

          {/* Customer / Admin Tab Switcher */}
          <div className="flex rounded-xl bg-[#14120E] p-1 border border-[#262018]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('customer');
                setIsRegistering(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'customer'
                  ? 'bg-gradient-to-r from-[#1E1913] to-[#252018] text-[#D9A441] border border-[#D9A441]/30 shadow-md'
                  : 'text-[#888] hover:text-[#CCC]'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Customer Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setIsRegistering(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-[#2A180E] to-[#331C10] text-[#FF9F43] border border-[#FF9F43]/40 shadow-md'
                  : 'text-[#888] hover:text-[#CCC]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* Form Header */}
          <div>
            <h3 className="font-serif-luxury text-2xl font-bold text-[#F6F1E8]">
              {activeTab === 'admin'
                ? 'Administrator Access'
                : isRegistering
                ? 'Create Your Account'
                : 'Welcome Back'}
            </h3>
            <p className="text-xs text-[#AAA39A] mt-1.5">
              {activeTab === 'admin'
                ? 'Authorized personnel only. Spring Security verified.'
                : isRegistering
                ? 'Join The Ember to enjoy exclusive dining privileges.'
                : 'Sign in to access your orders and gourmet menu.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && activeTab === 'customer' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#AAA39A] uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#666] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full bg-[#111111] border border-[#262018] focus:border-[#D9A441] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F6F1E8] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#AAA39A] uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#666] absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#111111] border border-[#262018] focus:border-[#D9A441] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F6F1E8] outline-none transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#AAA39A] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#666] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'admin@theember.com' : 'guest@example.com'}
                  className="w-full bg-[#111111] border border-[#262018] focus:border-[#D9A441] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F6F1E8] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#AAA39A] uppercase tracking-wider">
                  Password
                </label>
                {!isRegistering && activeTab === 'customer' && (
                  <span className="text-[11px] text-[#D9A441] hover:underline cursor-pointer">
                    Forgot Password?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#666] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#111111] border border-[#262018] focus:border-[#D9A441] rounded-xl pl-10 pr-10 py-3 text-sm text-[#F6F1E8] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#666] hover:text-[#AAA39A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wider text-black flex items-center justify-center space-x-2 transition-all mt-2 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-[#FF9F43] to-[#FF6F00] hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,111,0,0.35)]'
                  : 'orange-gradient-btn'
              }`}
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>
                    {activeTab === 'admin'
                      ? 'Access Admin Dashboard'
                      : isRegistering
                      ? 'Complete Registration'
                      : 'Sign In to The Ember'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Customer Register / Login Toggle */}
          {activeTab === 'customer' && (
            <div className="pt-2 text-center text-xs text-[#AAA39A]">
              {isRegistering ? (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setIsRegistering(false);
                      setErrorMsg('');
                    }}
                    className="text-[#D9A441] font-semibold hover:underline ml-1"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p>
                  Don&apos;t have an account yet?{' '}
                  <button
                    onClick={() => {
                      setIsRegistering(true);
                      setErrorMsg('');
                    }}
                    className="text-[#D9A441] font-semibold hover:underline ml-1"
                  >
                    Create Account
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Quick Role Selection Box */}
          <div className="p-3.5 rounded-xl bg-[#13110E] border border-[#221D16] text-[11px] space-y-1.5 text-[#888]">
            <div className="flex justify-between items-center text-[#D9A441] font-semibold">
              <span>Quick Role Selection</span>
              <span className="text-[10px] text-[#666]">Prefill Email</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Customer: <strong className="text-[#CCC]">customer@theember.com</strong></span>
              <button
                type="button"
                onClick={fillCustomerDemo}
                className="text-[10px] text-[#FF9F43] hover:underline"
              >
                Select Customer
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Admin: <strong className="text-[#CCC]">admin@theember.com</strong></span>
              <button
                type="button"
                onClick={fillAdminDemo}
                className="text-[10px] text-[#FF9F43] hover:underline"
              >
                Select Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
