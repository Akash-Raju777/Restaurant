'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  discountedPrice?: number;
  imageUrl: string;
  isVeg: boolean;
  quantity: number;
  spiceLevel?: string;
  notes?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (dish: any, quantity?: number, spiceLevel?: string, notes?: string, openDrawer?: boolean) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  showToast: (message: string) => void;
  lastAddedDish: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastAddedDish, setLastAddedDish] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ember_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        if (parsed.length > 0) {
          setLastAddedDish(parsed[parsed.length - 1].name);
        }
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ember_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const showToast = (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const addItem = (dish: any, quantity = 1, spiceLevel = 'Medium', notes = '', openDrawer = false) => {
    setLastAddedDish(dish.name);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === dish.id && i.spiceLevel === spiceLevel);
      if (existing) {
        return prev.map((i) =>
          i.id === dish.id && i.spiceLevel === spiceLevel
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          id: dish.id,
          name: dish.name,
          price: dish.discountedPrice || dish.price,
          imageUrl: dish.imageUrl,
          isVeg: dish.isVeg,
          quantity,
          spiceLevel,
          notes,
        },
      ];
    });

    if (openDrawer) {
      setIsDrawerOpen(true);
    }

    // Also trigger subtle toast notification
    showToast(`${dish.name} added to cart`);
  };

  const removeItem = (id: number) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      if (updated.length > 0) {
        setLastAddedDish(updated[updated.length - 1].name);
      } else {
        setLastAddedDish(null);
      }
      return updated;
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    setLastAddedDish(null);
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalCount,
        isDrawerOpen,
        setIsDrawerOpen,
        showToast,
        lastAddedDish,
      }}
    >
      {children}

      {/* Permanent Bottom Cart Bar showing all details when user chooses any product */}
      {totalCount > 0 && !isDrawerOpen && pathname !== '/checkout' && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-[#120F0B]/95 border border-[#D9A441]/50 backdrop-blur-xl rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-[0_15px_45px_rgba(0,0,0,0.92),0_0_20px_rgba(217,164,65,0.22)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300"
          role="region"
          aria-label="Cart summary bar"
        >
          {/* Left: Product notification + All details */}
          <div className="flex items-center space-x-3 w-full sm:w-auto min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#D9A441]/30 to-[#FF9F43]/40 border border-[#D9A441]/60 flex items-center justify-center flex-shrink-0 text-[#FF9F43] shadow-[0_0_10px_rgba(255,159,67,0.35)]">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-[#F6F1E8] truncate">
                  {lastAddedDish || items[items.length - 1]?.name || 'Item'} added to cart
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#D9A441]" />
                <span className="text-[11px] font-semibold text-[#FF9F43] bg-[#221B12] px-2 py-0.5 rounded-full border border-[#D9A441]/30 flex-shrink-0">
                  {totalCount} {totalCount === 1 ? 'dish' : 'dishes'}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-[#AAA39A] mt-0.5">
                <span>
                  Total: <strong className="text-[#FF9F43] font-bold text-xs sm:text-sm">₹{subtotal.toFixed(2)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions (VIEW CART and CHECKOUT) */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end flex-shrink-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#D9A441] hover:text-[#FF9F43] bg-[#1C1813] border border-[#D9A441]/40 hover:border-[#D9A441] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Cart</span>
            </button>

            <Link
              href="/checkout"
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-black orange-gradient-btn shadow-lg flex items-center justify-center space-x-1.5 hover:scale-105 transition-all cursor-pointer"
            >
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
