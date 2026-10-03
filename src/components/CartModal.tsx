import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Send, MapPin, Store, User, Phone, FileText, AlertCircle, ShoppingBag } from 'lucide-react';
import { CartItem, AppSettings, Order } from '../types';
import { placeOrder } from '../api';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  settings: AppSettings;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onUpdateNote: (cartId: string, note: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order, whatsappUrl: string) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNote,
  onClearCart,
  onOrderSuccess,
}) => {
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Totals
  const subtotal = cartItems.reduce((acc, item) => {
    const lineUnitPrice = item.price + (item.addonPrice || 0);
    return acc + lineUnitPrice * item.quantity;
  }, 0);

  const deliveryFee = deliveryType === 'delivery' ? settings.deliveryFee : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartItems.length === 0) {
      setErrorMessage('Your order tray is empty.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = customerPhone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid WhatsApp phone number.');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please provide your delivery address or landmark.');
      return;
    }

    if (settings.isStoreClosed) {
      setErrorMessage('The kitchen is temporarily closed for new orders right now.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined,
        notes: orderNotes.trim() || undefined,
        items: cartItems.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          addonId: item.addonId || null,
          note: item.note || undefined,
        })),
      };

      const result = await placeOrder(payload);

      // Trigger WhatsApp redirection via wa.me link:
      // Format: https://wa.me/[phone]?text=[encoded message]
      // Use window.open or hidden link
      const waLink = document.createElement('a');
      waLink.href = result.whatsappUrl;
      waLink.target = '_blank';
      waLink.rel = 'noopener noreferrer';
      document.body.appendChild(waLink);
      waLink.click();
      document.body.removeChild(waLink);

      // Clear cart and pass to confirmation screen
      onClearCart();
      onOrderSuccess(result.order, result.whatsappUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-[#9D1D11] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display tracking-tight text-white leading-tight">
                Your Order Tray
              </h2>
              <span className="text-xs text-amber-200">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} item(s) selected
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close Tray"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-[#9D1D11] flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Your tray is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
                Explore our mouthwatering dishes and add your favorites to checkout directly on WhatsApp.
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#9D1D11] hover:bg-[#80170C] text-white font-bold text-xs rounded-full shadow-sm cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Order items list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Selected Dishes</span>
                  <button
                    onClick={onClearCart}
                    className="text-red-600 hover:text-red-700 font-semibold cursor-pointer lowercase"
                  >
                    clear all
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-xs">
                  {cartItems.map((item) => {
                    const unitPrice = item.price + (item.addonPrice || 0);
                    const linePrice = unitPrice * item.quantity;

                    return (
                      <div key={item.id} className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          {/* Item info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900 font-display">
                                {item.name}
                              </span>
                              {item.addonName && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60">
                                  + {item.addonName}
                                </span>
                              )}
                            </div>

                            <span className="text-xs text-slate-400 block mt-0.5">
                              {settings.currencySymbol}{unitPrice.toLocaleString()} each
                            </span>
                          </div>

                          {/* Line total price */}
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900 font-mono">
                              {settings.currencySymbol}{linePrice.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Note Input field directly on each cart line (Requirement Prompt 4) */}
                        <div className="pt-1">
                          <input
                            type="text"
                            value={item.note || ''}
                            onChange={(e) => onUpdateNote(item.id, e.target.value)}
                            placeholder="Special request? e.g. no pepper, extra spicy..."
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9D1D11]"
                          />
                        </div>

                        {/* Bottom row: Stepper and clearly spaced Remove (X) button */}
                        <div className="flex items-center justify-between pt-1">
                          {/* Stepper with - and + buttons */}
                          <div className="flex items-center gap-2 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black font-mono text-slate-900 min-w-[1.25rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Requirement: Clearly spaced, easy-to-tap mobile remove button */}
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[11px] font-semibold hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-4 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Delivery & Contact Details
                </div>

                {/* Delivery Type Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'border-[#9D1D11] bg-red-50/60 text-[#9D1D11] ring-1 ring-[#9D1D11]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-[#9D1D11]" />
                    <span>Home Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'border-[#9D1D11] bg-red-50/60 text-[#9D1D11] ring-1 ring-[#9D1D11]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Store className="w-4 h-4 text-[#9D1D11]" />
                    <span>Restaurant Pickup</span>
                  </button>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Your Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. David Adeleke"
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                  />
                </div>

                {/* Customer WhatsApp Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>WhatsApp Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 08123456789 or 2348123456789"
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    We will send order confirmation and dispatch updates to this WhatsApp number.
                  </span>
                </div>

                {/* Delivery Address (if Delivery) */}
                {deliveryType === 'delivery' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Delivery Address & Landmark *</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Flat 4B, Emerald Estate, Off Admiralty Way, Lekki"
                      className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                    />
                  </div>
                )}

                {/* General Order Instructions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>General Order Notes (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Call when outside the gate, extra cutlery please"
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer with Summary & Checkout Button */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-slate-800">
                  {settings.currencySymbol}{subtotal.toLocaleString()}
                </span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono font-bold text-slate-800">
                    {settings.currencySymbol}{deliveryFee.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200 font-display">
                <span>Grand Total</span>
                <span className="font-mono text-lg text-[#9D1D11]">
                  {settings.currencySymbol}{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || settings.isStoreClosed}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base text-white shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
                settings.isStoreClosed
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#00875A] hover:bg-[#00704A] shadow-emerald-800/20'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Checkout via WhatsApp</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Orders are verified and inventory is deducted in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
