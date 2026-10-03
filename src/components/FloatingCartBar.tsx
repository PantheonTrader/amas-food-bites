import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface FloatingCartBarProps {
  totalItems: number;
  totalPrice: number;
  currencySymbol: string;
  onOpenCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  totalItems,
  totalPrice,
  currencySymbol,
  onOpenCart,
}) => {
  if (totalItems === 0) return null;

  return (
    <aside
      aria-label="Order Cart Summary"
      className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full bg-gradient-to-r from-[#9D1D11] via-[#B82613] to-[#8C180C] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-amber-300/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group ring-4 ring-black/10"
        >
          {/* Left: Count and Label */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-inner">
              <ShoppingBag className="w-5 h-5 text-slate-950" />
              <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-amber-300">
                {totalItems}
              </span>
            </div>
            <div className="text-left">
              <span className="text-xs text-amber-200 font-semibold block leading-tight">
                {totalItems} item{totalItems > 1 ? 's' : ''} in your tray
              </span>
              <span className="text-lg font-black tracking-tight text-white font-display">
                {currencySymbol}{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right: Checkout CTA */}
          <div className="flex items-center gap-2 bg-[#00875A] group-hover:bg-[#00704A] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
            <span>Review & WhatsApp Order</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </aside>
  );
};
