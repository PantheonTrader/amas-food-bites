import React from 'react';
import { Plus, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuCardProps {
  item: MenuItem;
  currencySymbol: string;
  onSelect: (item: MenuItem) => void;
  isStoreClosed: boolean;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  currencySymbol,
  onSelect,
  isStoreClosed,
}) => {
  const isOutOfStock = item.isSoldOut || item.stockQuantity <= 0;
  const isLowStock = !isOutOfStock && item.stockQuantity <= 5;

  return (
    <div
      className={`group bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        isOutOfStock
          ? 'border-slate-200 opacity-75 grayscale-20 bg-slate-50/70'
          : 'border-slate-200/90 hover:border-amber-400/50'
      }`}
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isOutOfStock ? 'filter brightness-90' : 'group-hover:scale-105'
            }`}
            loading="lazy"
            onError={(e) => {
              // fallback if remote image fails
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Sold Out Overlay / Read-only badge */}
          {isOutOfStock ? (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-3">
              <span className="bg-slate-900/90 text-white font-extrabold text-xs uppercase px-3 py-1.5 rounded-full shadow tracking-wider border border-white/20">
                Sold Out
              </span>
            </div>
          ) : isLowStock ? (
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-md">
                <AlertTriangle className="w-3 h-3 text-slate-950" />
                Only {item.stockQuantity} left
              </span>
            </div>
          ) : (
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 bg-white/90 text-emerald-700 font-semibold text-[10px] px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                In Stock ({item.stockQuantity})
              </span>
            </div>
          )}

          {/* Add-on capability tag */}
          {item.allowAddonCategory && !isOutOfStock && (
            <div className="absolute bottom-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 bg-slate-900/80 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                <Layers className="w-3 h-3 text-amber-300" />
                {item.isAddonRequired ? 'Requires Add-on' : 'Customizable'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-[11px] font-semibold text-amber-700 tracking-wide uppercase mb-1">
            {item.category}
          </div>

          <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1 mb-1 font-display">
            {item.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3 min-h-[2.5rem]">
            {item.description || 'Prepared fresh with premium ingredients by our cozy kitchen team.'}
          </p>
        </div>
      </div>

      {/* Footer: Price and Add button */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-slate-100">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Price</span>
          <span className="text-base sm:text-lg font-black text-slate-900 font-display">
            {currencySymbol}{item.price.toLocaleString()}
          </span>
        </div>

        <button
          onClick={() => onSelect(item)}
          disabled={isOutOfStock || isStoreClosed}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer ${
            isOutOfStock || isStoreClosed
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50'
              : 'bg-[#00875A] hover:bg-[#00704A] text-white active:scale-95 shadow-emerald-900/10'
          }`}
          aria-label={isOutOfStock ? 'Sold Out' : `Add ${item.name}`}
        >
          {isOutOfStock ? (
            <span>Sold Out</span>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{item.allowAddonCategory ? 'Add / Combo' : 'Add'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
