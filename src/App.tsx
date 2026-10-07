/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryTabs } from './components/CategoryTabs';
import { MenuCard } from './components/MenuCard';
import { ItemCustomizeModal } from './components/ItemCustomizeModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { CartModal } from './components/CartModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AppSettings, Category, MenuItem, CartItem, Order, UserAccount } from './types';
import { fetchAppData } from './api';
import { UtensilsCrossed, PhoneCall, Lock, Heart, ShieldCheck, ShoppingBag, Clock } from 'lucide-react';

export default function App() {
  // App Data state
  const [settings, setSettings] = useState<AppSettings>({
    restaurantName: "Ama's Food & Bites",
    tagline:
      'From sizzling Jollof and Basmati specials to Pizza, Shawarma, Burgers and more — your favourite meals are now just a tap away.',
    whatsappNumber: '2348138788589',
    isStoreClosed: false,
    deliveryFee: 1000,
    currencySymbol: '₦',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('choporder_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Views
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    order: Order;
    whatsappUrl: string;
  } | null>(null);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'menu' | 'admin'>('menu');

  // Authenticated user & Admin PIN from session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem('choporder_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminPin, setAdminPin] = useState<string | null>(() => {
    return sessionStorage.getItem('choporder_admin_pin') || null;
  });

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('choporder_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
  }, [cart]);

  // Load initial menu data
  const loadData = useCallback(async () => {
    try {
      const data = await fetchAppData();
      setSettings(data.settings);
      setCategories(data.categories);
      setItems(data.items);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check URL hash for admin routing
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        if (adminPin) {
          setCurrentView('admin');
        } else {
          setIsAdminPinModalOpen(true);
        }
      } else {
        setCurrentView('menu');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [adminPin]);

  // Server-Sent Events (SSE) setup for real-time inventory and order updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setIsLiveConnected(true);
        };

        eventSource.addEventListener('connected', () => {
          setIsLiveConnected(true);
        });

        eventSource.addEventListener('stock_updated', (e) => {
          const payload = JSON.parse(e.data);
          setItems((prevItems) =>
            prevItems.map((it) =>
              it.id === payload.itemId
                ? {
                    ...it,
                    stockQuantity: payload.stockQuantity,
                    isSoldOut: payload.isSoldOut,
                  }
                : it
            )
          );
        });

        eventSource.addEventListener('items_updated', (e) => {
          const updatedItems = JSON.parse(e.data);
          setItems(updatedItems);
        });

        eventSource.addEventListener('categories_updated', (e) => {
          const updatedCategories = JSON.parse(e.data);
          setCategories(updatedCategories);
        });

        eventSource.addEventListener('settings_updated', (e) => {
          const updatedSettings = JSON.parse(e.data);
          setSettings((prev) => ({ ...prev, ...updatedSettings }));
        });

        eventSource.addEventListener('order_updated', (e) => {
          const payload = JSON.parse(e.data);
          setOrderConfirmation((prev) => {
            if (prev && prev.order.id === payload.orderId) {
              return {
                ...prev,
                order: { ...prev.order, status: payload.status },
              };
            }
            return prev;
          });
        });

        eventSource.onerror = () => {
          setIsLiveConnected(false);
          eventSource?.close();
          // Attempt reconnect after 5s
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        setIsLiveConnected(false);
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Cart operations
  // Distinct Combo & Distinct Note Rules (Prompt 2 & Prompt 4):
  const handleAddToCart = ({
    item,
    addonItem,
    quantity,
    note,
  }: {
    item: MenuItem;
    addonItem: MenuItem | null;
    quantity: number;
    note: string;
  }) => {
    const cleanNote = note.trim();
    const addonId = addonItem ? addonItem.id : null;
    const cartLineId = `${item.id}_${addonId || 'none'}_${cleanNote}`;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((c) => c.id === cartLineId);
      if (existingIdx !== -1) {
        // Merge quantities for identical item + add-on + note combos
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }

      // Add as distinct cart line
      const newLine: CartItem = {
        id: cartLineId,
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        addonId,
        addonName: addonItem ? addonItem.name : null,
        addonPrice: addonItem ? addonItem.price : 0,
        note: cleanNote || undefined,
        imageUrl: item.imageUrl,
      };

      return [...prevCart, newLine];
    });

    // Briefly open cart or feedback
  };

  const handleUpdateCartQuantity = (cartId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((it) => {
          if (it.id === cartId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (cartId: string) => {
    setCart((prevCart) => prevCart.filter((it) => it.id !== cartId));
  };

  const handleUpdateCartNote = (cartId: string, newNote: string) => {
    setCart((prevCart) =>
      prevCart.map((it) => (it.id === cartId ? { ...it, note: newNote } : it))
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Cart total calculations
  const totalCartItems = cart.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartPrice = cart.reduce(
    (acc, it) => acc + (it.price + (it.addonPrice || 0)) * it.quantity,
    0
  );

  // Admin access handlers
  const handleOpenAdmin = () => {
    if (adminPin) {
      setCurrentView('admin');
      window.location.hash = '#admin';
    } else {
      setIsAdminPinModalOpen(true);
    }
  };

  const handleAdminPinSuccess = (token: string, user?: UserAccount) => {
    setAdminPin(token);
    if (user) {
      setCurrentUser(user);
    }
    setIsAdminPinModalOpen(false);
    setCurrentView('admin');
    window.location.hash = '#admin';
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('choporder_admin_pin');
    sessionStorage.removeItem('choporder_user');
    setAdminPin(null);
    setCurrentUser(null);
    setCurrentView('menu');
    window.location.hash = '';
  };

  const handleScrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter items for customer menu
  const displayedItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      return matchName || matchDesc || matchCat;
    }
    return true;
  });

  // Group items by category if viewing 'all'
  const categoriesOrder = categories.map((c) => c.name);

  // If in admin view, render AdminDashboard
  if (currentView === 'admin' && adminPin) {
    return (
      <AdminDashboard
        adminPin={adminPin}
        currentUser={currentUser}
        settings={settings}
        categories={categories}
        items={items}
        onRefreshData={loadData}
        onLogout={handleAdminLogout}
        onExitToMenu={() => {
          setCurrentView('menu');
          window.location.hash = '';
        }}
        onPinChanged={(newPin) => setAdminPin(newPin)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 flex flex-col font-sans">
      {/* Brand Header */}
      <Header
        settings={settings}
        cartCount={totalCartItems}
        cartTotal={totalCartPrice}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={Boolean(adminPin)}
        isLiveConnected={isLiveConnected}
      />

      {/* Hero Banner Inspired by Flyer */}
      <HeroBanner
        settings={settings}
        onOrderNowClick={handleScrollToMenu}
      />

      {/* Main Menu Section */}
      <main id="menu-section" className="flex-1 max-w-7xl w-full mx-auto pb-24">
        {/* Dynamic Category Navigation Tabs */}
        <CategoryTabs
          categories={categories}
          items={items}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Menu Cards Grid */}
        <div className="px-4 sm:px-6 py-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#9D1D11] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-600">Loading fresh menu & live stock...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-xs">
              <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No dishes match your filter</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Try searching for another dish or select "All Menu" to explore everything.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-[#9D1D11] text-white text-xs font-bold rounded-full hover:bg-[#80170C] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* If "all" is selected and no search, group by category gracefully */}
              {selectedCategory === 'all' && !searchQuery ? (
                categories
                  .filter((cat) => items.some((i) => i.category === cat.name))
                  .map((cat) => {
                    const catItems = displayedItems.filter((i) => i.category === cat.name);
                    if (catItems.length === 0) return null;

                    return (
                      <section key={cat.id} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-950/10 pb-2">
                          <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
                            <span>{cat.name}</span>
                            <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {catItems.length}
                            </span>
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                          {catItems.map((item) => (
                            <MenuCard
                              key={item.id}
                              item={item}
                              currencySymbol={settings.currencySymbol}
                              onSelect={(selected) => setCustomizeItem(selected)}
                              isStoreClosed={settings.isStoreClosed}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {displayedItems.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      currencySymbol={settings.currencySymbol}
                      onSelect={(selected) => setCustomizeItem(selected)}
                      isStoreClosed={settings.isStoreClosed}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar
        totalItems={totalCartItems}
        totalPrice={totalCartPrice}
        currencySymbol={settings.currencySymbol}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Item Customizer Modal (Handles modifier groups, add-ons, quantity, notes) */}
      {customizeItem && (
        <ItemCustomizeModal
          item={customizeItem}
          allItems={items}
          currencySymbol={settings.currencySymbol}
          onClose={() => setCustomizeItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Full Cart Drawer Modal */}
      {isCartOpen && (
        <CartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cart}
          settings={settings}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onUpdateNote={handleUpdateCartNote}
          onClearCart={handleClearCart}
          onOrderSuccess={(order, whatsappUrl) => {
            setIsCartOpen(false);
            setOrderConfirmation({ order, whatsappUrl });
          }}
        />
      )}

      {/* Order Confirmation Screen */}
      {orderConfirmation && (
        <OrderConfirmationModal
          order={orderConfirmation.order}
          whatsappUrl={orderConfirmation.whatsappUrl}
          settings={settings}
          onClose={() => setOrderConfirmation(null)}
        />
      )}

      {/* Admin PIN Gate Modal */}
      {isAdminPinModalOpen && (
        <AdminPinModal
          isOpen={isAdminPinModalOpen}
          onClose={() => setIsAdminPinModalOpen(false)}
          onSuccess={handleAdminPinSuccess}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-xl text-white font-display">
                  {settings.restaurantName}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
                {settings.tagline}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Real-time Stock Management Active</span>
              </div>
            </div>

            {/* Col 2: Service & Delivery */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-white uppercase tracking-wider block font-display">
                Service & Deliveries
              </span>
              <p className="text-slate-400">
                Freshly prepared to order. Standard doorstep delivery within 30-45 minutes.
              </p>
              <p className="text-slate-400">
                Flat Delivery Fee: <strong className="text-white">{settings.currencySymbol}{settings.deliveryFee.toLocaleString()}</strong>
              </p>
              <p className="text-slate-400">
                Direct WhatsApp Hotline: <strong className="text-white">+{settings.whatsappNumber}</strong>
              </p>
              <div className="pt-1">
                <a
                  href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent("Hello! I have a general inquiry about " + settings.restaurantName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-300 transition-colors text-[11px] inline-flex items-center gap-1 underline underline-offset-2"
                >
                  <span>Catering or general inquiries? Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Col 3: Kitchen & Admin access */}
            <div className="space-y-3 text-xs">
              <span className="font-bold text-white uppercase tracking-wider block font-display">
                Kitchen Management
              </span>
              <p className="text-slate-400">
                Restaurant staff can access the orders collation dashboard and inventory tracker anytime.
              </p>
              <button
                onClick={handleOpenAdmin}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin & Inventory Portal</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <span>
              &copy; {new Date().getFullYear()} {settings.restaurantName}. All rights reserved.
            </span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for fast & delicious food
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
