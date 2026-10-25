'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import FoodCard from '@/components/food-card';
import FoodModal from '@/components/food-modal';
import { apiRequest } from '@/lib/api';
import { Search, SlidersHorizontal, Utensils, Sparkles, X } from 'lucide-react';

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper to clear search bar input and reset search query state
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, []);

  // Automatically clear search bar and reset search query whenever leaving Menu page or navigating away
  useEffect(() => {
    // 1. Intercept clicks on links that navigate away from /menu (Navbar, footer, checkout, etc.)
    const handleNavigationClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // If clicking any navigation link (leave page or click Menu to refresh)
      if (href && !href.startsWith('#')) {
        clearSearch();
      }
    };

    // 2. Intercept history pushState / replaceState (Next.js client-side router navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      clearSearch();
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      clearSearch();
      return originalReplaceState.apply(this, args);
    };

    // 3. Reset on browser history navigation (back/forward) and bfcache page restores
    const handlePopState = () => clearSearch();
    const handlePageShow = () => clearSearch();
    const handlePageHide = () => clearSearch();
    const handleBeforeUnload = () => clearSearch();

    document.addEventListener('click', handleNavigationClick, { capture: true });
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup on unmount (when user navigates to another page)
      clearSearch();
      document.removeEventListener('click', handleNavigationClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [clearSearch]);

  // Load Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await apiRequest<any[]>('/categories');
        setCategories(catRes);
      } catch (e) {
        console.error('Error loading categories', e);
      }
    }
    loadCategories();
  }, []);

  // Fetch menu dishes whenever filters change
  useEffect(() => {
    async function loadDishes() {
      setLoading(true);
      try {
        let endpoint = `/menu?sortBy=${sortBy}&size=50`;

        if (selectedCategory !== 'all') {
          const cat = categories.find((c) => c.slug === selectedCategory);
          if (cat) endpoint += `&categoryId=${cat.id}`;
        }

        if (vegFilter === 'veg') endpoint += '&isVeg=true';
        if (vegFilter === 'non-veg') endpoint += '&isVeg=false';
        if (searchTerm.trim()) endpoint += `&search=${encodeURIComponent(searchTerm.trim())}`;

        const res = await apiRequest<{ content: any[] }>(endpoint);
        setDishes(res.content || []);
      } catch (e) {
        console.error('Error fetching menu', e);
      } finally {
        setLoading(false);
      }
    }

    loadDishes();
  }, [selectedCategory, vegFilter, searchTerm, sortBy, categories]);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F1E8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Header matching reference image */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#D9A441] uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gastronomic Delights</span>
            </div>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl font-bold tracking-tight text-[#F6F1E8]">
              Our Menu
            </h1>
            <p className="text-sm text-[#AAA39A] font-light">
              Fresh ingredients. Bold flavors. Unforgettable taste.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111111] p-4 rounded-2xl border border-[#221D16]">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#777] absolute left-3.5 top-3.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search butter chicken, tikka, biryani..."
                autoComplete="off"
                className="w-full bg-[#181511] border border-[#28221A] focus:border-[#D9A441] rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#F6F1E8] outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-[#777] hover:text-[#F6F1E8] transition-colors p-0.5 rounded-full hover:bg-[#25201A]"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Veg / Non-Veg Diet Toggle */}
            <div className="flex items-center space-x-1.5 bg-[#181511] p-1 rounded-xl border border-[#28221A]">
              <button
                onClick={() => setVegFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  vegFilter === 'all'
                    ? 'bg-[#2A2318] text-[#D9A441] border border-[#D9A441]/40'
                    : 'text-[#888] hover:text-[#CCC]'
                }`}
              >
                All Diet
              </button>
              <button
                onClick={() => setVegFilter('veg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  vegFilter === 'veg'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-600/50'
                    : 'text-[#888] hover:text-[#CCC]'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Pure Veg</span>
              </button>
              <button
                onClick={() => setVegFilter('non-veg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  vegFilter === 'non-veg'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-600/50'
                    : 'text-[#888] hover:text-[#CCC]'
                }`}
              >
                <div className="w-2 h-2 rotate-45 bg-rose-500" />
                <span>Non-Veg</span>
              </button>
            </div>

            {/* Sorting */}
            <div className="flex items-center space-x-2 text-xs">
              <SlidersHorizontal className="w-4 h-4 text-[#AAA39A]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#181511] border border-[#28221A] text-[#F6F1E8] rounded-xl px-3 py-2 outline-none focus:border-[#D9A441]"
              >
                <option value="rating">Top Rated</option>
                <option value="price">Price: Low to High</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Category Tabs Pill Bar matching reference image */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase flex-shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#D9A441] text-black font-bold shadow-[0_4px_15px_rgba(217,164,65,0.3)]'
                  : 'bg-[#14120E] text-[#AAA39A] border border-[#221D16] hover:text-[#F6F1E8] hover:border-[#D9A441]/30'
              }`}
            >
              All
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase flex-shrink-0 transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-[#D9A441] text-black font-bold shadow-[0_4px_15px_rgba(217,164,65,0.3)]'
                    : 'bg-[#14120E] text-[#AAA39A] border border-[#221D16] hover:text-[#F6F1E8] hover:border-[#D9A441]/30'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Food Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-[#12100C] border border-[#221D16] animate-pulse" />
              ))}
            </div>
          ) : dishes.length === 0 ? (
            <div className="text-center py-24 space-y-4 bg-[#111111] rounded-3xl border border-[#221D16]">
              <div className="w-14 h-14 rounded-full bg-[#1A1813] border border-[#262018] flex items-center justify-center mx-auto text-[#D9A441]">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="font-serif-luxury text-xl font-bold text-[#F6F1E8]">No Dishes Found</h3>
              <p className="text-xs text-[#AAA39A] max-w-sm mx-auto">
                No items match your selected filter criteria. Try choosing another category or clearing your search term.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setVegFilter('all');
                  clearSearch();
                }}
                className="px-5 py-2 rounded-lg text-xs font-bold text-black orange-gradient-btn"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dishes.map((dish) => (
                <FoodCard
                  key={dish.id}
                  dish={dish}
                  onOpenDetails={(d) => setSelectedDish(d)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Dialog */}
      {selectedDish && (
        <FoodModal
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
          similarDishes={dishes.filter((d) => d.id !== selectedDish.id)}
          onSelectSimilar={(d) => setSelectedDish(d)}
        />
      )}

      <Footer />
    </div>
  );
}
