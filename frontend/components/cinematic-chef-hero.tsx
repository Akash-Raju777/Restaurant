'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ArrowRight, 
  UtensilsCrossed, 
  RotateCcw,
  Compass
} from 'lucide-react';
import CinematicChefCanvas from './cinematic-chef-canvas';

export default function CinematicChefHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [isSoundActive, setIsSoundActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile device for viewport scaling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smooth scroll progress tracker
  useEffect(() => {
    let reqId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      setTargetProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Smooth lerp update loop
    const lerpLoop = () => {
      setScrollProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.001) return targetProgress;
        return prev + diff * 0.12; // buttery smooth easing
      });
      reqId = requestAnimationFrame(lerpLoop);
    };
    reqId = requestAnimationFrame(lerpLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(reqId);
    };
  }, [targetProgress]);

  // Jump to specific scene helper
  const scrollToScene = (sceneIndex: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top;
    const totalScrollable = rect.height - window.innerHeight;
    const targets = [0.05, 0.28, 0.48, 0.70, 0.95];
    const targetY = scrollTop + totalScrollable * targets[sceneIndex];

    window.scrollTo({
      top: targetY,
      behavior: 'smooth',
    });
  };

  // Determine current active scene for UI overlays
  const currentScene = scrollProgress < 0.2 ? 0 
    : scrollProgress < 0.4 ? 1 
    : scrollProgress < 0.6 ? 2 
    : scrollProgress < 0.8 ? 3 
    : 4;

  const scenes = [
    { id: '01', name: 'REVEAL', desc: 'The Hearth Awakens' },
    { id: '02', name: 'IGNITION', desc: 'Cast-Iron Flame' },
    { id: '03', name: 'TOSS', desc: 'Ingredients in Flight' },
    { id: '04', name: 'SEAR', desc: 'The Roar of Wok-Hei' },
    { id: '05', name: 'PERFECTION', desc: 'Signature Dish' },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#080808]"
      style={{ height: '480vh' }} // Pinned scroll track
    >
      {/* STICKY CINEMATIC VIEWPORT */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        
        {/* 1. THREE.JS 3D WEBGL CANVAS BACKGROUND */}
        <CinematicChefCanvas scrollProgress={scrollProgress} isSoundActive={isSoundActive} />

        {/* Ambient Dark Charcoal & Golden Embers Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/90 via-[#080808]/50 to-transparent pointer-events-none z-[2]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none z-[2]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080808]/80 to-transparent pointer-events-none z-[2]" />

        {/* 2. TOP STATUS BAR (Timeline Progress + Sound Synthesizer) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 flex items-center justify-between">
          {/* Active Scene Badge */}
          <div className="flex items-center space-x-3 bg-[#14110C]/80 backdrop-blur-md border border-[#D9A441]/30 rounded-full px-4 py-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#FF9F43] animate-ping" />
            <span className="text-xs font-semibold text-[#D9A441] tracking-widest uppercase">
              {scenes[currentScene].id} • {scenes[currentScene].name}
            </span>
            <span className="text-xs text-[#777] hidden sm:inline">|</span>
            <span className="text-xs text-[#AAA] hidden sm:inline">{scenes[currentScene].desc}</span>
          </div>

          {/* Sound & Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSoundActive(!isSoundActive)}
              className="flex items-center space-x-2 bg-[#14110C]/80 hover:bg-[#1E1912] backdrop-blur-md border border-[#D9A441]/30 rounded-full px-4 py-1.5 text-xs text-[#D9A441] transition-all hover:border-[#D9A441]"
              title="Toggle ambient hearth fire sizzle"
            >
              {isSoundActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#FF9F43] animate-pulse" />
                  <span className="font-semibold uppercase tracking-wider text-[11px]">Sizzle: Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#888]" />
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-[#888]">Enable Audio</span>
                </>
              )}
            </button>

            {/* Quick Skip to Menu */}
            <a
              href="#featured-menu"
              className="hidden md:flex items-center space-x-1.5 text-xs text-[#AAA] hover:text-[#D9A441] transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
            >
              <span>Skip Intro</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3. CENTER / LEFT CINEMATIC STORYTELLING CONTENT (Smoothly Transitions per Scene) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pointer-events-none">
          <div className="lg:col-span-7 space-y-6 pointer-events-auto">

            {/* SCENE 01: INTRO / HERO (0 - 20%) */}
            <div
              className={`transition-all duration-700 ${
                currentScene === 0 ? 'opacity-100 translate-y-0 block' : 'opacity-0 -translate-y-4 hidden'
              }`}
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1A1611]/90 border border-[#D9A441]/30 text-xs text-[#D9A441] mb-4">
                <Flame className="w-3.5 h-3.5 text-[#FF9F43] animate-pulse" />
                <span className="font-semibold uppercase tracking-wider">Artisanal Charcoal Gastronomy</span>
              </div>

              <h1 className="font-serif-luxury text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F6F1E8] leading-[1.08] mb-4">
                WHERE FIRE <br />
                <span className="gold-gradient-text">MEETS FLAVOUR</span>
              </h1>

              <p className="text-base sm:text-lg text-[#D0C8B8] max-w-xl leading-relaxed font-light mb-8">
                Crafted with passion. Perfected by fire. Witness our master chefs slow-sear authentic delicacies over fragrant embers.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/menu"
                  className="px-8 py-3.5 rounded-full text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Explore Our Menu</span>
                </Link>

                <button
                  onClick={() => scrollToScene(1)}
                  className="px-6 py-3.5 rounded-full text-xs font-bold text-[#F6F1E8] uppercase tracking-wider bg-[#14120E]/80 border border-[#2D261E] hover:border-[#D9A441] transition-all flex items-center space-x-2 hover:bg-[#1E1912]"
                >
                  <span>Ignite Hearth</span>
                  <ArrowRight className="w-4 h-4 text-[#D9A441]" />
                </button>
              </div>
            </div>

            {/* SCENE 02: THE IGNITION (20 - 40%) */}
            <div
              className={`transition-all duration-700 ${
                currentScene === 1 ? 'opacity-100 translate-y-0 block' : 'opacity-0 -translate-y-4 hidden'
              }`}
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1A1611]/90 border border-[#FF9F43]/40 text-xs text-[#FF9F43] mb-4">
                <Flame className="w-3.5 h-3.5 animate-bounce" />
                <span className="font-semibold uppercase tracking-wider">Scene 02 • Cast-Iron Heat</span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F6F1E8] leading-tight mb-4">
                A SPARK <br />
                <span className="gold-gradient-text">AWAKENS</span>
              </h2>

              <p className="text-base sm:text-lg text-[#D0C8B8] max-w-xl leading-relaxed font-light mb-6">
                Cast-iron heated to 450°C. Cold-pressed mustard oil and crackling whole spices meet blazing charcoal flames.
              </p>

              <div className="inline-flex items-center space-x-6 p-4 rounded-2xl bg-[#14110C]/80 border border-[#2E2419]">
                <div>
                  <div className="text-xl font-bold text-[#FF9F43] font-serif-luxury">450°C</div>
                  <div className="text-[11px] text-[#888] uppercase tracking-wider">Hearth Heat</div>
                </div>
                <div className="h-8 w-px bg-[#2E2419]" />
                <div>
                  <div className="text-xl font-bold text-[#D9A441] font-serif-luxury">Seasoned</div>
                  <div className="text-[11px] text-[#888] uppercase tracking-wider">Hand-Forged Wok</div>
                </div>
              </div>
            </div>

            {/* SCENE 03: INGREDIENTS IN FLIGHT (40 - 60%) */}
            <div
              className={`transition-all duration-700 ${
                currentScene === 2 ? 'opacity-100 translate-y-0 block' : 'opacity-0 -translate-y-4 hidden'
              }`}
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1A1611]/90 border border-[#D9A441]/40 text-xs text-[#D9A441] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#D9A441]" />
                <span className="font-semibold uppercase tracking-wider">Scene 03 • Mid-Air Suspension</span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F6F1E8] leading-tight mb-4">
                THE ARTISANAL <br />
                <span className="gold-gradient-text">TOSS</span>
              </h2>

              <p className="text-base sm:text-lg text-[#D0C8B8] max-w-xl leading-relaxed font-light mb-6">
                Sun-ripened red chillies, crisp bell peppers, and heirloom shallots suspended mid-flight in perfect culinary rhythm.
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                {['Kashmiri Chili', 'Sweet Bell Peppers', 'Crimson Shallots', 'Fresh Coriander'].map((ing, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#1F1912] border border-[#3E301F] text-[#E0D8C8]">
                    ★ {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* SCENE 04: SEAR & SOUL / FLAME ROAR (60 - 80%) */}
            <div
              className={`transition-all duration-700 ${
                currentScene === 3 ? 'opacity-100 translate-y-0 block' : 'opacity-0 -translate-y-4 hidden'
              }`}
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#2A0E0E]/90 border border-[#FF4500]/50 text-xs text-[#FF6347] mb-4">
                <Flame className="w-3.5 h-3.5 text-[#FF4500] animate-ping" />
                <span className="font-semibold uppercase tracking-wider">Scene 04 • The Roar of Wok-Hei</span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F6F1E8] leading-tight mb-4">
                SEAR & <br />
                <span className="text-[#FF9F43]">SOUL</span>
              </h2>

              <p className="text-base sm:text-lg text-[#D0C8B8] max-w-xl leading-relaxed font-light mb-6">
                The theatrical roar of open flame infuses deep smoky wok-hei into every tender morsel, sealing natural moisture within seconds.
              </p>

              <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-xl bg-[#1A0F0A] border border-[#FF6F00]/40 text-xs text-[#FFA07A]">
                <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
                <span>100% Authentic Charcoal Wok-Hei Infusion</span>
              </div>
            </div>

            {/* SCENE 05: SIGNATURE DISH REVEAL (80 - 100%) */}
            <div
              className={`transition-all duration-700 ${
                currentScene === 4 ? 'opacity-100 translate-y-0 block' : 'opacity-0 -translate-y-4 hidden'
              }`}
            >
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#1A1611]/90 border border-[#D9A441]/40 text-xs text-[#D9A441] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#FFB300]" />
                <span className="font-semibold uppercase tracking-wider">Scene 05 • Fresh Off The Hearth</span>
              </div>

              <h2 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F6F1E8] leading-tight mb-4">
                IGNITED BY FIRE. <br />
                <span className="gold-gradient-text">REMEMBERED BY FLAVOUR.</span>
              </h2>

              <p className="text-base sm:text-lg text-[#D0C8B8] max-w-xl leading-relaxed font-light mb-8">
                The flame subsides into fragrant steam. Prepared to artisanal perfection and ready to arrive at your table.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/menu"
                  className="px-8 py-3.5 rounded-full text-xs font-bold text-black uppercase tracking-wider orange-gradient-btn flex items-center space-x-2 shadow-2xl hover:scale-105 transition-transform"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Discover Our Menu</span>
                </Link>

                <a
                  href="#featured-menu"
                  className="px-6 py-3.5 rounded-full text-xs font-bold text-[#D9A441] uppercase tracking-wider bg-[#14120E] border border-[#D9A441]/40 hover:border-[#D9A441] transition-all flex items-center space-x-2"
                >
                  <span>View Chef Specials</span>
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* 4. BOTTOM HUD & SCENE NAVIGATOR */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex items-end justify-between">
          
          {/* Scroll Cue Prompt */}
          <div className="flex items-center space-x-3 text-xs text-[#888]">
            <div className="w-6 h-10 rounded-full border border-[#D9A441]/40 flex items-start justify-center p-1">
              <div 
                className="w-1.5 h-2.5 rounded-full bg-[#FF9F43]"
                style={{
                  transform: `translateY(${Math.min(20, scrollProgress * 20)}px)`,
                  transition: 'transform 0.1s ease-out'
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest text-[#D9A441]">
                {scrollProgress < 0.95 ? 'Scroll to Cook' : 'Experience Ready'}
              </span>
              <span className="text-[10px] text-[#666]">
                {Math.round(scrollProgress * 100)}% Sequence Progress
              </span>
            </div>
          </div>

          {/* Interactive Scene Scrubber Dots */}
          <div className="flex items-center space-x-2 bg-[#14110C]/90 backdrop-blur-md border border-[#2D261E] rounded-full p-2">
            {scenes.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => scrollToScene(idx)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  currentScene === idx
                    ? 'bg-[#D9A441] text-black shadow-lg scale-105'
                    : 'text-[#888] hover:text-[#EEE] hover:bg-white/5'
                }`}
                title={`Jump to Scene ${sc.id}: ${sc.name}`}
              >
                <span>{sc.id}</span>
                <span className="hidden sm:inline">{sc.name}</span>
              </button>
            ))}
          </div>

        </div>

        {/* 5. SMOOTH PROGRESS BAR RUNNING ALONG BOTTOM */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-[#1A1611] z-20">
          <div
            className="h-full bg-gradient-to-r from-[#D9A441] via-[#FF9F43] to-[#FF4500] transition-all duration-75"
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>

      </div>
    </div>
  );
}
