'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ShoppingBag, ArrowRight, X } from 'lucide-react';
import { getCustomerSession, getAdminSession, UserSession } from '@/lib/api';

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
  const [session, setSession] = useState<UserSession | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastAddedDish, setLastAddedDish] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationEntering, setNotificationEntering] = useState(false);
  const [notificationExiting, setNotificationExiting] = useState(false);
  const [notificationDish, setNotificationDish] = useState('');
  const [notificationQty, setNotificationQty] = useState(0);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationRaf = useRef<number | null>(null);

  const dismissNotification = useCallback(() => {
    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
      notificationTimer.current = null;
    }
    if (notificationRaf.current) {
      cancelAnimationFrame(notificationRaf.current);
      notificationRaf.current = null;
    }
    setNotificationExiting(true);
    notificationTimer.current = setTimeout(() => {
      setNotificationOpen(false);
      setNotificationExiting(false);
      setNotificationEntering(false);
      setNotificationDish('');
      setNotificationQty(0);
      notificationTimer.current = null;
    }, 300);
  }, []);

  const showNotification = useCallback(
    (dishName: string, qty: number) => {
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
        notificationTimer.current = null;
      }
      if (notificationRaf.current) {
        cancelAnimationFrame(notificationRaf.current);
        notificationRaf.current = null;
      }
      setNotificationDish(dishName);
      setNotificationQty(qty);
      setNotificationExiting(false);
      setNotificationOpen(true);
      setNotificationEntering(true);
      notificationRaf.current = requestAnimationFrame(() => {
        setNotificationEntering(false);
        notificationRaf.current = null;
      });
      notificationTimer.current = setTimeout(() => {
        dismissNotification();
        notificationTimer.current = null;
      }, 5000);
    },
    [dismissNotification]
  );

  useEffect(() => {
    const syncSessionAndCart = () => {
      const customer = getCustomerSession();
      const admin = getAdminSession();
      const currentSession = customer || admin;
      setSession(currentSession);
      if (!currentSession) {
        setItems([]);
        setLastAddedDish(null);
        setIsDrawerOpen(false);
        try {
          localStorage.removeItem('ember_cart');
        } catch {
          // ignore
        }
      } else {
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
      }
      setIsLoaded(true);
    };

    syncSessionAndCart();

    window.addEventListener('ember_auth_change_customer', syncSessionAndCart);
    window.addEventListener('ember_auth_change_admin', syncSessionAndCart);
    window.addEventListener('storage', syncSessionAndCart);
    return () => {
      window.removeEventListener('ember_auth_change_customer', syncSessionAndCart);
      window.removeEventListener('ember_auth_change_admin', syncSessionAndCart);
      window.removeEventListener('storage', syncSessionAndCart);
    };
  }, []);

  // When route changes, sync session state and ensure logged-out users have empty cart
  useEffect(() => {
    const customer = getCustomerSession();
    const admin = getAdminSession();
    const currentSession = customer || admin;
    setSession(currentSession);
    if (!currentSession) {
      setItems([]);
      setLastAddedDish(null);
      setIsDrawerOpen(false);
      try {
        localStorage.removeItem('ember_cart');
      } catch {
        // ignore
      }
    }
  }, [pathname]);

  // Hide notification immediately when navigating away from Home / Menu pages
  useEffect(() => {
    if (pathname !== '/home' && pathname !== '/menu') {
      dismissNotification();
    }
  }, [pathname, dismissNotification]);

  // Cleanup timers and animation frames on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
        notificationTimer.current = null;
      }
      if (notificationRaf.current) {
        cancelAnimationFrame(notificationRaf.current);
        notificationRaf.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (session) {
        localStorage.setItem('ember_cart', JSON.stringify(items));
      } else {
        localStorage.removeItem('ember_cart');
      }
    }
  }, [items, isLoaded, session]);

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

    // Show bottom cart notification after successful Add to Cart
    showNotification(dish.name, quantity);
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
    setIsDrawerOpen(false);
    dismissNotification();
    try {
      localStorage.removeItem('ember_cart');
    } catch {
      // ignore
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Floating cart notification: strictly only on Home (/home) and Menu (/menu) pages,
  // only after an Add to Cart action, never on checkout, orders, about, gallery, offers, contact, login or admin
  const isAllowedPage = pathname === '/home' || pathname === '/menu';
  const shouldShowFloatingBar =
    Boolean(session) &&
    totalCount > 0 &&
    notificationOpen &&
    !notificationExiting &&
    !isDrawerOpen &&
    isAllowedPage;

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

      {/* Floating Bottom Cart Notification: only on Home (/home) & Menu (/menu),
           only after Add to Cart, hidden on navigation away, logout, close, View Cart or Checkout */}
      {shouldShowFloatingBar && (
        <div
          className={`
            fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-3xl
            bg-[#120F0B]/95 border border-[#D9A441]/50 backdrop-blur-xl rounded-2xl p-3 sm:px-5 sm:py-3
            shadow-[0_15px_45px_rgba(0,0,0,0.92),0_0_20px_rgba(217,164,65,0.22)]
            flex flex-col sm:flex-row items-center justify-between gap-3
            transition-all duration-300 ease-out
            ${notificationExiting ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
            ${notificationEntering ? 'opacity-0 translate-y-8' : ''}
          `}
          role="region"
          aria-label="Cart notification"
        >
          {/* Close button */}
          <button
            onClick={dismissNotification}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#221B12]/80 border border-[#D9A441]/30 text-[#D9A441] flex items-center justify-center text-xs hover:bg-[#D9A441] hover:text-black transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Left: Product notification + details */}
          <div className="flex items-center space-x-3 w-full sm:w-auto min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#D9A441]/30 to-[#FF9F43]/40 border border-[#D9A441]/60 flex items-center justify-center flex-shrink-0 text-[#FF9F43] shadow-[0_0_10px_rgba(255,159,67,0.35)]">
              <Check className="w-5 h-5 text-[#F3E7C4] stroke-[3] stroke-linecap-round stroke-linejoin-round" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-[#F6F1E8] truncate">
                  {notificationDish} added to cart
                </span>
                {notificationQty > 1 && (
                  <span className="text-[11px] font-semibold text-[#FF9F43] bg-[#221B12] px-2 py-0.5 rounded-full border border-[#D9A441]/30 flex-shrink-0">
                    ×{notificationQty}
                  </span>
                )}
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
              onClick={() => {
                setIsDrawerOpen(true);
                dismissNotification();
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#D9A441] hover:text-[#FF9F43] bg-[#1C1813] border border-[#D9A441]/40 hover:border-[#D9A441] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Cart</span>
            </button>

            <Link
              href="/checkout"
              onClick={dismissNotification}
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
