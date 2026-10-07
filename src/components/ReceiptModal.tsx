import React, { useRef, useState } from 'react';
import { Download, CheckCircle2, X, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { Order, AppSettings } from '../types';
import * as htmlToImage from 'html-to-image';

interface ReceiptModalProps {
  order: Order;
  settings: AppSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, settings, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleShareImage = () => {
    if (!receiptRef.current) return;
    setDownloading(true);

    htmlToImage.toPng(receiptRef.current, { quality: 0.95, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `receipt-${order.orderNumber || 'order'}.png`;
        link.href = dataUrl;
        link.click();
        
        alert("🔒 Picture Receipt Downloaded! Please attach this image when WhatsApp opens to secure your order against fraud.");
        
        const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(order.whatsappMessage || `Official verified receipt for order #${order.orderNumber} at ${settings.restaurantName}`)}`;
        window.open(whatsappUrl, '_blank');
      })
      .catch((error) => {
        console.error('Error generating image receipt:', error);
      })
      .finally(() => {
        setDownloading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm font-display">Official Verified Picture Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-100 flex justify-center">
          
          {/* Actual Receipt Card to Capture as Image */}
          <div
            ref={receiptRef}
            id="receipt-card"
            className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-md border border-slate-200 font-sans text-slate-800 space-y-4 relative"
            style={{ width: '380px' }}
          >
            {/* Watermark / Seal */}
            <div className="absolute top-6 right-6 opacity-10 pointer-events-none">
              <UtensilsCrossed className="w-24 h-24 text-slate-900" />
            </div>

            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
              <div className="inline-flex w-10 h-10 rounded-xl bg-slate-900 text-amber-400 items-center justify-center font-black mb-1">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black font-display tracking-tight text-slate-900 uppercase">
                {settings.restaurantName}
              </h2>
              <p className="text-[11px] text-slate-500">{settings.tagline}</p>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 mt-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>OFFICIAL VERIFIED RECEIPT</span>
              </div>
            </div>

            {/* Meta info */}
            <div className="text-xs space-y-1 border-b border-dashed border-slate-300 pb-3 text-slate-600">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <strong className="font-mono text-slate-900">#{order.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="font-medium text-slate-900">
                  {new Date(order.createdAt).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment:</span>
                <strong className="uppercase text-slate-900">{order.deliveryType}</strong>
              </div>
            </div>

            {/* Customer Details */}
            <div className="text-xs space-y-1 border-b border-dashed border-slate-300 pb-3 bg-slate-50 p-3 rounded-xl">
              <div className="font-bold text-slate-900 mb-0.5">Customer Information:</div>
              <div className="text-slate-700">👤 {order.customerName}</div>
              <div className="text-slate-700">📞 {order.customerPhone}</div>
              {order.deliveryAddress && (
                <div className="text-slate-700 mt-1">📍 {order.deliveryAddress}</div>
              )}
              {order.notes && (
                <div className="text-slate-600 italic mt-1 text-[11px]">Note: "{order.notes}"</div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2 text-xs border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400 flex justify-between">
                <span>Item Description</span>
                <span>Amount</span>
              </div>

              {order.items.map((item, idx) => {
                const itemTotal = (item.price + (item.addonPrice || 0)) * item.quantity;
                return (
                  <div key={idx} className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-slate-900">
                        {item.quantity}x {item.name}
                      </div>
                      {item.addonName && (
                        <div className="text-[11px] text-slate-500">+ {item.addonName}</div>
                      )}
                      {item.note && (
                        <div className="text-[10px] text-slate-400 italic">Note: {item.note}</div>
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 shrink-0">
                      {settings.currencySymbol}{itemTotal.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs pt-1 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-slate-900">
                  {settings.currencySymbol}{order.subtotal.toLocaleString()}
                </span>
              </div>
              {order.deliveryType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono font-medium text-slate-900">
                    {settings.currencySymbol}{order.deliveryFee.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono text-[#9D1D11]">
                  {settings.currencySymbol}{order.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer Seal */}
            <div className="pt-3 text-center border-t border-dashed border-slate-300 text-[10px] text-slate-400">
              Verified Order • {settings.restaurantName}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex flex-col gap-2.5">
          <button
            onClick={handleShareImage}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-[#00875A] hover:bg-[#00704A] text-white py-3.5 px-4 rounded-xl font-bold shadow-md transition-colors cursor-pointer text-sm disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>{downloading ? 'Generating Receipt Image...' : 'View & Share Picture Receipt (PNG)'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Close Receipt Preview
          </button>
        </div>

      </div>
    </div>
  );
};
