'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { Star, Heart, Plus, Check } from 'lucide-react';

interface FoodCardProps {
  dish: {
    id: number;
    name: string;
    description?: string;
    price: number;
    discountedPrice?: number;
    isVeg: boolean;
    isAvailable: boolean;
    imageUrl: string;
    rating?: number;
    reviewCount?: number;
    category?: { name: string };
    ingredients?: string;
    spiceLevels?: string;
  };
  onOpenDetails?: (dish: any) => void;
}

export default function FoodCard({ dish, onOpenDetails }: FoodCardProps) {
  const { addItem } = useCart();
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dish.isAvailable) return;
    addItem(dish, 1, 'Medium');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div
      onClick={() => onOpenDetails && onOpenDetails(dish)}
      className="group relative bg-[#111111] rounded-2xl border border-[#221E18] hover:border-[#D9A441]/40 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(217,164,65,0.12)] cursor-pointer flex flex-col h-full"
    >
      {/* Top Media Container */}
      <div className="relative w-full aspect-[4/3] bg-[#111111] overflow-hidden">
        <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform">
          <Image
            src={dish.imageUrl || '/images/food/placeholder.png'}
            alt={dish.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none" />
        </div>
      </div>

        {/* Veg / Non-Veg Badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md border border-[#333] flex items-center space-x-1.5 shadow-md">
          <div
            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
              dish.isVeg ? 'border-emerald-500' : 'border-rose-500'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 ${
                dish.isVeg ? 'rounded-full bg-emerald-500' : 'rotate-45 bg-rose-500'
              }`}
            />
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#DDD]">
            {dish.isVeg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          aria-label="Save dish to favorites"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#AAA39A] hover:text-rose-500 hover:scale-110 transition-all"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Unavailability Overlay */}
        {!dish.isAvailable && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold rounded-full uppercase tracking-wider">
              Sold Out Today
            </span>
          </div>
        )}


      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-[#AAA39A] mb-1">
            <span>{dish.category?.name || 'Chef Specialty'}</span>
            <div className="flex items-center space-x-1 text-[#FFB300]">
              <Star className="w-3.5 h-3.5 fill-[#FFB300]" />
              <span className="font-semibold text-[#F6F1E8]">{dish.rating || 4.8}</span>
              {dish.reviewCount ? (
                <span className="text-[10px] text-[#888]">({dish.reviewCount})</span>
              ) : null}
            </div>
          </div>

          <h3 className="font-serif-luxury text-base font-bold text-[#F6F1E8] group-hover:text-[#D9A441] transition-colors line-clamp-1">
            {dish.name}
          </h3>

          <p className="text-xs text-[#999] line-clamp-2 mt-1 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-2 border-t border-[#1F1B15] flex items-center justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-bold text-[#FF9F43]">
              ₹{dish.discountedPrice || dish.price}
            </span>
            {dish.discountedPrice && (
              <span className="text-xs text-[#777] line-through">₹{dish.price}</span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!dish.isAvailable}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : dish.isAvailable
                ? 'text-black orange-gradient-btn hover:scale-105'
                : 'bg-[#222] text-[#666] cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
