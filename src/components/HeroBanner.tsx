import React from 'react';
import { ArrowDown, Sparkles, Flame, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { AppSettings } from '../types';
import { AmasLogo } from './AmasLogo';

interface HeroBannerProps {
  settings: AppSettings;
  onOrderNowClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onOrderNowClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#9D1D11] via-[#A82214] to-[#8C180C] text-white pt-8 pb-12 px-4 sm:px-6 shadow-inner">
      {/* Decorative background glow & food motifs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-red-950/40 blur-2xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge / Announcement */}
        <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-sm border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-200 mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
          <span>Real-time Stock Tracking & Instant WhatsApp Collation</span>
        </div>

        {/* Brand Illustrated Badge (Recreating the flyer artwork style) */}
        <div className="relative inline-block mb-4">
          <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 p-1.5 rounded-2xl shadow-xl transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="bg-[#9D1D11] text-white px-5 py-2.5 rounded-xl border border-amber-300/40 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-black flex items-center justify-center border border-amber-300/50">
                <AmasLogo className="w-12 h-12" />
              </div>
              <div className="text-left">
                <span className="block text-2xl sm:text-3xl font-black tracking-tight text-amber-300 font-display leading-none">
                  {settings.restaurantName}
                </span>
                <span className="text-[11px] font-bold text-amber-100 uppercase tracking-widest">
                  Taste The Cozy Difference
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Heading from Flyer: NOW OPEN FOR ORDERS! */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-4 uppercase font-display drop-shadow-md">
          NOW OPEN FOR ORDERS!
        </h1>

        {/* Tagline from Flyer */}
        <p className="text-base sm:text-xl text-amber-50/95 max-w-2xl mx-auto leading-relaxed font-normal mb-8">
          {settings.tagline}
        </p>

        {/* Action Button: ORDER NOW in bright green as seen on flyer */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={onOrderNowClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#00875A] hover:bg-[#00704A] text-white font-extrabold text-lg sm:text-xl px-10 py-4 rounded-full shadow-2xl hover:shadow-[#00875A]/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-emerald-400/40"
          >
            <span>ORDER NOW</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </button>

          <a
            href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent("Hello! I'd like to make an inquiry at " + settings.restaurantName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base px-6 py-4 rounded-full border border-white/20 backdrop-blur-sm transition-colors"
          >
            <span>💬 Chat on WhatsApp</span>
          </a>
        </div>

        {/* Footer Notes from flyer: Fresh meals • Fast delivery • Right to your door */}
        <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-amber-200/90 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Fresh meals</span>
          </span>
          <span className="text-amber-400/40">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Fast delivery</span>
          </span>
          <span className="text-amber-400/40">•</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Right to your door</span>
          </span>
          <span className="text-amber-400/40">•</span>
          <span className="inline-flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            <span>Live Stock Verified</span>
          </span>
        </div>
      </div>
    </section>
  );
};
