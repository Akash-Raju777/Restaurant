'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { apiRequest, getSession } from '@/lib/api';
import { ShoppingBag, Clock, CheckCircle2, XCircle, ChevronRight, Eye, RefreshCw, X, AlertTriangle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelError, setCancelError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/orders');
      setOrders(data || []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (orderNumber: string) => {
    setCancelError('');
    try {
      await apiRequest(`/orders/${orderNumber}/cancel`, { method: 'POST' });
      await loadOrders();
      if (selectedOrder?.orderNumber === orderNumber) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      setCancelError(err.message || 'Could not cancel order.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') {
      return ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(order.orderStatus);
    }
    if (filter === 'COMPLETED') {
      return order.orderStatus === 'DELIVERED';
    }
    if (filter === 'CANCELLED') {
      return order.orderStatus === 'CANCELLED';
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-600/50 text-emerald-300">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-950/80 border border-rose-600/50 text-rose-300">
            Cancelled
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-950/80 border border-blue-600/50 text-blue-300">
            Out for Delivery
          </span>
        );
      case 'PREPARING':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-600/50 text-[#FF9F43]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#F6F1E8]">
                My Orders
              </h1>
              <p className="text-xs text-[#AAA39A] mt-1">
                Real-time tracking and purchase history of your gourmet dining orders.
              </p>
            </div>

            <button
              onClick={loadOrders}
              className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold bg-[#16130F] border border-[#262018] text-[#AAA39A] hover:text-[#F6F1E8] hover:border-[#D9A441] transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Tabs matching reference UI */}
          <div className="flex items-center space-x-2 border-b border-[#201B14] pb-4">
            {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  filter === tab
                    ? 'bg-[#D9A441] text-black shadow-md'
                    : 'bg-[#14120E] text-[#888] hover:text-[#CCC] border border-[#221D16]'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-[#111111] border border-[#221D16] animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-[#111111] border border-[#221D16] rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#181511] border border-[#262018] flex items-center justify-center mx-auto text-[#D9A441]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">No Orders Found</h3>
              <p className="text-xs text-[#AAA39A] max-w-sm mx-auto">
                {filter === 'ALL'
                  ? "You haven't placed any culinary orders yet. Explore our signature dishes and savor the experience."
                  : `You have no ${filter.toLowerCase()} orders at present.`}
              </p>
              <Link
                href="/menu"
                className="inline-block px-6 py-2.5 rounded-xl text-xs font-bold text-black orange-gradient-btn"
              >
                Browse Our Menu
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const itemSummary =
                  order.items && order.items.length > 0
                    ? order.items.map((i: any) => `${i.itemName} (${i.quantity})`).join(', ')
                    : 'Artisanal dishes';

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
                    className="bg-[#111111] border border-[#221D16] hover:border-[#D9A441]/40 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all shadow-md"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-[#262018]">
                        <Image
                          src="/images/food/butter-chicken.png"
                          alt="Order Thumbnail"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-[#D9A441]">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[11px] text-[#666]">• {formattedDate}</span>
                        </div>
                        <h3 className="text-sm font-medium text-[#F6F1E8] line-clamp-1 max-w-md">
                          {itemSummary}
                        </h3>
                        <div className="text-xs text-[#888]">
                          Mode: <span className="text-[#AAA] font-semibold">{order.paymentMethod}</span> ({order.paymentStatus})
                        </div>
                      </div>
                    </div>

                    {/* Right: Total, Status Pill, Action */}
                    <div className="flex items-center justify-between md:justify-end space-x-6 border-t md:border-t-0 pt-3 md:pt-0 border-[#1C1813]">
                      <div className="text-left md:text-right">
                        <div className="text-base sm:text-lg font-bold text-[#FF9F43]">
                          ₹{order.totalAmount}
                        </div>
                        <div className="text-[10px] text-[#888]">{order.items?.length || 1} item(s)</div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusBadge(order.orderStatus)}

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-xs font-semibold text-[#AAA39A] hover:text-[#F6F1E8] bg-[#181511] border border-[#28221A] hover:border-[#D9A441] rounded-xl transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#201B14]">
              <div>
                <span className="text-[11px] font-bold text-[#D9A441] uppercase tracking-wider">
                  Order Details
                </span>
                <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-[#888] hover:text-[#FFF] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-xs text-rose-300 rounded-xl">
                {cancelError}
              </div>
            )}

            {/* Live Progress Stepper */}
            <div className="p-4 rounded-2xl bg-[#16130F] border border-[#262018] space-y-2">
              <span className="text-[11px] font-semibold text-[#AAA39A] uppercase tracking-wider block">
                Order Status: <strong className="text-[#FF9F43]">{selectedOrder.orderStatus}</strong>
              </span>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {['PLACED', 'CONFIRMED', 'PREPARING', 'DELIVERED'].map((step, idx) => {
                  const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                  const currentIndex = statuses.indexOf(selectedOrder.orderStatus);
                  const stepIndex = statuses.indexOf(step);
                  const isDone = currentIndex >= stepIndex && selectedOrder.orderStatus !== 'CANCELLED';

                  return (
                    <div key={step} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          isDone ? 'bg-[#FF9F43]' : 'bg-[#262018]'
                        }`}
                      />
                      <span className="text-[9px] text-[#777] block truncate capitalize">
                        {step.toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D9A441]">
                Items Ordered
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between items-center text-xs bg-[#16130F] p-2.5 rounded-xl border border-[#221D16]">
                    <div>
                      <span className="font-semibold text-[#F6F1E8]">{it.itemName}</span>
                      <span className="text-[#888] ml-2">x{it.quantity}</span>
                      {it.customizationNotes && (
                        <span className="text-[10px] text-[#D9A441] block">{it.customizationNotes}</span>
                      )}
                    </div>
                    <span className="font-bold text-[#FF9F43]">₹{it.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="space-y-1 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D9A441]">
                Delivery Destination
              </h4>
              <p className="text-[#AAA39A] bg-[#16130F] p-3 rounded-xl border border-[#221D16] leading-relaxed">
                {selectedOrder.deliveryAddress}
              </p>
            </div>

            {/* Total and Cancel Option */}
            <div className="pt-3 border-t border-[#201B14] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#888] block">Total Amount</span>
                <span className="text-xl font-bold text-[#FF9F43]">₹{selectedOrder.totalAmount}</span>
              </div>

              {['PLACED', 'CONFIRMED'].includes(selectedOrder.orderStatus) && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.orderNumber)}
                  className="px-4 py-2 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold hover:bg-rose-900 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
