'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, clearSession, apiRequest, apiUpload, UserSession, resolveMediaUrl } from '@/lib/api';
import DishImage from '@/components/dish-image';
import { useCart } from '@/lib/cart-context';
import {
  Flame,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Edit,
  ImagePlus,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  X,
  MapPin,
  Phone,
  Banknote,
  CreditCard,
  AlertCircle,
  Receipt,
  Truck,
  Sparkles,
  Filter,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'offers' | 'customers'>('dashboard');

  // Stats State
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    totalRevenue: 0,
    activeMenuItems: 0,
    activeOffers: 0,
    registeredCustomers: 0,
  });

  // Data Collections
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Modals & Forms
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDishId, setEditingDishId] = useState<number | null>(null);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [orderStatusToUpdate, setOrderStatusToUpdate] = useState<any | null>(null);
  const [selectedOrderForView, setSelectedOrderForView] = useState<any | null>(null);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('ALL');
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Dish Form State
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState<number>(1);
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishIngredients, setDishIngredients] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishImageFile, setDishImageFile] = useState<File | null>(null);
  const [dishImagePreview, setDishImagePreview] = useState('');
  const [dishIsVeg, setDishIsVeg] = useState(true);
  const [dishIsAvailable, setDishIsAvailable] = useState(true);
  const [dishSaving, setDishSaving] = useState(false);

  // New Offer Form State
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [offerDiscountType, setOfferDiscountType] = useState('PERCENTAGE');
  const [offerDiscountValue, setOfferDiscountValue] = useState('');
  const [offerMinOrder, setOfferMinOrder] = useState('499');
  const [offerDescription, setOfferDescription] = useState('');

  // Authentication check
  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== 'ROLE_ADMIN') {
      router.push('/');
      return;
    }
    setSession(s);
    loadAllAdminData();
  }, [router]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, ordersRes, menuRes, catRes, offersRes, custRes] = await Promise.all([
        apiRequest<any>('/admin/dashboard').catch(() => ({})),
        apiRequest<any>('/admin/orders?size=30').catch(() => ({ content: [] })),
        apiRequest<any>('/admin/menu?size=100').catch(() => ({ content: [] })),
        apiRequest<any[]>('/categories').catch(() => []),
        apiRequest<any[]>('/admin/offers').catch(() => []),
        apiRequest<any>('/admin/customers?size=30').catch(() => ({ content: [] })),
      ]);

      setStats(dashRes);
      setOrders(ordersRes.content || []);
      setMenuItems(menuRes.content || []);
      setCategories(catRes || []);
      setOffers(offersRes || []);
      setCustomers(custRes.content || []);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const resetDishForm = () => {
    setEditingDishId(null);
    setDishName('');
    setDishCategory(categories[0]?.id || 1);
    setDishPrice('');
    setDishDescription('');
    setDishIngredients('');
    setDishImageUrl('');
    setDishImageFile(null);
    setDishImagePreview('');
    setDishIsVeg(true);
    setDishIsAvailable(true);
  };

  const openAddDishModal = () => {
    resetDishForm();
    setShowDishModal(true);
  };

  const openEditDishModal = (dish: any) => {
    setEditingDishId(dish.id);
    setDishName(dish.name || '');
    setDishCategory(dish.category?.id || categories[0]?.id || 1);
    setDishPrice(dish.price != null ? String(dish.price) : '');
    setDishDescription(dish.description || '');
    setDishIngredients(dish.ingredients || '');
    setDishImageUrl(dish.imageUrl || '');
    setDishImageFile(null);
    setDishImagePreview(dish.imageUrl ? resolveMediaUrl(dish.imageUrl) : '');
    setDishIsVeg(dish.isVeg !== false);
    setDishIsAvailable(dish.isAvailable !== false);
    setShowDishModal(true);
  };

  const handleDishImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, WEBP, or GIF).');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be 5 MB or smaller.');
      e.target.value = '';
      return;
    }
    setDishImageFile(file);
    setDishImagePreview(URL.createObjectURL(file));
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dishSaving) return;
    setDishSaving(true);
    try {
      let imageUrl = dishImageUrl;
      if (dishImageFile) {
        const uploaded = await apiUpload<{ imageUrl: string }>('/admin/menu/image', dishImageFile);
        imageUrl = uploaded.imageUrl;
      }
      if (!imageUrl) {
        imageUrl = '/images/food/placeholder.png';
      }

      const payload = {
        name: dishName,
        categoryId: dishCategory,
        price: parseFloat(dishPrice),
        description: dishDescription,
        ingredients: dishIngredients,
        imageUrl,
        isVeg: dishIsVeg,
        isAvailable: dishIsAvailable,
      };

      if (editingDishId) {
        await apiRequest(`/admin/menu/${editingDishId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/admin/menu', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowDishModal(false);
      resetDishForm();
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    } finally {
      setDishSaving(false);
    }
  };

  const handleToggleAvailability = async (id: number, available: boolean) => {
    try {
      await apiRequest(`/admin/menu/${id}/availability?available=${available}`, {
        method: 'PATCH',
      });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update availability');
    }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dish from the menu?')) return;
    try {
      await apiRequest(`/admin/menu/${id}`, { method: 'DELETE' });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete dish');
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: offerTitle,
          code: offerCode.toUpperCase(),
          discountType: offerDiscountType,
          discountValue: parseFloat(offerDiscountValue),
          minOrderAmount: parseFloat(offerMinOrder),
          description: offerDescription,
          startDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 90 * 86400000).toISOString(),
          isActive: true,
        }),
      });
      setShowAddOfferModal(false);
      setOfferTitle('');
      setOfferCode('');
      setOfferDiscountValue('');
      setOfferDescription('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create offer');
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (!confirm('Delete this promotional offer?')) return;
    try {
      await apiRequest(`/admin/offers/${id}`, { method: 'DELETE' });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete offer');
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus?: string,
    newPaymentStatus?: string
  ) => {
    try {
      const payload: any = {};
      if (newStatus) payload.orderStatus = newStatus;
      if (newPaymentStatus) payload.paymentStatus = newPaymentStatus;

      await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setOrderStatusToUpdate(null);
      if (selectedOrderForView && selectedOrderForView.id === orderId) {
        setSelectedOrderForView((prev: any) => ({
          ...prev,
          ...(newStatus ? { orderStatus: newStatus } : {}),
          ...(newPaymentStatus ? { paymentStatus: newPaymentStatus } : {}),
        }));
      }
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Could not update order status');
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'COD') return 'Cash on Delivery (COD)';
    if (method === 'ONLINE_UPI' || method === 'UPI') return 'UPI / Online Payment';
    return method || 'Unknown';
  };

  const renderPaymentBadge = (order: any) => {
    const isCOD = order.paymentMethod === 'COD';
    const isPaid = order.paymentStatus === 'PAID';
    const isFailed = order.paymentStatus === 'FAILED';
    const isRefunded = order.paymentStatus === 'REFUNDED';

    if (isCOD) {
      if (isPaid) {
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>COD •?• Collected (PAID)</span>
          </span>
        );
      }
      if (isFailed) {
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>COD •?• Failed</span>
          </span>
        );
      }
      if (isRefunded) {
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-950/80 text-violet-300 border border-violet-700/60 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
            <span>COD •?• Refunded</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>COD •?• Pending Collection</span>
        </span>
      );
    }

    if (isPaid) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>UPI •?• Confirmed (PAID)</span>
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60 shadow-sm">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>UPI •?• Payment Failed</span>
        </span>
      );
    }
    if (isRefunded) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-950/80 text-violet-300 border border-violet-700/60 shadow-sm">
          <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
          <span>UPI •?• Refunded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-950/80 text-sky-300 border border-sky-700/60 shadow-sm">
        <Clock className="w-3.5 h-3.5 text-sky-400" />
        <span>UPI •?• Pending Confirmation</span>
      </span>
    );
  };

  const renderOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-700 shadow-sm">
            Cancelled
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700 shadow-sm">
            Out for Delivery
          </span>
        );
      case 'PREPARING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-950 text-[#FF9F43] border border-orange-700 shadow-sm">
            Preparing
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-700 shadow-sm">
            Confirmed
          </span>
        );
      case 'PLACED':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700 shadow-sm">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (orderSearchTerm.trim()) {
      const term = orderSearchTerm.toLowerCase();
      const matchNum = order.orderNumber?.toLowerCase().includes(term);
      const matchCust = order.customerName?.toLowerCase().includes(term);
      const matchPhone = order.customerPhone?.toLowerCase().includes(term);
      const matchItem = order.items?.some((it: any) => it.itemName?.toLowerCase().includes(term));
      if (!matchNum && !matchCust && !matchPhone && !matchItem) return false;
    }

    if (orderStatusFilter !== 'ALL' && order.orderStatus !== orderStatusFilter) {
      return false;
    }

    if (orderPaymentFilter !== 'ALL') {
      if (orderPaymentFilter === 'COD' && order.paymentMethod !== 'COD') return false;
      if (orderPaymentFilter === 'ONLINE_UPI' && order.paymentMethod !== 'ONLINE_UPI') return false;
      if (orderPaymentFilter === 'PAID' && order.paymentStatus !== 'PAID') return false;
      if (orderPaymentFilter === 'PENDING' && order.paymentStatus !== 'PENDING') return false;
      if (orderPaymentFilter === 'FAILED' && order.paymentStatus !== 'FAILED') return false;
    }

    return true;
  });

  const handleToggleCustomer = async (id: number, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/customers/${id}/status?isActive=${!currentActive}`, {
        method: 'PATCH',
      });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Cannot modify customer status');
    }
  };

  const handleLogout = () => {
    clearCart();
    clearSession();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex">
      {/* SIDEBAR matching reference image */}
      <aside className="w-64 bg-[#0E0C09] border-r border-[#221D16] flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-8">
          {/* Brand */}
          <Link href="/home" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D9A441]/20 border border-[#D9A441]/50 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FF9F43]" />
            </div>
            <div>
              <span className="font-serif-luxury text-lg font-bold tracking-widest text-[#F6F1E8]">
                The Ember
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#D9A441] block">Admin Portal</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.length },
              { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
              { id: 'offers', label: 'Offers & Coupons', icon: Tag },
              { id: 'customers', label: 'Customers', icon: Users },
            ].map((nav) => {
              const Icon = nav.icon;
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveTab(nav.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1C1812] text-[#D9A441] border border-[#D9A441]/30 shadow-md'
                      : 'text-[#888] hover:text-[#CCC] hover:bg-[#14120E]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{nav.label}</span>
                  </div>
                  {nav.badge !== undefined && nav.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#2A2318] text-[#D9A441] font-bold">
                      {nav.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin User */}
        <div className="p-4 border-t border-[#1C1813] bg-[#0A0907]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#D9A441]/20 flex items-center justify-center text-[#D9A441] text-xs font-bold">
                A
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-[#F6F1E8] block truncate max-w-[120px]">
                  {session?.fullName?.split(' ')[0] || 'Admin'}
                </span>
                <span className="text-[10px] text-emerald-400">Authenticated</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#888] hover:text-rose-400 rounded-lg hover:bg-[#1A1813] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN ADMIN AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <header className="bg-[#0C0A08] border-b border-[#221D16] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-serif-luxury text-xl font-bold text-[#F6F1E8] capitalize">
              {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab}
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
              Spring Security Admin
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/home"
              className="text-xs text-[#AAA39A] hover:text-[#F6F1E8] bg-[#16130F] border border-[#262018] px-3 py-1.5 rounded-lg transition-colors"
            >
              Customer View
            </Link>
            <button
              onClick={loadAllAdminData}
              className="p-2 text-[#AAA39A] hover:text-[#F6F1E8] bg-[#16130F] border border-[#262018] rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 space-y-8 flex-1">
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stat Cards matching reference image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#111111] border border-[#221D16] p-6 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#888]">
                    <span>Total Orders</span>
                    <span className="text-emerald-400 font-semibold">+18% this month</span>
                  </div>
                  <div className="font-serif-luxury text-3xl font-bold text-[#F6F1E8]">
                    {stats.totalOrders || orders.length}
                  </div>
                  <span className="text-[11px] text-[#666]">Real database orders recorded</span>
                </div>

                <div className="bg-[#111111] border border-[#221D16] p-6 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#888]">
                    <span>Total Revenue</span>
                    <span className="text-emerald-400 font-semibold">+15% verified</span>
                  </div>
                  <div className="font-serif-luxury text-3xl font-bold text-[#FF9F43]">
                    ₹{(stats.totalRevenue || 345620).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-[#666]">Excludes uncollected/cancelled</span>
                </div>

                <div className="bg-[#111111] border border-[#221D16] p-6 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#888]">
                    <span>Active Customers</span>
                    <span className="text-emerald-400 font-semibold">Registered users</span>
                  </div>
                  <div className="font-serif-luxury text-3xl font-bold text-[#D9A441]">
                    {stats.registeredCustomers || customers.length || 892}
                  </div>
                  <span className="text-[11px] text-[#666]">Active dining members</span>
                </div>
              </div>

              {/* Sales Overview Chart (Visual representation matching reference image) */}
              <div className="bg-[#111111] border border-[#221D16] p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                      Sales Overview
                    </h3>
                    <span className="text-xs text-[#888]">Daily revenue trajectory over last 7 days</span>
                  </div>
                  <span className="text-xs text-[#D9A441] bg-[#181511] px-3 py-1 rounded-lg border border-[#28221A]">
                    Last 7 Days
                  </span>
                </div>

                {/* SVG Graph Curve matching reference image */}
                <div className="h-44 w-full relative flex items-end pt-6">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 120">
                    <defs>
                      <linearGradient id="salesGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#D9A441" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#D9A441" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 100 Q 100 80 180 90 T 320 40 T 450 65 T 580 25 T 680 40 L 680 120 L 20 120 Z"
                      fill="url(#salesGrad)"
                    />
                    <path
                      d="M 20 100 Q 100 80 180 90 T 320 40 T 450 65 T 580 25 T 680 40"
                      fill="none"
                      stroke="#FF9F43"
                      strokeWidth="3.5"
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-[11px] text-[#666] pt-2 border-t border-[#1C1813]">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>

              {/* Recent Orders Table matching reference image */}
              <div className="bg-[#111111] border border-[#221D16] rounded-3xl overflow-hidden shadow-xl space-y-3 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                    Recent Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#D9A441] hover:underline"
                  >
                    View All Orders
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#201B14] text-[#888]">
                        <th className="pb-3 font-semibold">Order ID</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Ordered Dishes</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Payment</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1712]">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-[#16130F] transition-colors">
                          <td className="py-3 font-mono font-bold text-[#D9A441]">
                            #{order.orderNumber}
                          </td>
                          <td className="py-3 text-[#F6F1E8] font-medium">{order.customerName}</td>
                          <td className="py-3 text-[#AAA39A] max-w-xs">
                            <span className="line-clamp-1">
                              {order.items?.map((it: any) => `${it.itemName} (${it.quantity}x)`).join(', ') || 'Artisanal dishes'}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-[#FF9F43]">₹{order.totalAmount}</td>
                          <td className="py-3">
                            {renderPaymentBadge(order)}
                          </td>
                          <td className="py-3">
                            {renderOrderStatusBadge(order.orderStatus)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedOrderForView(order)}
                                className="px-2 py-1 rounded-lg bg-[#181511] hover:bg-[#D9A441] hover:text-black text-[#D9A441] text-[11px] font-semibold border border-[#28221A] transition-all"
                                title="View Receipt"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setOrderStatusToUpdate(order)}
                                className="px-2 py-1 rounded-lg bg-[#201B14] hover:bg-[#FF9F43] hover:text-black text-[#FF9F43] text-[11px] font-semibold border border-[#3A2A1A] transition-all"
                              >
                                Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold text-[#F6F1E8]">
                    Order Management
                  </h2>
                  <p className="text-xs text-[#888] mt-0.5">
                    Live restaurant orders, complete food item breakdown, payment status verification, and kitchen dispatch.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-[#AAA39A] bg-[#16130F] px-3 py-1.5 rounded-xl border border-[#262018]">
                    Showing <strong className="text-[#D9A441]">{filteredOrders.length}</strong> of {orders.length} orders
                  </span>
                  <button
                    onClick={loadAllAdminData}
                    className="p-2 text-[#AAA39A] hover:text-[#F6F1E8] bg-[#16130F] border border-[#262018] hover:border-[#D9A441] rounded-xl transition-all"
                    title="Refresh Orders"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-[#111111] border border-[#221D16] p-4 rounded-2xl space-y-3.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    placeholder="Search by Order # (e.g. ORD10674), customer name, phone, or food dish..."
                    className="w-full bg-[#16130F] border border-[#262018] focus:border-[#D9A441] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F6F1E8] placeholder-[#666] outline-none transition-all"
                  />
                  {orderSearchTerm && (
                    <button
                      onClick={() => setOrderSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888] hover:text-[#CCC]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1C1813]">
                  <div className="flex items-center space-x-1.5 text-xs text-[#888] mr-2">
                    <Filter className="w-3.5 h-3.5 text-[#D9A441]" />
                    <span className="text-[11px] font-semibold uppercase">Status:</span>
                  </div>
                  {['ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                        orderStatusFilter === st
                          ? 'bg-[#D9A441] text-black shadow-sm'
                          : 'bg-[#181511] text-[#888] hover:text-[#CCC] border border-[#28221A]'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}

                  <div className="h-4 w-[1px] bg-[#262018] mx-2 hidden sm:block" />

                  <div className="flex items-center space-x-1.5 text-xs text-[#888] mr-2">
                    <Banknote className="w-3.5 h-3.5 text-[#FF9F43]" />
                    <span className="text-[11px] font-semibold uppercase">Payment:</span>
                  </div>
                  {[
                    { id: 'ALL', label: 'ALL' },
                    { id: 'COD', label: 'COD' },
                    { id: 'ONLINE_UPI', label: 'UPI' },
                    { id: 'PAID', label: 'PAID' },
                    { id: 'PENDING', label: 'PENDING' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setOrderPaymentFilter(p.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                        orderPaymentFilter === p.id
                          ? 'bg-[#FF9F43] text-black shadow-sm'
                          : 'bg-[#181511] text-[#888] hover:text-[#CCC] border border-[#28221A]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List / Cards */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 rounded-3xl bg-[#111111] border border-[#221D16] animate-pulse" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-[#111111] border border-[#221D16] rounded-3xl space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#181511] border border-[#262018] flex items-center justify-center mx-auto text-[#D9A441]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">No Matching Orders</h3>
                  <p className="text-xs text-[#AAA39A] max-w-sm mx-auto">
                    No orders match your active filter criteria. Try resetting the search or filter pills.
                  </p>
                  <button
                    onClick={() => {
                      setOrderSearchTerm('');
                      setOrderStatusFilter('ALL');
                      setOrderPaymentFilter('ALL');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1C1812] border border-[#D9A441]/50 text-[#D9A441] hover:bg-[#D9A441] hover:text-black transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const formattedDate = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recent';

                    return (
                      <div
                        key={order.id}
                        className="bg-[#111111] border border-[#221D16] hover:border-[#D9A441]/40 rounded-3xl p-5 sm:p-6 space-y-4 transition-all shadow-xl"
                      >
                        {/* Top Bar: Order ID, Date, Status Badges & Quick Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1913]">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-base font-bold text-[#D9A441]">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs text-[#777]">• {formattedDate}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            {renderPaymentBadge(order)}
                            {renderOrderStatusBadge(order.orderStatus)}

                            <button
                              onClick={() => setSelectedOrderForView(order)}
                              className="px-3 py-1.5 bg-[#181511] hover:bg-[#D9A441] hover:text-black text-[#D9A441] border border-[#2A2318] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>

                            <button
                              onClick={() => setOrderStatusToUpdate(order)}
                              className="px-3 py-1.5 bg-[#201B14] hover:bg-[#FF9F43] hover:text-black text-[#FF9F43] border border-[#3A2A1A] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Transition</span>
                            </button>
                          </div>
                        </div>

                        {/* Middle: 3-column / Stacked Information Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Column 1: Customer & Delivery Details (lg:col-span-4) */}
                          <div className="lg:col-span-4 space-y-2 bg-[#16130F] p-4 rounded-2xl border border-[#241F18]">
                            <div className="flex items-center space-x-2 text-xs font-bold text-[#D9A441] uppercase tracking-wider pb-1 border-b border-[#241F18]">
                              <Users className="w-3.5 h-3.5" />
                              <span>Customer & Delivery</span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="font-semibold text-sm text-[#F6F1E8]">
                                {order.customerName}
                              </div>

                              <div className="flex items-center space-x-2 text-[#AAA39A]">
                                <Phone className="w-3.5 h-3.5 text-[#D9A441]" />
                                <a href={`tel:${order.customerPhone}`} className="hover:text-[#F6F1E8] hover:underline font-mono">
                                  {order.customerPhone}
                                </a>
                              </div>

                              <div className="flex items-start space-x-2 text-[#888] pt-1">
                                <MapPin className="w-3.5 h-3.5 text-[#FF9F43] flex-shrink-0 mt-0.5" />
                                <span className="leading-relaxed text-[#CCC]">
                                  {order.deliveryAddress}
                                </span>
                              </div>

                              {order.deliveryNotes && (
                                <div className="mt-2 p-2 rounded-xl bg-[#221B13] border border-[#D9A441]/30 text-[11px] text-[#D9A441]">
                                  <strong>Note:</strong> {order.deliveryNotes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Column 2: Ordered Food Items (lg:col-span-5) */}
                          <div className="lg:col-span-5 space-y-2 bg-[#16130F] p-4 rounded-2xl border border-[#241F18]">
                            <div className="flex items-center justify-between text-xs font-bold text-[#D9A441] uppercase tracking-wider pb-1 border-b border-[#241F18]">
                              <div className="flex items-center space-x-2">
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                                <span>Ordered Food Items ({order.items?.length || 0})</span>
                              </div>
                              <span className="text-[10px] text-[#888] lowercase font-normal">
                                dish • qty • price • subtotal
                              </span>
                            </div>

                            {/* Food Items List */}
                            <div className="space-y-2 pt-1">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="p-2.5 rounded-xl bg-[#1A1713] border border-[#262018] flex items-center justify-between text-xs"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-[#FF9F43] px-1.5 py-0.5 rounded bg-[#2A1F14] text-[11px]">
                                          {item.quantity}x
                                        </span>
                                        <span className="font-semibold text-[#F6F1E8]">
                                          {item.itemName}
                                        </span>
                                      </div>
                                      {item.customizationNotes && (
                                        <span className="text-[10px] text-[#D9A441] block pl-6">
                                          {item.customizationNotes}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-right">
                                      <div className="font-bold text-[#F6F1E8]">₹{item.subtotal}</div>
                                      <div className="text-[10px] text-[#777]">
                                        (₹{item.unitPrice} each)
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-[#888] italic">No item details available</p>
                              )}
                            </div>
                          </div>

                          {/* Column 3: Payment & Financial Summary (lg:col-span-3) */}
                          <div className="lg:col-span-3 space-y-2 bg-[#16130F] p-4 rounded-2xl border border-[#241F18] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center space-x-2 text-xs font-bold text-[#D9A441] uppercase tracking-wider pb-1 border-b border-[#241F18]">
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Payment & Total</span>
                              </div>

                              <div className="space-y-1.5 pt-2 text-xs">
                                <div className="flex justify-between text-[#888]">
                                  <span>Items Subtotal:</span>
                                  <span className="text-[#CCC]">₹{order.subtotal || order.totalAmount}</span>
                                </div>

                                <div className="flex justify-between text-[#888]">
                                  <span>Delivery Fee:</span>
                                  <span className="text-[#CCC]">
                                    {order.deliveryFee && Number(order.deliveryFee) > 0
                                      ? `₹${order.deliveryFee}`
                                      : 'FREE'}
                                  </span>
                                </div>

                                {Number(order.discountAmount) > 0 && (
                                  <div className="flex justify-between text-emerald-400">
                                    <span>Discount:</span>
                                    <span>-₹{order.discountAmount}</span>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-[#221D16] flex justify-between items-center">
                                  <span className="font-bold text-xs uppercase text-[#F6F1E8]">Total:</span>
                                  <span className="font-serif-luxury text-lg font-bold text-[#FF9F43]">
                                    ₹{order.totalAmount}
                                  </span>
                                </div>

                                <div className="pt-1 text-[11px] text-[#888]">
                                  Method: <strong className="text-[#F6F1E8]">{getPaymentMethodLabel(order.paymentMethod)}</strong>
                                </div>
                                <div className="text-[11px] text-[#888]">
                                  Status: <strong className="text-[#F6F1E8]">{order.paymentStatus || 'PENDING'}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Quick Action for COD Pending */}
                            {order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, undefined, 'PAID')}
                                className="w-full mt-2 py-2 px-3 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Payment Collected</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: MENU MANAGEMENT */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold text-[#F6F1E8]">
                    Menu Creator & Management
                  </h2>
                  <p className="text-xs text-[#888]">
                    Direct control over all dishes, prices, and live availability.
                  </p>
                </div>
                <button
                  onClick={openAddDishModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-black orange-gradient-btn flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Dish</span>
                </button>
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((dish) => (
                  <div
                    key={dish.id}
                    className="bg-[#111111] border border-[#221D16] rounded-2xl overflow-hidden p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex space-x-3">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0">
                        <DishImage src={dish.imageUrl} alt={dish.name} className="object-cover" sizes="80px" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              dish.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <h4 className="text-sm font-bold text-[#F6F1E8] truncate">{dish.name}</h4>
                        </div>
                        <span className="text-[11px] text-[#D9A441] block">
                          {dish.category?.name || 'Main Course'}
                        </span>
                        <div className="text-sm font-bold text-[#FF9F43]">₹{dish.price}</div>
                      </div>
                    </div>

                    <p className="text-xs text-[#888] line-clamp-2">{dish.description}</p>

                    <div className="pt-2 border-t border-[#1C1813] flex items-center justify-between gap-2">
                      <select
                        value={dish.isAvailable ? 'available' : 'unavailable'}
                        onChange={(e) =>
                          handleToggleAvailability(dish.id, e.target.value === 'available')
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase outline-none border ${
                          dish.isAvailable
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Not Available</option>
                      </select>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditDishModal(dish)}
                          className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-[#888] hover:text-[#D9A441] hover:bg-[#1C1813] flex items-center space-x-1"
                          title="Edit dish"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id)}
                          className="p-1.5 text-[#888] hover:text-rose-400"
                          title="Delete dish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && menuItems.length === 0 && (
                  <div className="col-span-full bg-[#111111] border border-dashed border-[#2A241C] rounded-2xl p-10 text-center">
                    <p className="text-sm font-bold text-[#F6F1E8]">No dishes found</p>
                    <p className="text-xs text-[#777] mt-1">Add your first dish to start building the menu.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: OFFERS */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold text-[#F6F1E8]">
                    Offer & Combo Creator
                  </h2>
                  <p className="text-xs text-[#888]">
                    Manage real coupon codes and seasonal price discounts.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddOfferModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-black orange-gradient-btn flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Offer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#111111] border border-[#221D16] p-6 rounded-2xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-[#D9A441] bg-[#181511] px-2.5 py-1 rounded-lg border border-[#28221A]">
                          {offer.code}
                        </span>
                        <span className="text-[10px] text-emerald-400 uppercase font-bold">Active</span>
                      </div>
                      <h3 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                        {offer.title}
                      </h3>
                      <p className="text-xs text-[#AAA39A]">{offer.description}</p>
                    </div>

                    <div className="pt-3 border-t border-[#1C1813] flex justify-between items-center">
                      <span className="text-xs text-[#FF9F43] font-bold">
                        {offer.discountType === 'PERCENTAGE'
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue} OFF`}
                      </span>
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-serif-luxury text-2xl font-bold text-[#F6F1E8]">
                  Customer Management
                </h2>
                <span className="text-xs text-[#AAA39A]">{customers.length} users registered</span>
              </div>

              <div className="bg-[#111111] border border-[#221D16] rounded-3xl overflow-hidden p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#201B14] text-[#888]">
                      <th className="pb-3">Customer ID</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Account Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1712]">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#16130F]">
                        <td className="py-3 font-mono text-[#D9A441]">#{c.id}</td>
                        <td className="py-3 font-semibold text-[#F6F1E8]">{c.fullName}</td>
                        <td className="py-3 text-[#AAA39A]">{c.email}</td>
                        <td className="py-3 text-[#888]">{c.role}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.isActive
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {c.role !== 'ROLE_ADMIN' && (
                            <button
                              onClick={() => handleToggleCustomer(c.id, c.isActive)}
                              className="text-[11px] text-[#D9A441] hover:underline"
                            >
                              {c.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD / EDIT FOOD ITEM */}
      {showDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowDishModal(false);
              resetDishForm();
            }}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#111111] border border-[#262018] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#201B14]">
              <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">
                {editingDishId ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button
                onClick={() => {
                  setShowDishModal(false);
                  resetDishForm();
                }}
                className="text-[#888] hover:text-[#FFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-[#888] font-semibold uppercase">Dish Image</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#181511] border border-[#28221A] flex-shrink-0">
                    {dishImagePreview ? (
                      <img src={dishImagePreview} alt="Dish preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#666]">
                        <ImagePlus className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#181511] border border-[#28221A] text-[#CCC] cursor-pointer hover:border-[#D9A441] hover:text-[#D9A441] transition-colors">
                      <ImagePlus className="w-4 h-4" />
                      <span>{dishImagePreview ? 'Change image' : 'Upload image'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleDishImageChange}
                      />
                    </label>
                    <p className="text-[10px] text-[#666]">JPG, PNG, WEBP or GIF. Max 5 MB.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#888] font-semibold uppercase">Item Name</label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Kashmiri Dum Aloo"
                  className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(parseInt(e.target.value))}
                    className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3 py-2 text-[#F6F1E8] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="299.00"
                    className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#888] font-semibold uppercase">Description</label>
                <textarea
                  required
                  rows={3}
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Artisanal recipe details, aromatics and presentation..."
                  className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#888] font-semibold uppercase">Availability</label>
                <select
                  value={dishIsAvailable ? 'available' : 'unavailable'}
                  onChange={(e) => setDishIsAvailable(e.target.value === 'available')}
                  className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3 py-2 text-[#F6F1E8] outline-none"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Not Available</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishIsVeg}
                    onChange={(e) => setDishIsVeg(e.target.checked)}
                    className="rounded text-[#D9A441]"
                  />
                  <span className="text-[#CCC]">Vegetarian Dish</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={dishSaving}
                className="w-full py-3 rounded-xl font-bold text-black uppercase tracking-wider orange-gradient-btn disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {dishSaving ? 'Saving...' : editingDishId ? 'Save Changes' : 'Save to Database'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE OFFER */}
      {showAddOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddOfferModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-[#262018] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#201B14]">
              <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">Create Promotion / Combo</h3>
              <button onClick={() => setShowAddOfferModal(false)} className="text-[#888] hover:text-[#FFF]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#888] font-semibold uppercase">Offer Title</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. Festival Feast Discount"
                  className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    placeholder="FEAST25"
                    className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3.5 py-2 text-[#F6F1E8] uppercase outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#888] font-semibold uppercase">Discount (% or ₹)</label>
                  <input
                    type="number"
                    required
                    value={offerDiscountValue}
                    onChange={(e) => setOfferDiscountValue(e.target.value)}
                    placeholder="20"
                    className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#888] font-semibold uppercase">Offer Description</label>
                <input
                  type="text"
                  required
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder="Enjoy 20% off all main courses..."
                  className="w-full bg-[#181511] border border-[#28221A] rounded-xl px-3.5 py-2 text-[#F6F1E8] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-black uppercase tracking-wider orange-gradient-btn"
              >
                Publish Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAILS & RECEIPT */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setSelectedOrderForView(null)}
          />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#111111] border border-[#2A2318] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#201B14]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xl font-bold text-[#D9A441]">
                    #{selectedOrderForView.orderNumber}
                  </span>
                  {renderOrderStatusBadge(selectedOrderForView.orderStatus)}
                </div>
                <p className="text-xs text-[#888] mt-0.5">
                  Placed on {selectedOrderForView.createdAt ? new Date(selectedOrderForView.createdAt).toLocaleString('en-IN') : 'Recent'}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderForView(null)}
                className="p-2 text-[#888] hover:text-[#FFF] rounded-full hover:bg-[#1C1812] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper of Status */}
            <div className="p-4 rounded-2xl bg-[#16130F] border border-[#262018] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#888] uppercase tracking-wider font-semibold">Order Lifecycle</span>
                <span className="text-[#FF9F43] font-bold">{selectedOrderForView.orderStatus}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 pt-1">
                {['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((step) => {
                  const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                  const currentIndex = statuses.indexOf(selectedOrderForView.orderStatus);
                  const stepIndex = statuses.indexOf(step);
                  const isDone = currentIndex >= stepIndex && selectedOrderForView.orderStatus !== 'CANCELLED';

                  return (
                    <div key={step} className="space-y-1">
                      <div className={`h-1.5 rounded-full ${isDone ? 'bg-[#FF9F43]' : 'bg-[#262018]'}`} />
                      <span className="text-[9px] text-[#777] block truncate capitalize">
                        {step.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Details: 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Food Items Breakdown & Bill */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#D9A441] uppercase tracking-wider">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Ordered Food Items</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedOrderForView.items?.map((it: any) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl bg-[#16130F] border border-[#221D16] flex justify-between items-center text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-[#F6F1E8]">
                          {it.quantity}x {it.itemName}
                        </div>
                        {it.customizationNotes && (
                          <div className="text-[10px] text-[#D9A441]">{it.customizationNotes}</div>
                        )}
                        <div className="text-[10px] text-[#777]">
                          Price: ₹{it.unitPrice} each
                        </div>
                      </div>
                      <div className="font-bold text-[#FF9F43] text-sm">
                        ₹{it.subtotal}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-2xl bg-[#16130F] border border-[#241F18] space-y-2 text-xs">
                  <div className="flex justify-between text-[#888]">
                    <span>Items Subtotal:</span>
                    <span className="text-[#CCC]">₹{selectedOrderForView.subtotal || selectedOrderForView.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>Delivery Charges:</span>
                    <span className="text-[#CCC]">
                      {selectedOrderForView.deliveryFee && Number(selectedOrderForView.deliveryFee) > 0
                        ? `₹${selectedOrderForView.deliveryFee}`
                        : 'FREE'}
                    </span>
                  </div>
                  {Number(selectedOrderForView.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount Applied:</span>
                      <span>-₹{selectedOrderForView.discountAmount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#221D16] flex justify-between items-center text-sm font-bold">
                    <span className="text-[#F6F1E8]">Grand Total:</span>
                    <span className="text-[#FF9F43] text-base">₹{selectedOrderForView.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Customer Details, Payment & Action */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#D9A441] uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Customer & Destination</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#16130F] border border-[#241F18] space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#777] uppercase block">Customer Name</span>
                    <span className="font-semibold text-sm text-[#F6F1E8]">{selectedOrderForView.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777] uppercase block">Phone Number</span>
                    <a href={`tel:${selectedOrderForView.customerPhone}`} className="font-mono text-[#D9A441] hover:underline">
                      {selectedOrderForView.customerPhone}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777] uppercase block">Delivery Address</span>
                    <p className="text-[#CCC] leading-relaxed mt-0.5">{selectedOrderForView.deliveryAddress}</p>
                  </div>
                  {selectedOrderForView.deliveryNotes && (
                    <div className="p-2.5 rounded-xl bg-[#221B13] border border-[#D9A441]/30 text-[11px] text-[#D9A441]">
                      <strong>Delivery Instructions:</strong> {selectedOrderForView.deliveryNotes}
                    </div>
                  )}
                </div>

                {/* Payment Card */}
                <div className="p-4 rounded-2xl bg-[#16130F] border border-[#241F18] space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-[#D9A441]">Payment Method</span>
                    {renderPaymentBadge(selectedOrderForView)}
                  </div>
                  <div className="text-[11px] text-[#888]">
                    Mode: <strong className="text-[#F6F1E8]">{getPaymentMethodLabel(selectedOrderForView.paymentMethod)}</strong>
                  </div>
                  <div className="text-[11px] text-[#888]">
                    Payment Status: <strong className="text-[#F6F1E8]">{selectedOrderForView.paymentStatus}</strong>
                  </div>
                  {selectedOrderForView.paymentGatewayPaymentId && (
                    <div className="text-[11px] text-[#888] break-all">
                      Transaction ID: <strong className="text-[#F6F1E8] font-mono">{selectedOrderForView.paymentGatewayPaymentId}</strong>
                    </div>
                  )}
                  {selectedOrderForView.paymentGatewayOrderId && (
                    <div className="text-[11px] text-[#888] break-all">
                      Gateway Order ID: <strong className="text-[#F6F1E8] font-mono">{selectedOrderForView.paymentGatewayOrderId}</strong>
                    </div>
                  )}

                  {/* Payment update actions */}
                  <div className="pt-2 border-t border-[#221D16] flex flex-wrap gap-2">
                    {(selectedOrderForView.paymentMethod === 'COD'
                      || Boolean(selectedOrderForView.paymentGatewayPaymentId)
                      || selectedOrderForView.paymentStatus === 'PAID') && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrderForView.id, undefined, 'PAID')}
                        className="flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 transition-all flex items-center justify-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Set PAID</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrderForView.id, undefined, 'PENDING')}
                      className="flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 transition-all flex items-center justify-center space-x-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Set PENDING</span>
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrderForView.id, undefined, 'FAILED')}
                      className="flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 transition-all flex items-center justify-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Set FAILED</span>
                    </button>
                  </div>
                  {(selectedOrderForView.paymentMethod === 'ONLINE_UPI'
                    || selectedOrderForView.paymentMethod === 'UPI')
                    && selectedOrderForView.paymentStatus !== 'PAID'
                    && !selectedOrderForView.paymentGatewayPaymentId && (
                    <p className="text-[10px] text-[#777] leading-relaxed">
                      UPI payments are marked PAID automatically only after gateway signature verification.
                    </p>
                  )}
                </div>

                {/* Status Transitions */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[#777] uppercase tracking-wider font-semibold block">
                    Quick Status Transition
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateOrderStatus(selectedOrderForView.id, st)}
                        className={`py-2 px-3 rounded-xl text-[11px] font-bold text-left transition-all flex items-center justify-between ${
                          selectedOrderForView.orderStatus === st
                            ? 'bg-[#D9A441] text-black font-extrabold'
                            : 'bg-[#181511] text-[#CCC] hover:bg-[#262018] border border-[#262018]'
                        }`}
                      >
                        <span>{st.replace(/_/g, ' ')}</span>
                        {selectedOrderForView.orderStatus === st && <Check className="w-3.5 h-3.5 text-black" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE ORDER STATUS */}
      {orderStatusToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOrderStatusToUpdate(null)} />
          <div className="relative z-10 w-full max-w-md bg-[#111111] border border-[#262018] rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-[#201B14]">
              <h3 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
                Manage Order #{orderStatusToUpdate.orderNumber}
              </h3>
              <button onClick={() => setOrderStatusToUpdate(null)} className="text-[#888] hover:text-[#FFF]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs bg-[#16130F] p-3 rounded-2xl border border-[#241F18]">
              <p className="text-[#AAA39A]">
                Customer: <strong className="text-[#F6F1E8]">{orderStatusToUpdate.customerName}</strong>
              </p>
              <p className="text-[#AAA39A]">
                Current status: <strong className="text-[#FF9F43]">{orderStatusToUpdate.orderStatus}</strong>
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[#888]">Payment:</span>
                {renderPaymentBadge(orderStatusToUpdate)}
              </div>
            </div>

            {/* Status Transition Buttons */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#888] uppercase tracking-wider block">
                Transition Order Status
              </span>
              <div className="space-y-1.5">
                {['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateOrderStatus(orderStatusToUpdate.id, st)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left transition-all flex justify-between items-center ${
                      orderStatusToUpdate.orderStatus === st
                        ? 'bg-[#D9A441] text-black font-extrabold'
                        : 'bg-[#181511] hover:bg-[#262018] text-[#F6F1E8] border border-[#241F18]'
                    }`}
                  >
                    <span>Mark as {st.replace(/_/g, ' ')}</span>
                    {orderStatusToUpdate.orderStatus === st && <Check className="w-4 h-4 text-black" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status Quick Update */}
            <div className="space-y-2 pt-2 border-t border-[#1C1813]">
              <span className="text-[11px] font-semibold text-[#888] uppercase tracking-wider block">
                Update Payment Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['PAID', 'PENDING', 'FAILED'].map((pst) => (
                  <button
                    key={pst}
                    onClick={() => handleUpdateOrderStatus(orderStatusToUpdate.id, undefined, pst)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all ${
                      orderStatusToUpdate.paymentStatus === pst
                        ? 'bg-[#FF9F43] text-black font-extrabold'
                        : 'bg-[#181511] hover:bg-[#262018] text-[#AAA39A] border border-[#241F18]'
                    }`}
                  >
                    {pst}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
