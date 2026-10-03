import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Category, MenuItem } from '../types';

interface CategoryTabsProps {
  categories: Category[];
  items: MenuItem[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  items,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  // Compute item count per category
  const countsByCategory = React.useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Requirement: "Hide any tab with zero items in it."
  const visibleCategories = React.useMemo(() => {
    return categories.filter((cat) => (countsByCategory[cat.name] || 0) > 0);
  }, [categories, countsByCategory]);

  return (
    <div className="sticky top-[58px] z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-amber-950/10 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
        {/* Search bar and count summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search jollof, pizza, shawarma..."
              className="w-full pl-9 pr-4 py-2 bg-white text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9D1D11] focus:border-transparent transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{items.length} dishes ready to order</span>
            </span>
          </div>
        </div>

        {/* Scrollable category pills (in admin order) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#9D1D11] text-white shadow-sm ring-2 ring-[#9D1D11]/30'
                : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-[#9D1D11] border border-slate-200/80'
            }`}
          >
            All Menu ({items.length})
          </button>

          {visibleCategories.map((category) => {
            const count = countsByCategory[category.name] || 0;
            const isSelected = selectedCategory === category.name;
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.name)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#9D1D11] text-white shadow-sm ring-2 ring-[#9D1D11]/30'
                    : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-[#9D1D11] border border-slate-200/80'
                }`}
              >
                <span>{category.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
