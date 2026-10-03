import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, Clock, ChevronRight, X, ShieldCheck } from 'lucide-react';
import { Order, AppSettings } from '../types';
import { ReceiptModal } from './ReceiptModal';

interface OrderConfirmationModalProps {
  order: Order | null;
  whatsappUrl: string;
  settings: AppSettings;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  whatsappUrl,
  settings,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  if (!order) return null;

  const handleCopyMessage = () => {
    if (order.whatsappMessage) {
      navigator.clipboard.writeText(order.whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Preparing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Out for Delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Success Header banner */}
        <div className="bg-gradient-to-r from-[#00875A] to-emerald-700 text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-full bg-white text-[#00875A] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-black font-display tracking-tight text-white mb-1">
            Order Sent!
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm font-medium">
            We'll confirm on WhatsApp shortly
          </p>

          <div className="inline-block mt-3 px-3 py-1 bg-black/20 rounded-full text-xs font-mono font-bold tracking-wider">
            Order ID: {order.orderNumber}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Real-time Order Status tracker */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">Live Status:</span>
            </div>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          {/* Customer & Delivery summary */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Customer Details
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-semibold text-slate-800">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-slate-800">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fulfillment:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {order.deliveryType === 'delivery' ? 'Home Delivery' : 'Pickup at Kitchen'}
              </span>
            </div>
            {order.deliveryAddress && (
              <div className="pt-1 text-slate-600 border-t border-slate-200/60 text-xs">
                <span className="font-medium text-slate-500 block">Address:</span>
                {order.deliveryAddress}
              </div>
            )}
          </div>

          {/* Items breakdown */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ordered Items
            </div>
            <div className="space-y-1.5 divide-y divide-slate-100">
              {order.items.map((it, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-800">
                      {it.quantity}x {it.name}
                    </span>
                    {it.addonName && (
                      <span className="text-xs text-amber-700 block font-medium">
                        + {it.addonName}
                      </span>
                    )}
                    {it.note && (
                      <span className="text-[11px] text-slate-400 italic block">
                        Note: {it.note}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {settings.currencySymbol}
                    {((it.price + (it.addonPrice || 0)) * it.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
              <span>Total Paid/Payable</span>
              <span className="font-black text-[#9D1D11] font-mono text-base">
                {settings.currencySymbol}{order.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Picture Receipt Only Action */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setShowReceipt(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#00875A] hover:bg-[#00704A] text-white py-4 px-4 rounded-xl font-bold shadow-md cursor-pointer transition-colors text-sm"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <span>Share Unalterable Picture Receipt (PNG)</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center px-2">
              🔒 <strong className="text-slate-700">100% Secure:</strong> This generates an unalterable picture receipt image. When shared to WhatsApp, it appears directly as a photo with zero editable text!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <span>Back to Menu / Order More</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showReceipt && (
        <ReceiptModal order={order} settings={settings} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
};
