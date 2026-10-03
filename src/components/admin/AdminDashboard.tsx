import React, { useState } from 'react';
import {
  ShoppingBag,
  Package,
  Layers,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  UtensilsCrossed,
  RefreshCw,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import { AppSettings, Category, MenuItem, UserAccount } from '../../types';
import { OrdersTab } from './OrdersTab';
import { OrderHistoryTab } from './OrderHistoryTab';
import { InventoryTab } from './InventoryTab';
import { MenuItemsTab } from './MenuItemsTab';
import { CategoriesTab } from './CategoriesTab';
import { SettingsTab } from './SettingsTab';

interface AdminDashboardProps {
  adminPin: string;
  currentUser?: UserAccount | null;
  settings: AppSettings;
  categories: Category[];
  items: MenuItem[];
  onRefreshData: () => void;
  onLogout: () => void;
  onExitToMenu: () => void;
  onPinChanged: (newPin: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminPin,
  currentUser,
  settings,
  categories,
  items,
  onRefreshData,
  onLogout,
  onExitToMenu,
  onPinChanged,
}) => {
  const [activeTab, setActiveTab] = useState<
    'orders' | 'history' | 'inventory' | 'items' | 'categories' | 'settings'
  >('orders');

  const isStaff = currentUser?.role === 'staff';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col">
      {/* Top Admin Navbar */}
      <nav aria-label="Admin Navigation" className="bg-[#1E293B] text-white border-b border-slate-700/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <UtensilsCrossed className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg font-display tracking-tight text-white">
                  {settings.restaurantName}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isStaff
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  {isStaff ? '🍳 Restaurant Staff' : '👑 Admin / Manager'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Logged in as: {currentUser?.email || (isStaff ? 'staff@rxcozybite.com' : 'admin@rxcozybite.com')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshData}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer"
              title="Refresh all data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onExitToMenu}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-600 transition-colors cursor-pointer"
            >
              <span>View Customer Menu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
              title="Lock Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock / Exit</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Active Orders & Kitchen</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Order History & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Real-time Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'items'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Menu Items & Add-ons</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'orders' && (
          <OrdersTab adminPin={adminPin} settings={settings} />
        )}

        {activeTab === 'history' && (
          <OrderHistoryTab adminPin={adminPin} settings={settings} />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            items={items}
            adminPin={adminPin}
            settings={settings}
            onRefreshData={onRefreshData}
          />
        )}

        {activeTab === 'items' && (
          <MenuItemsTab
            items={items}
            categories={categories}
            adminPin={adminPin}
            settings={settings}
            onRefreshData={onRefreshData}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            items={items}
            adminPin={adminPin}
            onRefreshData={onRefreshData}
          />
        )}

        {activeTab === 'settings' && (
          isStaff ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-3">
                <SettingsIcon className="w-6 h-6 text-amber-700" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-1">
                Admin Settings Protected
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                You are currently logged in as <strong>Restaurant Staff</strong>. WhatsApp number configuration, accounts management, and store settings are restricted to the <strong>Admin / General Manager</strong>.
              </p>
              <button
                onClick={onLogout}
                className="bg-[#9D1D11] hover:bg-[#80170C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Log In as Admin
              </button>
            </div>
          ) : (
            <SettingsTab
              settings={settings}
              adminPin={adminPin}
              onRefreshData={onRefreshData}
              onPinChanged={onPinChanged}
            />
          )
        )}
      </main>
    </div>
  );
};
