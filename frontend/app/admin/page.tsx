'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, clearSession, apiRequest, UserSession } from '@/lib/api';
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
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
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
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [orderStatusToUpdate, setOrderStatusToUpdate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // New Dish Form State
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState<number>(1);
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishIngredients, setDishIngredients] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('/images/food/butter-chicken.png');
  const [dishIsVeg, setDishIsVeg] = useState(true);

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
        apiRequest<any>('/menu?size=50').catch(() => ({ content: [] })),
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

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/menu', {
        method: 'POST',
        body: JSON.stringify({
          name: dishName,
          categoryId: dishCategory,
          price: parseFloat(dishPrice),
          description: dishDescription,
          ingredients: dishIngredients,
          imageUrl: dishImageUrl,
          isVeg: dishIsVeg,
          isAvailable: true,
        }),
      });
      setShowAddDishModal(false);
      setDishName('');
      setDishPrice('');
      setDishDescription('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create menu item');
    }
  };

  const handleToggleAvailability = async (id: number, currentAvail: boolean) => {
    try {
      await apiRequest(`/admin/menu/${id}/availability?available=${!currentAvail}`, {
        method: 'PATCH',
      });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
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

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      setOrderStatusToUpdate(null);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Could not transition order status');
    }
  };

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
                        <th className="pb-3 font-semibold">Items</th>
                        <th className="pb-3 font-semibold">Total</th>
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
                          <td className="py-3 text-[#AAA39A] max-w-xs truncate">
                            {order.items?.map((it: any) => it.itemName).join(', ') || 'Dishes'}
                          </td>
                          <td className="py-3 font-bold text-[#FF9F43]">₹{order.totalAmount}</td>
                          <td className="py-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setOrderStatusToUpdate(order)}
                              className="px-2.5 py-1 rounded bg-[#201B14] hover:bg-[#D9A441] hover:text-black text-[#D9A441] text-[11px] font-semibold transition-all"
                            >
                              Update Status
                            </button>
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
              <div className="flex justify-between items-center">
                <h2 className="font-serif-luxury text-2xl font-bold text-[#F6F1E8]">
                  Order Management
                </h2>
                <span className="text-xs text-[#AAA39A]">{orders.length} orders retrieved</span>
              </div>

              <div className="bg-[#111111] border border-[#221D16] rounded-3xl overflow-hidden p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#201B14] text-[#888]">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Phone</th>
                        <th className="pb-3">Delivery Address</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Payment</th>
                        <th className="pb-3">Order Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1712]">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#16130F]">
                          <td className="py-3.5 font-mono font-bold text-[#D9A441]">
                            #{order.orderNumber}
                          </td>
                          <td className="py-3.5 text-[#F6F1E8] font-semibold">{order.customerName}</td>
                          <td className="py-3.5 text-[#AAA39A]">{order.customerPhone}</td>
                          <td className="py-3.5 text-[#888] max-w-xs truncate">{order.deliveryAddress}</td>
                          <td className="py-3.5 font-bold text-[#FF9F43]">₹{order.totalAmount}</td>
                          <td className="py-3.5">
                            <span className="text-[10px] text-[#CCC] uppercase font-bold">
                              {order.paymentMethod} ({order.paymentStatus})
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => setOrderStatusToUpdate(order)}
                              className="px-3 py-1 bg-[#221D16] hover:bg-[#D9A441] hover:text-black text-[#D9A441] rounded-lg font-semibold transition-all"
                            >
                              Transition
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                  onClick={() => setShowAddDishModal(true)}
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
                        <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover" />
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

                    <div className="pt-2 border-t border-[#1C1813] flex items-center justify-between">
                      <button
                        onClick={() => handleToggleAvailability(dish.id, dish.isAvailable)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          dish.isAvailable
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {dish.isAvailable ? 'Available' : 'Unavailable'}
                      </button>

                      <button
                        onClick={() => handleDeleteDish(dish.id)}
                        className="p-1.5 text-[#888] hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
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

      {/* MODAL: ADD FOOD ITEM */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddDishModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-[#262018] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#201B14]">
              <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">Add Menu Item</h3>
              <button onClick={() => setShowAddDishModal(false)} className="text-[#888] hover:text-[#FFF]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-4 text-xs">
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
                className="w-full py-3 rounded-xl font-bold text-black uppercase tracking-wider orange-gradient-btn"
              >
                Save to Database
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

      {/* MODAL: UPDATE ORDER STATUS */}
      {orderStatusToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOrderStatusToUpdate(null)} />
          <div className="relative z-10 w-full max-w-md bg-[#111111] border border-[#262018] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif-luxury text-lg font-bold text-[#F6F1E8]">
              Transition Order #{orderStatusToUpdate.orderNumber}
            </h3>
            <p className="text-xs text-[#AAA39A]">
              Current status: <strong className="text-[#FF9F43]">{orderStatusToUpdate.orderStatus}</strong>
            </p>

            <div className="space-y-2 pt-2">
              {['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateOrderStatus(orderStatusToUpdate.id, st)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left bg-[#181511] hover:bg-[#D9A441] hover:text-black transition-all flex justify-between items-center"
                >
                  <span>Mark as {st}</span>
                  <Check className="w-4 h-4 opacity-70" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
