import React, { useState, useEffect } from 'react';
import { Clock, Send, CheckCircle2, AlertCircle, RefreshCw, Filter, Copy, MessageSquare, ChevronDown } from 'lucide-react';
import { Order, AppSettings } from '../../types';
import { fetchOrders, updateOrderStatus, collateOrdersForWhatsApp } from '../../api';

interface OrdersTabProps {
  adminPin: string;
  settings: AppSettings;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ adminPin, settings }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collatedModal, setCollatedModal] = useState<{
    text: string;
    whatsappUrl: string;
    count: number;
    revenue: number;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(adminPin);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Polling backup alongside SSE
    return () => clearInterval(interval);
  }, [adminPin]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus, adminPin);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleCollate = async () => {
    try {
      const res = await collateOrdersForWhatsApp(adminPin);
      setCollatedModal({
        text: res.collatedText,
        whatsappUrl: res.whatsappUrl,
        count: res.totalOrders,
        revenue: res.totalRevenue,
      });
    } catch (err: any) {
      alert(err.message || 'No active orders to collate.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Preparing':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Out for Delivery':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-lg font-black font-display text-slate-900">
            Incoming Orders & Kitchen Collation
          </h3>
          <p className="text-xs text-slate-500">
            Real-time feed of placed orders with customer details, modifier add-ons, and WhatsApp dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCollate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#00875A] hover:bg-[#00704A] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Collate & WhatsApp Dispatch</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {['all', 'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors capitalize shrink-0 cursor-pointer ${
              statusFilter === st
                ? 'bg-[#9D1D11] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st} ({orders.filter((o) => (st === 'all' ? true : o.status === st)).length})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No orders found in this filter</h4>
          <p className="text-xs text-slate-400 mt-1">
            Incoming customer orders placed via WhatsApp will appear here automatically in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#9D1D11]">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Status Updater Dropdown */}
                <div className="relative">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    className="text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#9D1D11]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Customer details */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{order.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">WhatsApp Phone:</span>
                  <a
                    href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>{order.customerPhone}</span>
                    <Send className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fulfillment:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {order.deliveryType === 'delivery' ? '🛵 Home Delivery' : '🏪 Pickup at Store'}
                  </span>
                </div>
                {order.deliveryAddress && (
                  <div className="pt-1 text-slate-700 border-t border-slate-200/60">
                    <span className="font-medium text-slate-400">Address: </span>
                    {order.deliveryAddress}
                  </div>
                )}
                {order.notes && (
                  <div className="pt-1 text-amber-800 border-t border-slate-200/60 font-medium">
                    <span className="text-amber-600 font-semibold">Special Notes: </span>
                    {order.notes}
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Items Breakdown
                </span>
                <div className="divide-y divide-slate-100">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="py-1 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900">
                          {it.quantity}x {it.name}
                        </span>
                        {it.addonName && (
                          <span className="text-amber-700 block text-[11px] font-medium">
                            + {it.addonName}
                          </span>
                        )}
                        {it.note && (
                          <span className="text-slate-400 italic block text-[11px]">
                            Note: {it.note}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-slate-700">
                        {settings.currencySymbol}
                        {((it.price + (it.addonPrice || 0)) * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer: Total & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Value</span>
                  <span className="font-black text-slate-900 text-base font-mono">
                    {settings.currencySymbol}{order.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hello ${order.customerName}, this is ${settings.restaurantName}! Here is your confirmed order summary for Order #${order.orderNumber} (Status: ${order.status.toUpperCase()}):\n\n${order.whatsappMessage}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Message Customer (Order Details)</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collation Modal */}
      {collatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <h3 className="text-lg font-black font-display text-slate-900 mb-2">
              Consolidated Kitchen & Dispatch Sheet
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Consolidated order items summary for the chef and delivery dispatch manifest.
            </p>

            <div className="flex-1 overflow-y-auto bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-2xl whitespace-pre-wrap leading-relaxed select-all">
              {collatedModal.text}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
              <a
                href={collatedModal.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#00875A] hover:bg-[#00704A] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Send to WhatsApp Kitchen Group</span>
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(collatedModal.text);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setCollatedModal(null)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
