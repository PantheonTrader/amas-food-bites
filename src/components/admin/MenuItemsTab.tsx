import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Layers,
  AlertCircle,
  Search,
  ArrowRightLeft,
  ChevronDown,
  Sparkles,
  Check,
  FolderOpen,
} from 'lucide-react';
import { MenuItem, Category, AppSettings } from '../../types';
import { saveMenuItem, deleteMenuItem, moveItemCategory } from '../../api';

interface MenuItemsTabProps {
  items: MenuItem[];
  categories: Category[];
  adminPin: string;
  settings: AppSettings;
  onRefreshData: () => void;
}

export const MenuItemsTab: React.FC<MenuItemsTabProps> = ({
  items,
  categories,
  adminPin,
  settings,
  onRefreshData,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [movingItemId, setMovingItemId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    stockQuantity: string;
    isSoldOut: boolean;
    allowAddonCategory: string;
    isAddonRequired: boolean;
    imageUrl: string;
  }>({
    name: '',
    description: '',
    price: '',
    category: categories[0]?.name || '',
    stockQuantity: '20',
    isSoldOut: false,
    allowAddonCategory: '',
    isAddonRequired: false,
    imageUrl: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    categories.forEach((cat) => {
      map[cat.name] = [];
    });

    items.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = [];
      }
      map[item.category].push(item);
    });

    return map;
  }, [items, categories]);

  const handleOpenAdd = (preselectedCategory?: string) => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: preselectedCategory || categories[0]?.name || '',
      stockQuantity: '20',
      isSoldOut: false,
      allowAddonCategory: '',
      isAddonRequired: false,
      imageUrl: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category: item.category,
      stockQuantity: String(item.stockQuantity),
      isSoldOut: item.isSoldOut,
      allowAddonCategory: item.allowAddonCategory || '',
      isAddonRequired: Boolean(item.isAddonRequired),
      imageUrl: item.imageUrl || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleQuickMoveCategory = async (item: MenuItem, newCatName: string) => {
    if (!newCatName || newCatName === item.category) {
      setMovingItemId(null);
      return;
    }

    try {
      await moveItemCategory(item.id, newCatName, adminPin);
      setMovingItemId(null);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to move item to category');
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from the menu?`)) {
      return;
    }
    try {
      await deleteMenuItem(item.id, adminPin);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Item name is required.');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price in Naira.');
      return;
    }

    if (!formData.category) {
      setFormError('Please select a category.');
      return;
    }

    const stockNum = parseInt(formData.stockQuantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Please enter a valid stock quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMenuItem(
        {
          id: editingItem ? editingItem.id : undefined,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: priceNum,
          category: formData.category,
          stockQuantity: stockNum,
          isSoldOut: formData.isSoldOut || stockNum === 0,
          allowAddonCategory: formData.allowAddonCategory.trim() || null,
          isAddonRequired: Boolean(formData.isAddonRequired),
          imageUrl: formData.imageUrl.trim() || undefined,
        },
        adminPin,
        Boolean(editingItem)
      );

      setModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories to display
  const displayedCategories = useMemo(() => {
    if (selectedCategoryFilter !== 'all') {
      return categories.filter((c) => c.name === selectedCategoryFilter);
    }
    return categories;
  }, [categories, selectedCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-xl font-black font-display text-slate-900 tracking-tight">
            Menu Categorization & Dish Management
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            All food items are grouped under their respective categories. Easily view, move, and edit dishes by category.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="flex items-center gap-2 bg-[#9D1D11] hover:bg-[#80170C] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Category Navigation Pills & Quick Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
            />
          </div>

          <span className="text-xs text-slate-400">
            Total Menu: <strong className="text-slate-800">{items.length} dishes</strong> across{' '}
            <strong className="text-slate-800">{categories.length} categories</strong>
          </span>
        </div>

        {/* Category Pills (Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#9D1D11] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({items.length})
          </button>

          {categories.map((cat) => {
            const count = (itemsByCategory[cat.name] || []).length;
            const isSelected = selectedCategoryFilter === cat.name;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#9D1D11] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Category Sections */}
      <div className="space-y-8">
        {displayedCategories.map((cat) => {
          const catDishes = (itemsByCategory[cat.name] || []).filter((it) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
              it.name.toLowerCase().includes(q) ||
              it.description?.toLowerCase().includes(q)
            );
          });

          return (
            <div
              key={cat.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <FolderOpen className="w-4 h-4 text-[#9D1D11]" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black font-display text-slate-900 flex items-center gap-2">
                      <span>{cat.name}</span>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {catDishes.length} dish{catDishes.length === 1 ? '' : 'es'}
                      </span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Dishes placed under this category
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAdd(cat.name)}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-[#9D1D11]" />
                  <span>Add Dish to {cat.name}</span>
                </button>
              </div>

              {/* Dishes Grid */}
              <div className="p-6">
                {catDishes.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl p-4">
                    <p className="text-xs text-slate-400">
                      No dishes currently assigned to "{cat.name}".
                    </p>
                    <button
                      onClick={() => handleOpenAdd(cat.name)}
                      className="mt-2 text-xs font-bold text-[#9D1D11] hover:underline cursor-pointer"
                    >
                      + Add the first dish here
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catDishes.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:border-slate-300 transition-all space-y-3 shadow-xs"
                      >
                        {/* Top: Image and Information */}
                        <div className="flex gap-3">
                          <img
                            src={
                              item.imageUrl ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                            }
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block">
                              {item.category}
                            </span>
                            <h5 className="font-extrabold text-sm text-slate-900 truncate font-display">
                              {item.name}
                            </h5>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {item.description || 'No description added.'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-black text-sm text-slate-900 font-mono">
                                {settings.currencySymbol}
                                {item.price.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                Stock: {item.stockQuantity}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Modifier group tag if configured */}
                        {item.allowAddonCategory && (
                          <div className="bg-amber-50 text-amber-800 text-[11px] px-2.5 py-1 rounded-lg border border-amber-200 flex items-center justify-between">
                            <span className="flex items-center gap-1 font-medium">
                              <Layers className="w-3 h-3 text-amber-600" />
                              Add-on: {item.allowAddonCategory}
                            </span>
                            <span className="font-bold text-[10px] uppercase">
                              {item.isAddonRequired ? 'Req' : 'Opt'}
                            </span>
                          </div>
                        )}

                        {/* Quick Category Move Control (Prompt requirement: easily move dishes around) */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                            <span>Move to:</span>
                          </div>

                          <select
                            value={item.category}
                            onChange={(e) => handleQuickMoveCategory(item, e.target.value)}
                            className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#9D1D11] max-w-[140px] truncate"
                            title="Reassign dish to another category"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Footer: Status and Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              item.isSoldOut || item.stockQuantity <= 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {item.isSoldOut || item.stockQuantity <= 0 ? 'Sold Out' : 'Active In Stock'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit item details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Dish Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-black font-display text-slate-900 mb-1">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure dish details, category placement, and modifier add-on rules.
            </p>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dish / Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sizzling Party Jollof"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Menu Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of flavors, ingredients..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price in Naira (₦) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="2500"
                    className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Stock Count *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="20"
                    className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                  />
                </div>
              </div>

              {/* Modifier Group */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span>Modifier Group: Allow an Add-on</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Attach an add-on category to this dish (e.g. Rice can offer Proteins, Swallow can require Soups).
                </p>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Allow Add-on from Category:
                  </label>
                  <select
                    value={formData.allowAddonCategory}
                    onChange={(e) => setFormData({ ...formData, allowAddonCategory: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                  >
                    <option value="">None (Standalone dish without add-ons)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.allowAddonCategory && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isAddonRequired"
                      checked={formData.isAddonRequired}
                      onChange={(e) => setFormData({ ...formData, isAddonRequired: e.target.checked })}
                      className="rounded text-[#9D1D11] focus:ring-[#9D1D11] w-4 h-4"
                    />
                    <label htmlFor="isAddonRequired" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Customer MUST select an add-on (Required)
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSoldOut"
                  checked={formData.isSoldOut}
                  onChange={(e) => setFormData({ ...formData, isSoldOut: e.target.checked })}
                  className="rounded text-[#9D1D11] focus:ring-[#9D1D11] w-4 h-4"
                />
                <label htmlFor="isSoldOut" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Mark as Sold Out immediately
                </label>
              </div>

              <div className="pt-4 flex items-center gap-2 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#9D1D11] hover:bg-[#80170C] text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Menu Item</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-3 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
