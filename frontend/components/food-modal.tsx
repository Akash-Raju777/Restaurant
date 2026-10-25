'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { X, Star, Plus, Minus, Check, Heart, ShieldAlert } from 'lucide-react';

interface FoodModalProps {
  dish: any | null;
  onClose: () => void;
  similarDishes?: any[];
  onSelectSimilar?: (dish: any) => void;
}

export default function FoodModal({ dish, onClose, similarDishes = [], onSelectSimilar }: FoodModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState('Medium');
  const [justAdded, setJustAdded] = useState(false);

  if (!dish) return null;

  const ingredientsList = dish.ingredients
    ? dish.ingredients.split(',').map((s: string) => s.trim())
    : ['Signature Spices', 'Fresh Herbs', 'Artisanal Seasoning'];

  const spiceOptions = ['Mild', 'Medium', 'Spicy'];

  const handleAddToCart = () => {
    addItem(dish, quantity, spiceLevel);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-[#111111] border border-[#2A241C] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#AAA39A] hover:text-[#F6F1E8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto">
          {/* Hero Image */}
          <div className="relative w-full h-64 sm:h-80 bg-[#0A0A0A]">
            <Image
              src={dish.imageUrl || '/images/food/placeholder.png'}
              alt={dish.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-black/20 to-transparent" />

            {/* Badges */}
            <div className="absolute bottom-4 left-6 flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                dish.isVeg ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300' : 'bg-rose-950/80 border border-rose-700 text-rose-300'
              }`}>
                {dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
              {dish.isFeatured && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#D9A441]/20 border border-[#D9A441]/50 text-[#F3E7C4]">
                  Chef Specialty
                </span>
              )}
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header: Title & Rating */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#221D17] pb-5">
              <div>
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#F6F1E8]">
                  {dish.name}
                </h2>
                <div className="flex items-center space-x-2 mt-1.5 text-xs text-[#AAA39A]">
                  <div className="flex items-center text-[#FFB300]">
                    <Star className="w-4 h-4 fill-[#FFB300]" />
                    <span className="ml-1 font-bold text-[#F6F1E8]">{dish.rating || 4.8}</span>
                  </div>
                  <span>•</span>
                  <span>{dish.reviewCount || 1200} reviews</span>
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-[#FF9F43]">
                ₹{dish.discountedPrice || dish.price}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-[#AAA39A] leading-relaxed">
              {dish.description}
            </p>

            {/* Ingredients */}
            <div>
              <h4 className="text-xs uppercase font-semibold tracking-wider text-[#D9A441] mb-2.5">
                Ingredients & Aromatics
              </h4>
              <div className="flex flex-wrap gap-2">
                {ingredientsList.map((item: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs bg-[#1A1713] border border-[#2C251C] text-[#DDD]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Allergen Info */}
            {dish.allergenInfo && (
              <div className="flex items-center space-x-2 text-xs text-amber-300/80 bg-amber-950/20 border border-amber-800/30 p-2.5 rounded-lg">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Allergen Notice: {dish.allergenInfo}</span>
              </div>
            )}

            {/* Customization: Spice Level & Quantity */}
            <div className="p-4 rounded-xl bg-[#16130F] border border-[#262018] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-[#F6F1E8] block">Customize Spice Level</span>
                  <span className="text-[11px] text-[#888]">Tailored to your preference</span>
                </div>
                <div className="flex items-center space-x-2">
                  {spiceOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSpiceLevel(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        spiceLevel === opt
                          ? 'bg-[#D9A441] text-black font-bold shadow-md'
                          : 'bg-[#221D17] text-[#AAA39A] hover:text-[#F6F1E8]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-3 border-t border-[#221D17]">
                <span className="text-xs font-semibold text-[#F6F1E8]">Select Quantity</span>
                <div className="flex items-center space-x-3 bg-[#111] border border-[#2A241D] rounded-lg px-3 py-1.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-[#AAA39A] hover:text-[#F6F1E8] transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-[#F6F1E8] w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-[#AAA39A] hover:text-[#F6F1E8] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-black uppercase tracking-wider orange-gradient-btn flex items-center justify-center space-x-2"
            >
              {justAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <span>Add to Cart • ₹{((dish.discountedPrice || dish.price) * quantity).toFixed(2)}</span>
              )}
            </button>

            {/* Similar Dishes */}
            {similarDishes.length > 0 && (
              <div className="pt-4 border-t border-[#221D17]">
                <h4 className="font-serif-luxury text-sm font-bold text-[#F6F1E8] mb-3">
                  Similar Dishes You Might Savor
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {similarDishes.slice(0, 3).map((sim) => (
                    <div
                      key={sim.id}
                      onClick={() => onSelectSimilar && onSelectSimilar(sim)}
                      className="bg-[#16130F] border border-[#221D17] hover:border-[#D9A441]/40 rounded-xl p-2.5 cursor-pointer transition-all hover:-translate-y-1"
                    >
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mb-2">
                        <Image src={sim.imageUrl} alt={sim.name} fill className="object-cover" />
                      </div>
                      <h5 className="text-xs font-semibold text-[#F6F1E8] truncate">{sim.name}</h5>
                      <div className="text-xs font-bold text-[#FF9F43] mt-0.5">₹{sim.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
