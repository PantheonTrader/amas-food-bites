import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  RefreshCw,
  AlertCircle,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  X,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Order, AppSettings } from '../../types';
import { fetchOrders } from '../../api';

interface OrderHistoryTabProps {
  adminPin: string;
  settings: AppSettings;
}

export const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({ adminPin, settings }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Detail Inspection Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(adminPin);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [adminPin]);

  // Date Filtering helper
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();

      // Date range filter
      if (dateRange === 'today' && orderTime < startOfToday) return false;
      if (dateRange === '7days' && orderTime < sevenDaysAgo) return false;
      if (dateRange === '30days' && orderTime < thirtyDaysAgo) return false;

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && order.deliveryType !== typeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = order.orderNumber.toLowerCase().includes(q);
        const matchName = order.customerName.toLowerCase().includes(q);
        const matchPhone = order.customerPhone.toLowerCase().includes(q);
        const matchItem = order.items.some((it) => it.name.toLowerCase().includes(q));
        if (!matchNum && !matchName && !matchPhone && !matchItem) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, typeFilter, dateRange]);

  // Staff Performance Metrics Calculations
  const metrics = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const nonCancelledOrders = filteredOrders.filter((o) => o.status !== 'Cancelled');
    const deliveredOrders = filteredOrders.filter((o) => o.status === 'Delivered');
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'Cancelled');

    // Total gross sales from non-cancelled orders
    const totalSales = nonCancelledOrders.reduce((acc, o) => acc + o.total, 0);

    // Average order value
    const aov = nonCancelledOrders.length > 0 ? Math.round(totalSales / nonCancelledOrders.length) : 0;

    // Delivery vs Pickup
    const deliveryCount = filteredOrders.filter((o) => o.deliveryType === 'delivery').length;
    const pickupCount = filteredOrders.filter((o) => o.deliveryType === 'pickup').length;

    // Dish popularity ranking
    const dishMap: Record<string, { count: number; revenue: number }> = {};
    nonCancelledOrders.forEach((o) => {
      o.items.forEach((it) => {
        let label = it.name;
        if (it.addonName) {
          label += ` (+ ${it.addonName})`;
        }
        if (!dishMap[label]) {
          dishMap[label] = { count: 0, revenue: 0 };
        }
        const itemTotal = (it.price + (it.addonPrice || 0)) * it.quantity;
        dishMap[label].count += it.quantity;
        dishMap[label].revenue += itemTotal;
      });
    });

    const topDishes = Object.entries(dishMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOrdersCount,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      totalSales,
      aov,
      deliveryCount,
      pickupCount,
      topDishes,
    };
  }, [filteredOrders]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Date & Time',
      'Customer Name',
      'Customer Phone',
      'Fulfillment',
      'Address',
      'Items Count',
      'Item Summary',
      'Subtotal',
      'Delivery Fee',
      'Grand Total',
      'Status',
    ];

    const rows = filteredOrders.map((o) => {
      const itemsSummary = o.items
        .map((it) => `${it.quantity}x ${it.name}${it.addonName ? ` (+${it.addonName})` : ''}`)
        .join('; ');

      return [
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleString()}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerPhone}"`,
        `"${o.deliveryType}"`,
        `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
        o.items.reduce((acc, i) => acc + i.quantity, 0),
        `"${itemsSummary.replace(/"/g, '""')}"`,
        o.subtotal,
        o.deliveryFee,
        o.total,
        `"${o.status}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `order-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Out for Delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Preparing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#9D1D11]" />
            <span>Order History & Staff Performance</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Retrieve past customer transactions, monitor gross revenue, review dish sales, and track kitchen fulfillment rates.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh order history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Performance Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {settings.currencySymbol}{metrics.totalSales.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            From {metrics.totalOrdersCount - metrics.cancelledCount} active/fulfilled orders
          </span>
        </div>

        {/* Metric 2: Average Order Value */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {settings.currencySymbol}{metrics.aov.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Average ticket size per order
          </span>
        </div>

        {/* Metric 3: Total Orders & Completion */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Volume</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-display">
            {metrics.totalOrdersCount}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-1">
            <span className="text-emerald-700 font-semibold">{metrics.deliveredCount} delivered</span>
            <span className="text-slate-300">•</span>
            <span className="text-red-600 font-semibold">{metrics.cancelledCount} cancelled</span>
          </div>
        </div>

        {/* Metric 4: Fulfillment Split */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fulfillment Method</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm font-black text-slate-800 font-mono pt-1">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              <span>{metrics.deliveryCount} Deliveries</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>{metrics.pickupCount} Pickups</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden flex">
            <div
              className="bg-indigo-600 h-full"
              style={{
                width: `${
                  metrics.totalOrdersCount > 0
                    ? (metrics.deliveryCount / metrics.totalOrdersCount) * 100
                    : 50
                }%`,
              }}
            />
            <div
              className="bg-amber-500 h-full"
              style={{
                width: `${
                  metrics.totalOrdersCount > 0
                    ? (metrics.pickupCount / metrics.totalOrdersCount) * 100
                    : 50
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Top Selling Dishes Widget */}
      {metrics.topDishes.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#9D1D11]" />
              <span>Top-Selling Menu Items & Combos</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Ranked by volume ordered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {metrics.topDishes.map((dish, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black font-mono text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-900">
                      {dish.count} ordered
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">
                    {dish.name}
                  </h5>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-200/60 text-[11px] font-mono text-slate-500 font-medium">
                  {settings.currencySymbol}{dish.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, dish..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  dateRange === d.id
                    ? 'bg-[#9D1D11] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters: Status and Fulfillment Type */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#9D1D11]"
          >
            <option value="all">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Preparing">Preparing</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            Type:
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#9D1D11]"
          >
            <option value="all">All Types</option>
            <option value="delivery">🛵 Home Delivery</option>
            <option value="pickup">🏪 Pickup</option>
          </select>

          <span className="ml-auto text-slate-400 text-xs">
            Showing <strong className="text-slate-700">{filteredOrders.length}</strong> of{' '}
            {orders.length} orders
          </span>
        </div>
      </div>

      {/* Orders History Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 p-6">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">No past orders match your criteria</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting the date range or search keyword to view other historical customer records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order Ref / Date</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Fulfillment</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Ref & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-sm text-[#9D1D11] block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">
                          {order.customerName}
                        </span>
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 font-mono hover:underline inline-flex items-center gap-1"
                        >
                          <span>{order.customerPhone}</span>
                          <Phone className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      {/* Fulfillment */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                          {order.deliveryType === 'delivery' ? (
                            <>
                              <Truck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Delivery</span>
                            </>
                          ) : (
                            <>
                              <Store className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pickup</span>
                            </>
                          )}
                        </span>
                        {order.deliveryAddress && (
                          <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                            {order.deliveryAddress}
                          </span>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block text-xs">
                          {itemCount} item{itemCount > 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {settings.currencySymbol}{order.total.toLocaleString()}
                        </span>
                        {order.deliveryFee > 0 && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            incl. fee: {settings.currencySymbol}{order.deliveryFee.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Order Inspector Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black font-display text-slate-900">
                    Order Details
                  </span>
                  <span className="font-mono font-black text-sm bg-red-50 text-[#9D1D11] px-2 py-0.5 rounded-lg border border-red-200">
                    {selectedOrder.orderNumber}
                  </span>
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm">
              {/* Status and Fulfillment Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                    Current Status
                  </span>
                  <span
                    className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                    Fulfillment
                  </span>
                  <span className="font-bold text-slate-800 capitalize mt-1 block">
                    {selectedOrder.deliveryType === 'delivery' ? '🛵 Home Delivery' : '🏪 Pickup at Store'}
                  </span>
                </div>
              </div>

              {/* Customer Profile */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Customer & Contact
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phone:</span>
                  <a
                    href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>{selectedOrder.customerPhone}</span>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
                {selectedOrder.deliveryAddress && (
                  <div className="pt-1 text-slate-700 border-t border-slate-200/60">
                    <span className="font-medium text-slate-400 block">Delivery Address:</span>
                    {selectedOrder.deliveryAddress}
                  </div>
                )}
                {selectedOrder.notes && (
                  <div className="pt-1 text-amber-800 border-t border-slate-200/60">
                    <span className="font-medium text-amber-600 block">Customer Note:</span>
                    {selectedOrder.notes}
                  </div>
                )}
              </div>

              {/* Itemized Receipt Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ordered Dishes & Customizations
                </span>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-3 bg-white space-y-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900">
                          {it.quantity}x {it.name}
                        </div>
                        {it.addonName && (
                          <div className="text-xs text-amber-700 font-semibold">
                            + Add-on: {it.addonName} (+{settings.currencySymbol}
                            {(it.addonPrice || 0).toLocaleString()})
                          </div>
                        )}
                        {it.note && (
                          <div className="text-[11px] text-slate-400 italic">
                            Special request: {it.note}
                          </div>
                        )}
                      </div>

                      <div className="text-right font-mono font-bold text-slate-800">
                        {settings.currencySymbol}
                        {((it.price + (it.addonPrice || 0)) * it.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-800">
                    {settings.currencySymbol}{selectedOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee</span>
                    <span className="font-mono font-bold text-slate-800">
                      {settings.currencySymbol}{selectedOrder.deliveryFee.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200 font-display">
                  <span>Grand Total</span>
                  <span className="font-mono text-[#9D1D11] text-lg">
                    {settings.currencySymbol}{selectedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <a
                href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hello ${selectedOrder.customerName}, this is ${settings.restaurantName} regarding your past order #${selectedOrder.orderNumber}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#00875A] hover:bg-[#00704A] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
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
