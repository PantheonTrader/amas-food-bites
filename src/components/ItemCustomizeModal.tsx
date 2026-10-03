import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Layers, AlertCircle, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';

interface ItemCustomizeModalProps {
  item: MenuItem | null;
  allItems: MenuItem[];
  currencySymbol: string;
  onClose: () => void;
  onAddToCart: (params: {
    item: MenuItem;
    addonItem: MenuItem | null;
    quantity: number;
    note: string;
  }) => void;
}

export const ItemCustomizeModal: React.FC<ItemCustomizeModalProps> = ({
  item,
  allItems,
  currencySymbol,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Find standalone items belonging to the configured add-on category
  const addonOptions = React.useMemo(() => {
    if (!item?.allowAddonCategory) return [];
    return allItems.filter(
      (it) => it.category === item.allowAddonCategory && !it.isSoldOut && it.stockQuantity > 0
    );
  }, [item?.allowAddonCategory, allItems]);

  const selectedAddon = React.useMemo(() => {
    if (!selectedAddonId) return null;
    return addonOptions.find((a) => a.id === selectedAddonId) || null;
  }, [selectedAddonId, addonOptions]);

  // Set default selection if required
  useEffect(() => {
    if (item?.allowAddonCategory && item.isAddonRequired && addonOptions.length > 0) {
      setSelectedAddonId(addonOptions[0].id);
    } else {
      setSelectedAddonId(null);
    }
    setQuantity(1);
    setNote('');
    setValidationError(null);
  }, [item, addonOptions]);

  // Max selectable quantity constrained by base item stock and selected addon stock
  const maxAvailable = React.useMemo(() => {
    if (!item) return 1;
    let max = item.stockQuantity;
    if (selectedAddon) {
      max = Math.min(max, selectedAddon.stockQuantity);
    }
    return Math.max(1, max);
  }, [item?.stockQuantity, selectedAddon]);

  if (!item) return null;

  // Calculate pricing
  const basePrice = item.price;
  const addonPrice = selectedAddon ? selectedAddon.price : 0;
  const unitPrice = basePrice + addonPrice;
  const totalPrice = unitPrice * quantity;

  const handleIncrement = () => {
    if (quantity < maxAvailable) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAdd = () => {
    if (item.allowAddonCategory && item.isAddonRequired && !selectedAddonId) {
      setValidationError(`Please select an option from ${item.allowAddonCategory} to continue.`);
      return;
    }

    onAddToCart({
      item,
      addonItem: selectedAddon,
      quantity,
      note: note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with image */}
        <div className="relative h-48 sm:h-56 bg-slate-100 shrink-0">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
              {item.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display leading-tight drop-shadow-sm">
              {item.name}
            </h2>
            <p className="text-amber-200 font-bold text-sm">
              Base: {currencySymbol}{item.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Item Description */}
          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
              {item.description}
            </p>
          )}

          {/* Modifier Group Section */}
          {item.allowAddonCategory && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-display">
                  <Layers className="w-4 h-4 text-[#9D1D11]" />
                  <span>Choose from {item.allowAddonCategory}</span>
                </label>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    item.isAddonRequired
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.isAddonRequired ? 'Required' : 'Optional'}
                </span>
              </div>

              {validationError && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {addonOptions.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  No add-on items currently in stock in this category.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Optional "None" button if optional */}
                  {!item.isAddonRequired && (
                    <label
                      onClick={() => setSelectedAddonId(null)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedAddonId === null
                          ? 'border-[#9D1D11] bg-red-50/40 text-slate-900 ring-1 ring-[#9D1D11]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selectedAddonId === null
                              ? 'border-[#9D1D11] bg-[#9D1D11]'
                              : 'border-slate-300'
                          }`}
                        >
                          {selectedAddonId === null && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">No add-on (dish only)</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">+{currencySymbol}0</span>
                    </label>
                  )}

                  {/* Addon Items List */}
                  {addonOptions.map((addon) => {
                    const isSelected = selectedAddonId === addon.id;
                    return (
                      <label
                        key={addon.id}
                        onClick={() => {
                          setSelectedAddonId(addon.id);
                          setValidationError(null);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#9D1D11] bg-red-50/40 text-slate-900 ring-1 ring-[#9D1D11]'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#9D1D11] bg-[#9D1D11]'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold block">{addon.name}</span>
                            <span className="text-[11px] text-slate-400">
                              Stock: {addon.stockQuantity} portion(s) available
                            </span>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                          +{currencySymbol}{addon.price.toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <span className="block text-sm font-extrabold text-slate-900 font-display">Quantity</span>
              <span className="text-xs text-slate-500">
                {maxAvailable} portion(s) available
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="font-extrabold font-mono text-base text-slate-900 min-w-[1.75rem] text-center">
                {quantity}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= maxAvailable}
                className="w-8 h-8 rounded-lg bg-[#9D1D11] hover:bg-[#80170C] disabled:opacity-40 disabled:hover:bg-[#9D1D11] flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Note Field per cart item */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Special Request / Preparation Note (Optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special request? e.g. no pepper, extra spicy, sauce on the side"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D1D11] focus:bg-white transition-all placeholder:text-slate-400"
              maxLength={120}
            />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total Line Price</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 font-display">
              {currencySymbol}{totalPrice.toLocaleString()}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 bg-[#00875A] hover:bg-[#00704A] text-white font-extrabold text-sm sm:text-base py-3 px-6 rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span>Add to Order Tray</span>
            <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {currencySymbol}{totalPrice.toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
