'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useCart } from '@/lib/cart-context';
import { CustomerGuard } from '@/components/auth-guard';
import {
  apiRequest,
  getSession,
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddressApi,
  setDefaultAddress,
  Address,
} from '@/lib/api';
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
  X,
  Check,
  Edit,
  Trash2,
  AlertTriangle,
  Plus,
  Phone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [session, setSession] = useState<any>(null);

  // Address Modal Fields
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

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSuccess, setAddressSuccess] = useState('');
  const [addressError, setAddressError] = useState('');

  // Address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalAddressId, setModalAddressId] = useState<number | null>(null);
  const [addressType, setAddressType] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');

  // Horizontal scroll ref & progress
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
    }
  };

  const scrollCards = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) {
      setCustomerName(s.fullName || '');
      fetchAddresses()
        .then((addrs) => {
          const enhanced = (addrs || []).map((addr) => {
            let cachedMeta: any = null;
            if (addr.id) {
              try {
                const stored = localStorage.getItem(`ember_addr_meta_${addr.id}`);
                if (stored) cachedMeta = JSON.parse(stored);
              } catch {}
            }
            return {
              ...addr,
              recipientName: addr.recipientName || cachedMeta?.recipientName || s.fullName || '',
              recipientPhone: addr.recipientPhone || cachedMeta?.recipientPhone || s.phoneNumber || '',
              addressType: addr.addressType || cachedMeta?.addressType || 'HOME',
            };
          });
          setSavedAddresses(enhanced);
          const defaultAddr = enhanced.find((a) => a.isDefault) || enhanced[0];
          if (defaultAddr) {
            selectSavedAddress(defaultAddr);
          }
        })
        .catch((err) => {
          console.debug('[Checkout] Address fetch failed:', {
            hasSession: !!s,
            sessionId: s?.id,
            error: err.message,
          });
          setSavedAddresses([]);
        });
    }
  }, []);

  useEffect(() => {
    setConfirmedOrder(null);
    setOrderError('');
    setLoading(false);
  }, []);

  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const deliveryFee = subtotal >= 499 ? 0 : 40;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const applyCoupon = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    setCouponError('');
    if (!code) return;
    try {
      const result = await apiRequest<any>('/offers/validate', {
        method: 'POST',
        body: JSON.stringify({
          couponCode: code,
          items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        }),
      });
      setCouponCode(code);
      setAppliedCoupon(result);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Could not validate coupon.');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyCoupon(couponCode);
  };

  const selectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id ?? null);
    setCustomerName(addr.recipientName || session?.fullName || '');
    setCustomerPhone(addr.recipientPhone || session?.phoneNumber || '');
    setHouseDetails(addr.houseDetails || '');
    setStreet(addr.street || '');
    setArea(addr.area || '');
    setCity(addr.city || 'Bengaluru');
    setState(addr.state || 'Karnataka');
    setPostalCode(addr.postalCode || '');
    setDeliveryNotes(addr.deliveryInstructions || '');
    setAddressType((addr.addressType as any) || 'HOME');
  };

  const getFullAddress = () => {
    if (selectedAddressId !== null) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        const namePart = addr.recipientName ? `${addr.recipientName}, ` : '';
        const phonePart = addr.recipientPhone ? `${addr.recipientPhone}, ` : '';
        return `${namePart}${phonePart}${addr.houseDetails}, ${addr.street}, ${addr.area}, ${addr.city}, ${addr.state} - ${addr.postalCode}`;
      }
    }
    const namePart = customerName ? `${customerName}, ` : '';
    const phonePart = customerPhone ? `${customerPhone}, ` : '';
    return `${namePart}${phonePart}${houseDetails}, ${street}, ${area}, ${city}, ${state} - ${postalCode}`;
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setModalAddressId(null);
    setAddressType('HOME');
    setCustomerName(session?.fullName || '');
    setCustomerPhone(session?.phoneNumber || '');
    setHouseDetails('');
    setStreet('');
    setArea('');
    setCity('Bengaluru');
    setState('Karnataka');
    setPostalCode('');
    setDeliveryNotes('');
    setAddressError('');
    setShowAddressModal(true);
  };

  const handleEditAddress = (addr: Address) => {
    setModalMode('edit');
    setModalAddressId(addr.id ?? null);
    setCustomerName(addr.recipientName || '');
    setCustomerPhone(addr.recipientPhone || '');
    setHouseDetails(addr.houseDetails || '');
    setStreet(addr.street || '');
    setArea(addr.area || '');
    setCity(addr.city || 'Bengaluru');
    setState(addr.state || 'Karnataka');
    setPostalCode(addr.postalCode || '');
    setDeliveryNotes(addr.deliveryInstructions || '');
    setAddressType((addr.addressType as any) || 'HOME');
    setAddressError('');
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    if (!customerName.trim() || !customerPhone.trim() || !houseDetails.trim() || !street.trim() || !area.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      setAddressError('Please fill in all required address fields including recipient name and phone.');
      return;
    }

    setAddressSaving(true);
    try {
      const s = getSession();
      if (!s) {
        // Guest mode fallback
        const guestAddress: Address = {
          id: modalAddressId || Date.now(),
          houseDetails,
          street,
          area,
          city,
          state,
          postalCode,
          deliveryInstructions: deliveryNotes || undefined,
          recipientName: customerName,
          recipientPhone: customerPhone,
          addressType,
          isDefault: true,
        };
        if (modalMode === 'edit') {
          setSavedAddresses((prev) => prev.map((a) => (a.id === guestAddress.id ? guestAddress : a)));
        } else {
          setSavedAddresses((prev) => [...prev, guestAddress]);
        }
        selectSavedAddress(guestAddress);
        setShowAddressModal(false);
        return;
      }

      if (modalMode === 'edit' && modalAddressId !== null) {
        const updated = await updateAddress(modalAddressId, {
          houseDetails,
          street,
          area,
          city,
          state,
          postalCode,
          deliveryInstructions: deliveryNotes || undefined,
          recipientName: customerName,
          recipientPhone: customerPhone,
          addressType,
        });

        const fullUpdated: Address = {
          ...updated,
          recipientName: customerName.trim() || updated.recipientName || session?.fullName || '',
          recipientPhone: customerPhone.trim() || updated.recipientPhone || session?.phoneNumber || '',
          addressType: addressType || updated.addressType || 'HOME',
        };

        if (fullUpdated.id) {
          try {
            localStorage.setItem(
              `ember_addr_meta_${fullUpdated.id}`,
              JSON.stringify({
                recipientName: fullUpdated.recipientName,
                recipientPhone: fullUpdated.recipientPhone,
                addressType: fullUpdated.addressType,
              })
            );
          } catch {}
        }

        setSavedAddresses((prev) => {
          const hadOld = prev.some((a) => a.id === modalAddressId);
          if (hadOld) {
            return prev.map((a) => (a.id === modalAddressId ? fullUpdated : a));
          }
          return [...prev.filter((a) => a.id !== fullUpdated.id), fullUpdated];
        });
        setAddressSuccess('Address updated successfully.');
        selectSavedAddress(fullUpdated);
      } else {
        const saved = await addAddress({
          houseDetails,
          street,
          area,
          city,
          state,
          postalCode,
          deliveryInstructions: deliveryNotes || undefined,
          recipientName: customerName,
          recipientPhone: customerPhone,
          addressType,
          isDefault: savedAddresses.length === 0,
        });

        const fullSaved: Address = {
          ...saved,
          recipientName: customerName.trim() || saved.recipientName || session?.fullName || '',
          recipientPhone: customerPhone.trim() || saved.recipientPhone || session?.phoneNumber || '',
          addressType: addressType || saved.addressType || 'HOME',
        };

        if (fullSaved.id) {
          try {
            localStorage.setItem(
              `ember_addr_meta_${fullSaved.id}`,
              JSON.stringify({
                recipientName: fullSaved.recipientName,
                recipientPhone: fullSaved.recipientPhone,
                addressType: fullSaved.addressType,
              })
            );
          } catch {}
        }

        setSavedAddresses((prev) => [...prev, fullSaved]);
        setAddressSuccess('Address saved successfully.');
        selectSavedAddress(fullSaved);
      }
      setShowAddressModal(false);
    } catch (err: any) {
      if (err.message?.includes('log in again')) {
        router.push('/');
        return;
      }
      setAddressError(err.message || 'Failed to save address.');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleConfirmDelete = (id: number) => {
    setAddressToDelete(id);
    setDeleteConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (addressToDelete === null) return;
    try {
      await deleteAddressApi(addressToDelete);
      const remaining = savedAddresses.filter((a) => a.id !== addressToDelete);
      setSavedAddresses(remaining);
      if (selectedAddressId === addressToDelete) {
        if (remaining.length > 0) {
          selectSavedAddress(remaining[0]);
        } else {
          setSelectedAddressId(null);
        }
      }
      setAddressToDelete(null);
      setDeleteConfirm(false);
    } catch (err: any) {
      // Local fallback if guest or api failure
      const remaining = savedAddresses.filter((a) => a.id !== addressToDelete);
      setSavedAddresses(remaining);
      if (selectedAddressId === addressToDelete) {
        if (remaining.length > 0) {
          selectSavedAddress(remaining[0]);
        } else {
          setSelectedAddressId(null);
        }
      }
      setAddressToDelete(null);
      setDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setAddressToDelete(null);
    setDeleteConfirm(false);
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

    if (!customerName || !customerPhone || !houseDetails) {
      setOrderError('Please select or add a delivery address with recipient details.');
      setLoading(false);
      return;
    }

    const fullAddress = getFullAddress();
    const isUsingSavedAddress = selectedAddressId !== null && savedAddresses.some((a) => a.id === selectedAddressId);

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

      if (!isUsingSavedAddress && customerName && customerPhone && houseDetails && street && area && city && state && postalCode && session) {
        try {
          await addAddress({
            houseDetails,
            street,
            area,
            city,
            state,
            postalCode,
            deliveryInstructions: deliveryNotes || undefined,
            recipientName: customerName,
            recipientPhone: customerPhone,
            addressType,
            isDefault: savedAddresses.length === 0,
          });
        } catch {
          // Address save failure should not block order confirmation
        }
      }

      clearCart();
      setConfirmedOrder(order);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col font-sans">
      <Navbar />

      <CustomerGuard>
        <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 border border-amber-700 text-amber-300">
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
            <div className="space-y-6">
              {/* Checkout Progress Stepper */}
              <div className="flex flex-col items-center justify-center pt-2 pb-4">
                <div className="flex items-center gap-3 sm:gap-6">
                  {/* Step 1: Address (completed/active) */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border border-[#D9A441] bg-[#1A150A] text-[#D9A441] flex items-center justify-center text-xs font-bold">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-[11px] text-[#AAA39A] font-medium mt-1">Address</span>
                  </div>

                  {/* Connector 1 */}
                  <div className="w-16 sm:w-28 h-[2px] bg-[#D9A441] -mt-5" />

                  {/* Step 2: Order Summary (Active) */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#D9A441] text-black font-bold flex items-center justify-center text-xs shadow-[0_0_12px_rgba(217,164,65,0.4)]">
                      2
                    </div>
                    <span className="text-[11px] text-[#D9A441] font-bold mt-1">Order Summary</span>
                  </div>

                  {/* Connector 2 */}
                  <div className="w-16 sm:w-28 h-[2px] bg-[#332B20] -mt-5" />

                  {/* Step 3: Payment */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border border-[#332B20] bg-[#15120E] text-[#777] flex items-center justify-center text-xs font-medium">
                      3
                    </div>
                    <span className="text-[11px] text-[#777] font-medium mt-1">Payment</span>
                  </div>
                </div>
                <p className="text-xs text-[#AAA39A] mt-2 text-center">
                  Complete your delivery destination and preferred payment method.
                </p>
              </div>

              {orderError && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* 1. Full-Width Delivery Address Card Container */}
                <div className="bg-[#111111] p-6 sm:p-7 rounded-3xl border border-[#221D16] space-y-4 shadow-xl">
                  {/* Delivery Address Header */}
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#D9A441]/10 border border-[#D9A441]/40 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#D9A441]" />
                    </div>
                    <h2 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">
                      Delivery Address
                    </h2>
                  </div>

                  {/* Horizontal Scroll Cards Container */}
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto pb-2 pt-2 scroll-smooth scrollbar-none items-stretch"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => selectSavedAddress(addr)}
                          className={`w-80 min-w-[300px] sm:min-w-[320px] p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#181510] border-[#D9A441] shadow-[0_0_15px_rgba(217,164,65,0.15)] ring-1 ring-[#D9A441]'
                              : 'bg-[#12110E] border-[#241F18] hover:border-[#D9A441]/40'
                          }`}
                        >
                          {/* Top Row: Radio, Name, Badge, Edit/Delete */}
                          <div>
                            <div className="flex items-center justify-between pb-2 border-b border-[#201B14]">
                              <div className="flex items-center space-x-2 overflow-hidden pr-2">
                                {/* Radio Indicator */}
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-[#D9A441] text-black flex items-center justify-center flex-shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-[#666] flex-shrink-0" />
                                )}

                                <span className="font-bold text-[#F6F1E8] text-sm truncate">
                                  {addr.recipientName || session?.fullName || 'Akash R'}
                                </span>

                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#282010] text-[#D9A441] border border-[#D9A441]/30 flex-shrink-0">
                                  {addr.addressType || 'HOME'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAddress(addr);
                                  }}
                                  className="text-xs text-[#AAA39A] hover:text-[#D9A441] flex items-center space-x-1 transition-colors"
                                  title="Edit Address"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmDelete(addr.id!);
                                  }}
                                  className="text-xs text-[#AAA39A] hover:text-rose-400 flex items-center space-x-1 transition-colors"
                                  title="Delete Address"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>

                            {/* Middle Details */}
                            <div className="pt-3 space-y-2">
                              <div className="flex items-start space-x-2 text-xs text-[#AAA39A]">
                                <MapPin className="w-4 h-4 text-[#D9A441] flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2 leading-relaxed text-[#DCD6CD]">
                                  {addr.houseDetails}, {addr.street}, {addr.area}, {addr.city} - {addr.postalCode}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-[#AAA39A]">
                                <Phone className="w-3.5 h-3.5 text-[#D9A441] flex-shrink-0" />
                                <span className="font-medium text-[#DCD6CD]">
                                  {addr.recipientPhone || session?.phoneNumber || 'No phone number'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Action Pill */}
                          <div className="mt-4 pt-2">
                            {isSelected ? (
                              <div className="w-full py-2 px-3 rounded-xl bg-[#2E200C] border border-[#D9A441]/40 text-[#D9A441] font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#D9A441] text-black flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                                <span>Selected Address</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => selectSavedAddress(addr)}
                                className="w-full py-2 text-center text-xs font-semibold text-[#D9A441] hover:text-[#FF9F43] transition-colors"
                              >
                                Select this address
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add New Address Card */}
                    <div
                      onClick={handleOpenAddModal}
                      className="w-80 min-w-[300px] sm:min-w-[320px] p-6 rounded-2xl border-2 border-dashed border-[#D9A441]/40 bg-[#12110E]/60 hover:border-[#D9A441] hover:bg-[#181510] flex flex-col items-center justify-center cursor-pointer transition-all group flex-shrink-0 min-h-[175px]"
                    >
                      <Plus className="w-8 h-8 text-[#D9A441] mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-[#D9A441]">Add New Address</span>
                      <span className="text-[11px] text-[#777] mt-1">Save a new delivery address</span>
                    </div>
                  </div>

                  {/* Horizontal Scroll Navigation Slider & Arrows */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => scrollCards('left')}
                      className="p-1.5 rounded-lg text-[#AAA39A] hover:text-[#D9A441] hover:bg-[#1C1812] transition-colors"
                      title="Scroll Left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 h-1 bg-[#201C16] rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#D9A441] to-[#FF9F43] rounded-full transition-all duration-150"
                        style={{
                          width: `${Math.max(25, 100 / Math.max(1, savedAddresses.length + 1))}%`,
                          transform: `translateX(${scrollProgress * 2.5}%)`,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollCards('right')}
                      className="p-1.5 rounded-lg text-[#AAA39A] hover:text-[#D9A441] hover:bg-[#1C1812] transition-colors"
                      title="Scroll Right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 2. Responsive Two-Column Layout (Promos + Payments on Left, Summary on Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Promotional Coupon & Payment Option */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Promotional Offer & Coupon */}
                    <div className="bg-[#111111] p-6 rounded-3xl border border-[#221D16] space-y-4">
                      <div className="flex items-center space-x-2 pb-1">
                        <Tag className="w-4 h-4 text-[#D9A441]" />
                        <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">
                          Promotional Offer & Coupon
                        </h3>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="E.g. WEEKEND20, FAMILY999"
                          className="flex-1 bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-4 py-2.5 text-xs text-[#F6F1E8] uppercase tracking-wider outline-none placeholder:text-[#666]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold text-black orange-gradient-btn hover:opacity-95 transition-opacity"
                        >
                          Apply
                        </button>
                      </div>

                      {couponError && <p className="text-xs text-rose-400">{couponError}</p>}

                      {appliedCoupon && (
                        <div className="p-3 rounded-xl bg-[#1A1813] border border-[#D9A441]/40 flex justify-between items-center text-xs">
                          <span className="text-emerald-400 font-bold">
                            {appliedCoupon.title} applied (−₹{discountAmount.toFixed(2)})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode('');
                            }}
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Payment Option */}
                    <div className="bg-[#111111] p-6 rounded-3xl border border-[#221D16] space-y-4">
                      <div className="flex items-center space-x-2 pb-1">
                        <CreditCard className="w-4 h-4 text-[#D9A441]" />
                        <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8]">
                          Payment Option
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {/* Cash on Delivery */}
                        <div
                          onClick={() => setPaymentMethod('COD')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                            paymentMethod === 'COD'
                              ? 'bg-[#181510] border-[#D9A441] shadow-[0_0_10px_rgba(217,164,65,0.1)]'
                              : 'bg-[#14120E] border-[#221D16] hover:border-[#333]'
                          }`}
                        >
                          <div className="mt-1">
                            {paymentMethod === 'COD' ? (
                              <div className="w-4 h-4 rounded-full bg-[#D9A441] text-black flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-[#666]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Banknote className="w-4 h-4 text-[#FF9F43]" />
                              <span className="text-sm font-bold text-[#F6F1E8]">Cash on Delivery</span>
                            </div>
                            <p className="text-xs text-[#888] mt-0.5">
                              Pay when you receive your order
                            </p>
                          </div>
                        </div>

                        {/* UPI Payment */}
                        <div
                          onClick={() => setPaymentMethod('ONLINE_UPI')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3.5 ${
                            paymentMethod === 'ONLINE_UPI'
                              ? 'bg-[#181510] border-[#D9A441] shadow-[0_0_10px_rgba(217,164,65,0.1)]'
                              : 'bg-[#14120E] border-[#221D16] hover:border-[#333]'
                          }`}
                        >
                          <div className="mt-1">
                            {paymentMethod === 'ONLINE_UPI' ? (
                              <div className="w-4 h-4 rounded-full bg-[#D9A441] text-black flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-[#666]" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4 text-[#D9A441]" />
                              <span className="text-sm font-bold text-[#F6F1E8]">UPI</span>
                            </div>
                            <p className="text-xs text-[#888] mt-0.5">
                              Pay via any UPI app
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Order Summary */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#111111] p-6 rounded-3xl border border-[#221D16] space-y-5 shadow-xl">
                      <div className="flex items-center space-x-2 pb-2 border-b border-[#201B14]">
                        <Clock className="w-4 h-4 text-[#D9A441]" />
                        <h3 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                          Order Summary
                        </h3>
                      </div>

                      {/* Items */}
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {items.length === 0 ? (
                          <p className="text-xs text-[#888] py-4 text-center">Your cart is empty.</p>
                        ) : (
                          items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2 truncate pr-2">
                                <span className="text-[#D9A441] font-bold">{item.quantity}x</span>
                                <span className="text-[#F6F1E8] font-medium truncate">{item.name}</span>
                              </div>
                              <span className="text-[#AAA39A] font-medium flex-shrink-0">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Cost Breakdown */}
                      <div className="pt-3 border-t border-[#201B14] space-y-2 text-xs">
                        <div className="flex justify-between text-[#888]">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-400 font-semibold">
                            <span>Coupon Discount</span>
                            <span>−₹{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[#888]">
                          <span>Delivery Fee</span>
                          <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-[#F6F1E8] pt-3 border-t border-[#201B14]">
                          <span>Payable Amount</span>
                          <span className="text-[#D9A441] text-lg font-serif-luxury">
                            ₹{grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Submit Order Button */}
                      <button
                        type="submit"
                        disabled={loading || items.length === 0}
                        className="w-full py-4 rounded-xl text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn shadow-lg flex items-center justify-center space-x-2 mt-4 hover:opacity-95 transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <span>Placing your order...</span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>PLACE ORDER • ₹{grandTotal.toFixed(2)}</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Add / Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddressModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-[#D9A441]/50 rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#221D16]">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#D9A441]" />
                <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">
                  {modalMode === 'edit' ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="p-1 rounded-lg text-[#AAA39A] hover:text-[#F6F1E8] hover:bg-[#1C1812] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Form */}
            <form onSubmit={handleSaveAddress} className="mt-4 space-y-4">
              {addressError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                  {addressError}
                </div>
              )}

              {/* Address Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1.5">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HOME', 'WORK', 'OTHER'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddressType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        addressType === type
                          ? 'bg-[#D9A441] text-black shadow-md'
                          : 'bg-[#181511] text-[#AAA39A] border border-[#28221A] hover:text-[#F6F1E8]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Akash R"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 6384241882"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                  />
                </div>
              </div>

              {/* House / Flat & Street */}
              <div>
                <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                  House / Flat / Block / Floor *
                </label>
                <input
                  type="text"
                  required
                  value={houseDetails}
                  onChange={(e) => setHouseDetails(e.target.value)}
                  placeholder="e.g. 2/262, Lakshmi Illam"
                  className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                  Street / Road / Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Jagadhesh Nagar, Big Bazaar Street"
                  className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                />
              </div>

              {/* Area, City, State, Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Eachanari / Peelamedu"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Coimbatore / Bengaluru"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Tamil Nadu / Karnataka"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                    Postal Code / PIN *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 641021"
                    className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="block text-[11px] font-bold text-[#AAA39A] uppercase tracking-wider mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Ring the doorbell, leave at front door"
                  className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl px-3 py-2 text-xs text-[#F6F1E8] outline-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#201B14]">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#AAA39A] bg-[#181511] border border-[#28221A] hover:text-[#F6F1E8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-black orange-gradient-btn hover:opacity-95 transition-opacity"
                >
                  {addressSaving ? 'Saving...' : 'Save & Select Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Address Confirmation Modal */}
      {deleteConfirm && addressToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancelDelete} />
          <div className="relative z-10 w-full max-w-md bg-[#111111] border border-[#D9A441]/50 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                Delete Address
              </h3>
            </div>
            <p className="text-xs text-[#AAA39A] mb-6">
              Are you sure you want to delete this saved address? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#AAA39A] bg-[#1C1812] border border-[#28221A] hover:text-[#F6F1E8] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-950 border border-rose-800 hover:bg-rose-900 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </CustomerGuard>
    </div>
  );
}