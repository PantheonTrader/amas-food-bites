import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Edit2, Trash2, AlertCircle, Check, Info } from 'lucide-react';
import { Category, MenuItem } from '../../types';
import { addCategory, renameCategory, reorderCategories, deleteCategory } from '../../api';

interface CategoriesTabProps {
  categories: Category[];
  items: MenuItem[];
  adminPin: string;
  onRefreshData: () => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  items,
  adminPin,
  onRefreshData,
}) => {
  const [newCatName, setNewCatName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Compute item count per category
  const itemCountByCat: Record<string, number> = {};
  items.forEach((it) => {
    itemCountByCat[it.category] = (itemCountByCat[it.category] || 0) + 1;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    // Client-side duplicate check (mirrors server validation)
    const exists = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError(`Category "${trimmed}" already exists (case-insensitive duplicate).`);
      return;
    }

    setLoading(true);
    try {
      await addCategory(trimmed, adminPin);
      setNewCatName('');
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRename = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setError(null);
  };

  const handleSaveRename = async (cat: Category) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === cat.name) {
      setEditingId(null);
      return;
    }

    // Duplicate check with others
    const duplicate = categories.some(
      (c) => c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError(`Category "${trimmed}" already exists.`);
      return;
    }

    setLoading(true);
    try {
      await renameCategory(cat.id, trimmed, adminPin);
      setEditingId(null);
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to rename category');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newOrder = [...categories];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((c) => c.id);
    try {
      await reorderCategories(orderedIds, adminPin);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reorder categories');
    }
  };

  const handleDelete = async (cat: Category) => {
    const count = itemCountByCat[cat.name] || 0;
    if (count > 0) {
      alert(`Cannot delete "${cat.name}". It contains ${count} menu item(s). Move or delete them first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      await deleteCategory(cat.id, adminPin);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-lg font-black font-display text-slate-900">
          Categories & Menu Tab Ordering
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tabs on the public menu are rendered dynamically from this list in the exact order set here. Tabs with 0 items are automatically hidden.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Category Form */}
      <form
        onSubmit={handleAdd}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="flex-1 w-full">
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name (e.g. Swallows & Soups, Pepper Soup, Salads...)"
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !newCatName.trim()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#9D1D11] hover:bg-[#80170C] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </form>

      {/* Categories Reorderable List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold flex items-center justify-between">
          <span>Active Categories ({categories.length})</span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5" /> Use up/down controls to change tab order
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {categories.map((cat, idx) => {
            const itemCount = itemCountByCat[cat.name] || 0;
            const isEditing = editingId === cat.id;

            return (
              <div
                key={cat.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                {/* Left: Reorder buttons & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-mono text-xs font-bold text-slate-400 w-6 shrink-0">
                    #{idx + 1}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="text-xs sm:text-sm px-2.5 py-1.5 bg-white border border-[#9D1D11] rounded-lg focus:outline-none w-full"
                      />
                      <button
                        onClick={() => handleSaveRename(cat)}
                        className="p-1.5 bg-[#9D1D11] text-white rounded-lg hover:bg-[#80170C] cursor-pointer"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block font-display">
                        {cat.name}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          itemCount === 0 ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        {itemCount} item{itemCount === 1 ? '' : 's'} assigned
                        {itemCount === 0 && ' (Tab hidden on public menu)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartRename(cat)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Rename category (cascades to all items)"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Requirement: Delete category only when it has zero items — disable with tooltip */}
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={itemCount > 0}
                    className={`p-2 rounded-lg transition-colors ${
                      itemCount > 0
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                    }`}
                    title={
                      itemCount > 0
                        ? `Cannot delete category: contains ${itemCount} item(s). Move or delete them first.`
                        : `Delete "${cat.name}" category`
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
