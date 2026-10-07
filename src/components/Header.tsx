import React from 'react';
import { ShoppingBag, Lock, UtensilsCrossed, PhoneCall, AlertCircle, Wifi } from 'lucide-react';
import { AppSettings } from '../types';
import { AmasLogo } from './AmasLogo';

interface HeaderProps {
  settings: AppSettings;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  isLiveConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAdmin,
  isAdminLoggedIn,
  isLiveConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#9D1D11] text-white shadow-md border-b border-[#B82613]/50">
      {settings.isStoreClosed && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1.5 text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Notice: The kitchen is temporarily closed for orders right now. You can still browse the menu.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-black flex items-center justify-center shadow-md border-2 border-amber-300">
            <AmasLogo className="w-11 h-11" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-display">
                {settings.restaurantName || "Ama's Food & Bites"}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-[#00875A] text-white px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                Open
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 hidden md:block line-clamp-1 max-w-sm">
              Fresh Meals • Fast Delivery • Direct WhatsApp Orders
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${
              isLiveConnected
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : 'bg-red-950/60 text-red-300 border-red-500/30'
            }`}
            title={isLiveConnected ? 'Live inventory sync active' : 'Connecting to live sync...'}
          >
            <Wifi className={`w-3 h-3 ${isLiveConnected ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`} />
            <span>{isLiveConnected ? 'Live Stock' : 'Connecting'}</span>
          </div>



          {/* Admin access button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border ${
              isAdminLoggedIn
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                : 'bg-black/20 hover:bg-black/30 text-amber-100 border-white/10'
            }`}
            title="Admin Portal (PIN Protected)"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAdminLoggedIn ? 'Admin Portal' : 'Admin'}</span>
          </button>

          {/* Cart button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 bg-[#00875A] hover:bg-[#00704A] text-white px-3.5 py-1.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
            aria-label="View Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-amber-400 text-slate-900 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden xs:inline">Cart</span>
            {cartCount > 0 && (
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded font-mono font-semibold">
                {settings.currencySymbol}{cartTotal.toLocaleString()}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
