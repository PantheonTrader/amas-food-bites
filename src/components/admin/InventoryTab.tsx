import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, PackagePlus, RefreshCw, Layers, ShieldCheck, Search } from 'lucide-react';
import { MenuItem, AppSettings } from '../../types';
import { adjustItemStock, toggleItemSoldOut } from '../../api';

interface InventoryTabProps {
  items: MenuItem[];
  adminPin: string;
  settings: AppSettings;
  onRefreshData: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  adminPin,
  settings,
  onRefreshData,
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'soldout'>('all');
  const [restockModalItem, setRestockModalItem] = useState<MenuItem | null>(null);
  const [customAddQty, setCustomAddQty] = useState<string>('10');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleToggleSoldOut = async (item: MenuItem) => {
    try {
      await toggleItemSoldOut(item.id, !item.isSoldOut, adminPin);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update sold out status');
    }
  };

  const handleQuickRestock = async (item: MenuItem, addQty: number) => {
    try {
      await adjustItemStock(
        item.id,
        {
          adjustment: addQty,
          autoUnmarkSoldOut: true,
        },
        adminPin
      );
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to restock item');
    }
  };

  const handleApplyCustomRestock = async () => {
    if (!restockModalItem) return;
    const qty = parseInt(customAddQty, 10);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid stock quantity.');
      return;
    }

    setIsUpdating(true);
    try {
      await adjustItemStock(
        restockModalItem.id,
        {
          newQuantity: qty,
          autoUnmarkSoldOut: qty > 0,
        },
        adminPin
      );
      setRestockModalItem(null);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStock === 'low') return item.stockQuantity <= 5 && !item.isSoldOut;
    if (filterStock === 'soldout') return item.isSoldOut || item.stockQuantity <= 0;
    return true;
  });

  const lowStockCount = items.filter((i) => i.stockQuantity <= 5 && !i.isSoldOut && i.stockQuantity > 0).length;
  const soldOutCount = items.filter((i) => i.isSoldOut || i.stockQuantity <= 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Menu Items</span>
            <span className="text-xl font-black text-slate-900 font-display">{items.length} dishes</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Low Stock Alert (&le; 5)</span>
            <span className="text-xl font-black text-amber-600 font-display">{lowStockCount} items</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Sold Out Items</span>
            <span className="text-xl font-black text-red-600 font-display">{soldOutCount} items</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or categories..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9D1D11]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStock('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStock === 'all'
                ? 'bg-[#9D1D11] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilterStock('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStock === 'low'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterStock('soldout')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStock === 'soldout'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sold Out ({soldOutCount})
          </button>
        </div>
      </div>

      {/* Real-time Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Dish / Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock / Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isOut = item.isSoldOut || item.stockQuantity <= 0;
                const isLow = !isOut && item.stockQuantity <= 5;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 block leading-snug">
                            {item.name}
                          </span>
                          {item.allowAddonCategory && (
                            <span className="text-[10px] text-amber-700 inline-flex items-center gap-1 font-medium">
                              <Layers className="w-3 h-3" />
                              Add-on: {item.allowAddonCategory} ({item.isAddonRequired ? 'Req' : 'Opt'})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.category}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {settings.currencySymbol}{item.price.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block font-mono font-black text-sm px-2.5 py-1 rounded-lg ${
                          isOut
                            ? 'bg-slate-200 text-slate-600'
                            : isLow
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {item.stockQuantity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                          Sold Out
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleQuickRestock(item, 5)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Add 5 portions to stock"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickRestock(item, 10)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Add 10 portions to stock"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => {
                            setRestockModalItem(item);
                            setCustomAddQty(String(item.stockQuantity));
                          }}
                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Set exact stock count"
                        >
                          Set
                        </button>
                        {/* Sold out toggle strictly protected via admin PIN */}
                        <button
                          onClick={() => handleToggleSoldOut(item)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            item.isSoldOut
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {item.isSoldOut ? 'Mark In Stock' : 'Mark Sold Out'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black font-display text-slate-900">
              Update Inventory Count
            </h3>
            <p className="text-xs text-slate-500">
              Set exact remaining stock for <strong className="text-slate-800">{restockModalItem.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={customAddQty}
                onChange={(e) => setCustomAddQty(e.target.value)}
                className="w-full text-base font-bold font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Setting to 0 will automatically mark the item as Sold Out. Setting &gt; 0 unmarks it.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleApplyCustomRestock}
                disabled={isUpdating}
                className="flex-1 bg-[#9D1D11] hover:bg-[#80170C] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isUpdating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Save Stock</span>
                )}
              </button>
              <button
                onClick={() => setRestockModalItem(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
