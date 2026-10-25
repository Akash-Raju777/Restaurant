'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const { items, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem, subtotal, totalCount } = useCart();

  if (!isDrawerOpen) return null;

  const grandTotal = subtotal;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Slide-over Content */}
      <div className="relative z-10 w-full max-w-md bg-[#111111] border-l border-[#26221C] flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-[#26221C] flex items-center justify-between bg-[#15120E]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#D9A441]/10 rounded-lg text-[#D9A441]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F6F1E8] tracking-wide">Your Cart</h2>
              <p className="text-xs text-[#AAA39A]">
                {totalCount} {totalCount === 1 ? 'dish' : 'dishes'} selected
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-[#AAA39A] hover:text-[#F6F1E8] hover:bg-[#222] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1A1815] border border-[#26221C] flex items-center justify-center text-[#D9A441]/40">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#F6F1E8]">Your Cart is Empty</h3>
                <p className="text-xs text-[#AAA39A] mt-1">
                  Discover our chef-crafted gourmet specialties and add them to your cart.
                </p>
              </div>
              <Link
                href="/menu"
                onClick={() => setIsDrawerOpen(false)}
                className="mt-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-black orange-gradient-btn"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.id}-${item.spiceLevel}`}
                className="flex items-center space-x-3 bg-[#181511] p-3 rounded-xl border border-[#26221C] hover:border-[#D9A441]/30 transition-all"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#0A0A0A]">
                  <Image
                    src={item.imageUrl || '/images/food/placeholder.png'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <h4 className="text-sm font-medium text-[#F6F1E8] truncate">{item.name}</h4>
                  </div>
                  {item.spiceLevel && (
                    <span className="text-[11px] text-[#D9A441]/80 block">
                      Spice: {item.spiceLevel}
                    </span>
                  )}
                  <div className="text-sm font-semibold text-[#FF9F43] mt-1">
                    ₹{item.price * item.quantity}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end space-y-2">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[#AAA39A]/60 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center space-x-2 bg-[#111] border border-[#2A241D] rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="text-[#AAA39A] hover:text-[#F6F1E8]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-semibold text-[#F6F1E8] w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="text-[#AAA39A] hover:text-[#F6F1E8]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#26221C] bg-[#14120E] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#AAA39A]">
                <span>Item Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-[#F6F1E8] pt-2 border-t border-[#26221C]">
                <span>Total Amount</span>
                <span className="text-[#FF9F43] text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm text-black orange-gradient-btn shadow-lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
