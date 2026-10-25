'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useCart } from '@/lib/cart-context';
import { apiRequest, getSession } from '@/lib/api';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Tag,
  AlertCircle,
  Truck,
  Building,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [session, setSession] = useState<any>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [houseDetails, setHouseDetails] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560038');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Coupon & Payment
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_UPI'>('COD');

  // Order Placement State
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) {
      setCustomerName(s.fullName || '');
      // Try to load saved addresses
      apiRequest<any[]>('/customer/addresses')
        .then((addrs) => {
          if (addrs && addrs.length > 0) {
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            setHouseDetails(def.houseDetails || '');
            setStreet(def.street || '');
            setArea(def.area || '');
            setCity(def.city || 'Bengaluru');
            setState(def.state || 'Karnataka');
            setPostalCode(def.postalCode || '560038');
            setDeliveryNotes(def.deliveryInstructions || '');
          }
        })
        .catch(() => {});
    }
  }, []);

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountAmount && discountAmount > appliedCoupon.maxDiscountAmount) {
        discountAmount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const activeOffers = await apiRequest<any[]>('/offers');
      const found = activeOffers.find(
        (o) => o.code && o.code.toUpperCase() === couponCode.trim().toUpperCase()
      );

      if (!found) {
        setCouponError('Invalid or expired coupon code.');
        return;
      }

      if (found.minOrderAmount && subtotal < found.minOrderAmount) {
        setCouponError(`Minimum order amount of ₹${found.minOrderAmount} required.`);
        return;
      }

      setAppliedCoupon(found);
    } catch {
      setCouponError('Could not validate coupon.');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');
    setLoading(true);

    if (items.length === 0) {
      setOrderError('Your cart is empty.');
      setLoading(false);
      return;
    }

    const fullAddress = `${houseDetails}, ${street}, ${area}, ${city}, ${state} - ${postalCode}`;

    const payload = {
      customerName,
      customerPhone,
      deliveryAddress: fullAddress,
      deliveryNotes,
      paymentMethod,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      items: items.map((i) => ({
        menuItemId: i.id,
        quantity: i.quantity,
        customizationNotes: i.spiceLevel ? `Spice: ${i.spiceLevel}` : undefined,
      })),
    };

    try {
      const order = await apiRequest<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Clear cart
      clearCart();
      setConfirmedOrder(order);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D9A441', '#FF9F43', '#FFFFFF'],
        });
      } catch {}
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* If Order is Confirmed */}
          {confirmedOrder ? (
            <div className="max-w-2xl mx-auto bg-[#111111] border border-[#262018] rounded-3xl p-8 sm:p-12 text-center space-y-7 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#D9A441] font-bold">
                  Order Successfully Placed
                </span>
                <h1 className="font-serif-luxury text-3xl font-bold text-[#F6F1E8]">
                  Order #{confirmedOrder.orderNumber}
                </h1>
                <p className="text-xs text-[#AAA39A]">
                  Thank you, <strong className="text-[#F6F1E8]">{confirmedOrder.customerName}</strong>! Our kitchen has received your order and begun slow-charcoal preparation.
                </p>
              </div>

              {/* Order Status Card */}
              <div className="bg-[#181511] p-5 rounded-2xl border border-[#28221A] text-left space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#888]">Estimated Delivery</span>
                  <div className="flex items-center space-x-1.5 text-[#FF9F43] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>35 - 45 Minutes</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#888]">Order Status</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-950 border border-amber-700 text-amber-300">
                    {confirmedOrder.orderStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#888]">Payment Mode</span>
                  <span className="text-[#F6F1E8] font-semibold">
                    {confirmedOrder.paymentMethod === 'COD' ? 'Cash on Delivery (Pending)' : 'Online UPI'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-[#F6F1E8] pt-2 border-t border-[#221D16]">
                  <span>Total Amount</span>
                  <span className="text-[#FF9F43] text-base">₹{confirmedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Navigation Action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/orders"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-black uppercase tracking-wider orange-gradient-btn flex items-center justify-center space-x-2"
                >
                  <span>Track in My Orders</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/menu"
                  className="py-3 px-6 rounded-xl font-bold text-xs text-[#AAA39A] bg-[#16130F] border border-[#262018] hover:text-[#F6F1E8] transition-colors"
                >
                  Order More Dishes
                </Link>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <div className="space-y-8">
              <div>
                <h1 className="font-serif-luxury text-3xl font-bold text-[#F6F1E8]">Checkout</h1>
                <p className="text-xs text-[#AAA39A] mt-1">
                  Complete your delivery destination and preferred payment method.
                </p>
              </div>

              {orderError && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Address & Payment Selection */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Delivery Address */}
                  <div className="bg-[#111111] p-6 rounded-3xl border border-[#221D16] space-y-4">
                    <div className="flex items-center space-x-2.5 pb-2 border-b border-[#201B14]">
                      <MapPin className="w-5 h-5 text-[#D9A441]" />
                      <h2 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                        Delivery Address
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">Full Name</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Rohan Sharma"
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">House / Flat / Building</label>
                        <input
                          type="text"
                          required
                          value={houseDetails}
                          onChange={(e) => setHouseDetails(e.target.value)}
                          placeholder="Flat 402, Royal Palms Residency"
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">Street Name</label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="MG Road"
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">Area / Locality</label>
                        <input
                          type="text"
                          required
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="Indiranagar"
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">City</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">PIN Code</label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="560038"
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-semibold text-[#888] uppercase">Delivery Instructions</label>
                        <input
                          type="text"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          placeholder="e.g. Ring bell twice, leave with security guard"
                          className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Selection */}
                  <div className="bg-[#111111] p-6 rounded-3xl border border-[#221D16] space-y-4">
                    <div className="flex items-center space-x-2.5 pb-2 border-b border-[#201B14]">
                      <CreditCard className="w-5 h-5 text-[#FF9F43]" />
                      <h2 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                        Payment Option
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {/* COD Option */}
                      <label
                        className={`flex items-start space-x-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'COD'
                            ? 'bg-[#1C1812] border-[#D9A441] shadow-lg'
                            : 'bg-[#15120E] border-[#221D16] hover:border-[#333]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'COD'}
                          onChange={() => setPaymentMethod('COD')}
                          className="mt-1 text-[#D9A441] focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Banknote className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-bold text-[#F6F1E8]">Cash on Delivery (COD)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Active & Recommended
                            </span>
                          </div>
                          <p className="text-xs text-[#888] mt-1">
                            Pay with cash or UPI scan directly upon arrival of the gourmet thermal box.
                          </p>
                        </div>
                      </label>

                      {/* Online UPI Option */}
                      <label
                        className={`flex items-start space-x-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'ONLINE_UPI'
                            ? 'bg-[#1C1812] border-[#D9A441] shadow-lg'
                            : 'bg-[#15120E] border-[#221D16] hover:border-[#333]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'ONLINE_UPI'}
                          onChange={() => setPaymentMethod('ONLINE_UPI')}
                          className="mt-1 text-[#D9A441] focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-[#FF9F43]" />
                            <span className="text-sm font-bold text-[#F6F1E8]">UPI / Online Payment (Razorpay)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                              Integration Sandbox Ready
                            </span>
                          </div>
                          <p className="text-xs text-[#888] mt-1">
                            Prepares live gateway order verification. Backend verifies trusted webhook signature.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right: Order Summary & Coupon */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Coupon Box */}
                  <div className="bg-[#111111] p-5 rounded-3xl border border-[#221D16] space-y-3">
                    <span className="text-xs font-semibold text-[#AAA39A] uppercase tracking-wider flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#D9A441]" />
                      <span>Promotional Offer & Coupon</span>
                    </span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="e.g. WEEKEND20, FAMILY999"
                        className="flex-1 bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] uppercase tracking-wider outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-black orange-gradient-btn"
                      >
                        Apply
                      </button>
                    </div>

                    {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="p-2.5 rounded-xl bg-[#1A1813] border border-[#D9A441]/40 flex justify-between items-center text-xs">
                        <span className="text-emerald-400 font-semibold">
                          ✓ {appliedCoupon.title} Applied (-₹{discountAmount.toFixed(2)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setAppliedCoupon(null)}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Summary Card */}
                  <div className="bg-[#111111] p-6 rounded-3xl border border-[#221D16] space-y-4 shadow-xl">
                    <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8] pb-3 border-b border-[#201B14]">
                      Order Summary
                    </h3>

                    {/* Items */}
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-[#FF9F43] font-bold">{item.quantity}x</span>
                            <span className="text-[#F6F1E8] font-medium">{item.name}</span>
                          </div>
                          <span className="text-[#AAA39A]">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown */}
                    <div className="pt-3 border-t border-[#201B14] space-y-2 text-xs">
                      <div className="flex justify-between text-[#888]">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>Coupon Discount</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}



                      <div className="flex justify-between items-center pt-3 border-t border-[#201B14] text-base font-bold text-[#F6F1E8]">
                        <span>Payable Amount</span>
                        <span className="text-[#FF9F43] text-xl">₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || items.length === 0}
                      className="w-full py-4 rounded-xl text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn shadow-lg flex items-center justify-center space-x-2 mt-4"
                    >
                      {loading ? (
                        <span>Validating with backend...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Place Order • ₹{grandTotal.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
