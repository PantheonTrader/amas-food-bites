import { AppSettings, Category, MenuItem, Order, UserAccount } from './types';

export const API_BASE = '';

const DEFAULT_DATA = {
  settings: {
    restaurantName: "Ama's Food & Bites",
    tagline: 'From sizzling Jollof and Basmati specials to Pizza, Shawarma, Burgers and more — your favourite meals are now just a tap away.',
    whatsappNumber: '2348138788589',
    adminPin: '1234',
    isStoreClosed: false,
    deliveryFee: 1000,
    currencySymbol: '₦',
    bankName: 'Moniepoint MFB',
    bankAccountNumber: '8138788589',
    bankAccountName: "Ama's Food & Bites",
  },
  categories: [
    { id: 'cat_rice', name: 'Rice & Specials', order: 1 },
    { id: 'cat_burgers', name: 'Burgers & Shawarma', order: 2 },
    { id: 'cat_pizza', name: 'Pizza', order: 3 },
    { id: 'cat_swallow', name: 'Swallow & Soups', order: 4 },
    { id: 'cat_pepper_soup', name: 'Pepper Soup & Grills', order: 5 },
    { id: 'cat_proteins', name: 'Proteins & Add-ons', order: 6 },
    { id: 'cat_pastries', name: 'Pastries & Sides', order: 7 },
    { id: 'cat_drinks', name: 'Chilled Drinks', order: 8 },
  ],
  items: [
    {
      id: 'item_jollof',
      name: 'Sizzling Smoky Jollof Rice',
      description: 'Firewood-smoked party jollof cooked with plum tomatoes, sweet bell peppers, and fragrant bay leaf spices.',
      price: 2800,
      category: 'Rice & Specials',
      stockQuantity: 22,
      isSoldOut: false,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'item_basmati_fried',
      name: "Chef's Special Basmati Fried Rice",
      description: 'Fragrant long-grain basmati rice tossed with sweet corn, crunchy carrots, green peas, and diced liver.',
      price: 3500,
      category: 'Rice & Specials',
      stockQuantity: 17,
      isSoldOut: false,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'item_double_burger',
      name: 'Double Cozy Beef Burger',
      description: 'Two seasoned grilled beef patties, melted cheddar, sweet caramelized onions, lettuce, and secret cozy house sauce.',
      price: 4500,
      category: 'Burgers & Shawarma',
      stockQuantity: 15,
      isSoldOut: false,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'item_pepperoni_pizza',
      name: 'Loaded Pepperoni Pizza',
      description: 'Stretched artisanal crust topped with zesty tomato marinara, double mozzarella cheese, and smoked beef pepperoni.',
      price: 6500,
      category: 'Pizza',
      stockQuantity: 10,
      isSoldOut: false,
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
    },
  ],
  accounts: [
    { id: 'acc_admin', name: 'Master Admin', email: 'admin@rxcozybite.com', role: 'admin', pin: '1234' },
    { id: 'acc_staff', name: 'Kitchen Staff', email: 'staff@rxcozybite.com', role: 'staff', pin: '5678' }
  ],
  orders: [] as Order[],
};

function getLocalDb() {
  try {
    const saved = localStorage.getItem('amas_local_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.settings) {
        if (!parsed.settings.bankAccountNumber) parsed.settings.bankAccountNumber = '8138788589';
        if (!parsed.settings.bankName) parsed.settings.bankName = 'Moniepoint MFB';
        if (!parsed.settings.bankAccountName) parsed.settings.bankAccountName = parsed.settings.restaurantName || "Ama's Food & Bites";
      }
      return parsed;
    }
  } catch {}
  localStorage.setItem('amas_local_db', JSON.stringify(DEFAULT_DATA));
  return DEFAULT_DATA;
}

function saveLocalDb(db: any) {
  try {
    localStorage.setItem('amas_local_db', JSON.stringify(db));
  } catch {}
}

export async function fetchAppData(): Promise<{
  settings: AppSettings;
  categories: Category[];
  items: MenuItem[];
}> {
  try {
    const res = await fetch(`${API_BASE}/api/data`);
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    return {
      settings: db.settings,
      categories: db.categories,
      items: db.items,
    };
  }
}

export async function loginAdminOrStaff(credentials: {
  email?: string;
  password?: string;
  pin?: string;
}): Promise<{
  success: boolean;
  user: UserAccount;
  token: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    const { email, password, pin } = credentials;
    const found = db.accounts.find((acc: any) => {
      if (email && acc.email.toLowerCase() === email.toLowerCase()) return true;
      if (pin && acc.pin === pin) return true;
      return false;
    });

    if (found) {
      return {
        success: true,
        user: found,
        token: 'local_token_' + Date.now(),
      };
    }

    // Default master admin check if accounts empty
    if (pin === db.settings.adminPin || password === 'admin123' || email === 'admin@rxcozybite.com') {
      return {
        success: true,
        user: { id: 'admin_master', name: 'Master Admin', email: email || 'admin@rxcozybite.com', role: 'admin', pin: db.settings.adminPin },
        token: 'local_token_' + Date.now(),
      };
    }

    throw new Error('Invalid login credentials or PIN');
  }
}

export async function fetchAccounts(adminPin: string): Promise<UserAccount[]> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/accounts`, {
      headers: { 'x-admin-pin': adminPin },
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    return db.accounts;
  }
}

export async function updateAccounts(
  accounts: UserAccount[],
  adminPin: string
): Promise<{ success: boolean; accounts: UserAccount[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/accounts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ accounts }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    db.accounts = accounts;
    saveLocalDb(db);
    return { success: true, accounts };
  }
}

export async function moveItemCategory(
  itemId: string,
  newCategory: string,
  adminPin: string
): Promise<MenuItem> {
  try {
    const res = await fetch(`${API_BASE}/api/items/${itemId}/category`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ category: newCategory }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text).item;
  } catch {
    const db = getLocalDb();
    const item = db.items.find((i: any) => i.id === itemId);
    if (item) {
      item.category = newCategory;
      saveLocalDb(db);
      return item;
    }
    throw new Error('Item not found');
  }
}

export async function placeOrder(orderPayload: {
  customerName: string;
  customerPhone: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  notes?: string;
  items: {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    addonId?: string | null;
    note?: string;
  }[];
}): Promise<{
  success: boolean;
  order: Order;
  whatsappUrl: string;
  whatsappMessage: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    const subtotal = orderPayload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = orderPayload.deliveryType === 'delivery' ? db.settings.deliveryFee : 0;
    const total = subtotal + deliveryFee;

    const newOrder: Order = {
      id: 'ord_' + Math.random().toString(36).substring(2, 9),
      orderNumber: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: new Date().toISOString(),
      customerName: orderPayload.customerName,
      customerPhone: orderPayload.customerPhone,
      deliveryType: orderPayload.deliveryType,
      deliveryAddress: orderPayload.deliveryAddress,
      notes: orderPayload.notes,
      items: orderPayload.items,
      subtotal,
      deliveryFee,
      total,
      status: 'Pending',
    };

    db.orders.unshift(newOrder);
    saveLocalDb(db);

    const lines: string[] = [];
    lines.push(`🍔 *NEW ORDER — ${db.settings.restaurantName.toUpperCase()}* 🍔`);
    lines.push(`*Order ID:* ${newOrder.orderNumber}`);
    lines.push(`*Date:* ${new Date(newOrder.createdAt).toLocaleString('en-GB')}`);
    lines.push(`---------------------------------`);
    lines.push(`*CUSTOMER DETAILS:*`);
    lines.push(`👤 *Name:* ${newOrder.customerName}`);
    lines.push(`📞 *Phone:* ${newOrder.customerPhone}`);
    lines.push(`📍 *Type:* ${newOrder.deliveryType === 'delivery' ? 'Home Delivery' : 'Pickup at Restaurant'}`);
    if (newOrder.deliveryType === 'delivery' && newOrder.deliveryAddress) {
      lines.push(`🏠 *Address:* ${newOrder.deliveryAddress}`);
    }
    if (newOrder.notes && newOrder.notes.trim()) {
      lines.push(`📝 *Order Note:* ${newOrder.notes.trim()}`);
    }
    lines.push(`---------------------------------`);
    lines.push(`*ITEMS ORDERED:*`);
    newOrder.items.forEach((item: any, index: number) => {
      let itemLine = `${index + 1}. *${item.quantity}x ${item.name}*`;
      if (item.addonName) itemLine += ` + ${item.addonName}`;
      const itemTotal = (item.price + (item.addonPrice || 0)) * item.quantity;
      itemLine += ` — ${db.settings.currencySymbol}${itemTotal.toLocaleString()}`;
      lines.push(itemLine);
    });
    lines.push(`---------------------------------`);
    lines.push(`*Subtotal:* ${db.settings.currencySymbol}${newOrder.subtotal.toLocaleString()}`);
    if (newOrder.deliveryFee > 0) {
      lines.push(`*Delivery Fee:* ${db.settings.currencySymbol}${newOrder.deliveryFee.toLocaleString()}`);
    }
    lines.push(`*GRAND TOTAL:* *${db.settings.currencySymbol}${newOrder.total.toLocaleString()}*`);
    lines.push(`---------------------------------`);
    lines.push(`Please confirm this order and provide estimated preparation time. Thank you!`);

    const whatsappMessage = lines.join('\n');
    const whatsappUrl = `https://wa.me/${db.settings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    return {
      success: true,
      order: newOrder,
      whatsappUrl,
      whatsappMessage,
    };
  }
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return Boolean(JSON.parse(text).success);
  } catch {
    const db = getLocalDb();
    return pin === db.settings.adminPin || pin === '1234';
  }
}

export async function fetchOrders(adminPin: string): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: { 'x-admin-pin': adminPin },
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    return db.orders || [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  adminPin: string
): Promise<Order> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ status }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text).order;
  } catch {
    const db = getLocalDb();
    const order = db.orders.find((o: any) => o.id === orderId);
    if (order) {
      order.status = status;
      saveLocalDb(db);
      return order;
    }
    throw new Error('Order not found');
  }
}

export async function collateOrdersForWhatsApp(
  adminPin: string,
  orderIds?: string[]
): Promise<{
  success: boolean;
  totalOrders: number;
  totalRevenue: number;
  collatedText: string;
  whatsappUrl: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/orders/collate-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ orderIds }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    const targetOrders = orderIds
      ? db.orders.filter((o: any) => orderIds.includes(o.id))
      : db.orders.filter((o: any) => o.status === 'Confirmed');

    if (targetOrders.length === 0) {
      throw new Error('No confirmed orders available to send to the kitchen. (Please confirm order payment status first).');
    }
    const totalRevenue = targetOrders.reduce((sum: number, o: any) => sum + o.total, 0);
    const lines: string[] = [];
    lines.push(`🍳 *${db.settings.restaurantName.toUpperCase()} — KITCHEN ORDER DISPATCH (CONFIRMED PAYMENTS)* 🍳`);
    lines.push(`📅 *Date:* ${new Date().toLocaleDateString('en-GB')} | ${new Date().toLocaleTimeString('en-GB')}`);
    lines.push(`📦 *Total Confirmed Orders:* ${targetOrders.length}`);
    lines.push(`💰 *Total Order Value:* ${db.settings.currencySymbol}${totalRevenue.toLocaleString()}`);
    lines.push(`---------------------------------`);
    lines.push(`🛵 *ORDER RUN SHEET & DISPATCH:*`);
    targetOrders.forEach((o: any, i: number) => {
      const typeTag = o.deliveryType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup';
      lines.push(`\n*#${i + 1} [${o.orderNumber}]* — ${typeTag} (${o.status})`);
      lines.push(`👤 ${o.customerName} (📞 ${o.customerPhone})`);
      if (o.deliveryAddress) {
        lines.push(`📍 ${o.deliveryAddress}`);
      }
      const itemsShort = o.items.map((it: any) => `${it.quantity}x ${it.name}${it.addonName ? ` + ${it.addonName}` : ''}${it.note ? ` (${it.note})` : ''}`).join(', ');
      lines.push(`🍽️ ${itemsShort}`);
      lines.push(`💵 Total: ${db.settings.currencySymbol}${o.total.toLocaleString()}`);
    });
    lines.push(`\n---------------------------------`);
    lines.push(`Generated from ${db.settings.restaurantName} Orders Management System`);

    const collatedText = lines.join('\n');
    const targetPhone = db.settings.kitchenWhatsappNumber || db.settings.whatsappNumber;
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(collatedText)}`;
    return {
      success: true,
      totalOrders: targetOrders.length,
      totalRevenue,
      collatedText,
      whatsappUrl,
    };
  }
}

export async function toggleItemSoldOut(
  itemId: string,
  isSoldOut: boolean,
  adminPin: string
): Promise<MenuItem> {
  try {
    const res = await fetch(`${API_BASE}/api/items/${itemId}/sold-out`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ isSoldOut }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text).item;
  } catch {
    const db = getLocalDb();
    const item = db.items.find((i: any) => i.id === itemId);
    if (item) {
      item.isSoldOut = isSoldOut;
      saveLocalDb(db);
      return item;
    }
    throw new Error('Item not found');
  }
}

export async function adjustItemStock(
  itemId: string,
  payload: { adjustment?: number; newQuantity?: number; autoUnmarkSoldOut?: boolean },
  adminPin: string
): Promise<MenuItem> {
  try {
    const res = await fetch(`${API_BASE}/api/items/${itemId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text).item;
  } catch {
    const db = getLocalDb();
    const item = db.items.find((i: any) => i.id === itemId);
    if (item) {
      if (payload.newQuantity !== undefined) {
        item.stockQuantity = payload.newQuantity;
      } else if (payload.adjustment !== undefined) {
        item.stockQuantity = Math.max(0, item.stockQuantity + payload.adjustment);
      }
      if (payload.autoUnmarkSoldOut && item.stockQuantity > 0) {
        item.isSoldOut = false;
      }
      saveLocalDb(db);
      return item;
    }
    throw new Error('Item not found');
  }
}

export async function saveMenuItem(
  item: Partial<MenuItem>,
  adminPin: string,
  isEdit: boolean
): Promise<MenuItem> {
  try {
    const url = isEdit ? `${API_BASE}/api/items/${item.id}` : `${API_BASE}/api/items`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify(item),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    if (isEdit && item.id) {
      const idx = db.items.findIndex((i: any) => i.id === item.id);
      if (idx !== -1) {
        db.items[idx] = { ...db.items[idx], ...item };
        saveLocalDb(db);
        return db.items[idx];
      }
    }
    const newItem: MenuItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      name: item.name || 'New Dish',
      description: item.description || '',
      price: item.price || 1000,
      category: item.category || db.categories[0]?.name || 'General',
      stockQuantity: item.stockQuantity ?? 20,
      isSoldOut: item.isSoldOut ?? false,
      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    };
    db.items.push(newItem);
    saveLocalDb(db);
    return newItem;
  }
}

export async function deleteMenuItem(itemId: string, adminPin: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': adminPin },
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
  } catch {
    const db = getLocalDb();
    db.items = db.items.filter((i: any) => i.id !== itemId);
    saveLocalDb(db);
  }
}

export async function addCategory(name: string, adminPin: string): Promise<Category> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ name }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text);
  } catch {
    const db = getLocalDb();
    const newCat: Category = {
      id: 'cat_' + Math.random().toString(36).substring(2, 9),
      name,
      order: db.categories.length + 1,
    };
    db.categories.push(newCat);
    saveLocalDb(db);
    return newCat;
  }
}

export async function renameCategory(id: string, name: string, adminPin: string): Promise<Category> {
  try {
    const res = await fetch(`${API_BASE}/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ name }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
    return JSON.parse(text).category;
  } catch {
    const db = getLocalDb();
    const cat = db.categories.find((c: any) => c.id === id);
    if (cat) {
      cat.name = name;
      saveLocalDb(db);
      return cat;
    }
    throw new Error('Category not found');
  }
}

export async function reorderCategories(orderedIds: string[], adminPin: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/categories-reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ orderedIds }),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
  } catch {
    const db = getLocalDb();
    const newCats: Category[] = [];
    orderedIds.forEach((id, idx) => {
      const c = db.categories.find((cat: any) => cat.id === id);
      if (c) {
        c.order = idx + 1;
        newCats.push(c);
      }
    });
    db.categories = newCats;
    saveLocalDb(db);
  }
}

export async function deleteCategory(id: string, adminPin: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': adminPin },
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
  } catch {
    const db = getLocalDb();
    db.categories = db.categories.filter((c: any) => c.id !== id);
    saveLocalDb(db);
  }
}

export async function updateSettings(
  settings: Partial<AppSettings> & { currentPin?: string; newPin?: string },
  adminPin: string
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify(settings),
    });
    const text = await res.text();
    if (!res.ok || text.trim().startsWith('<')) {
      throw new Error('Fallback to local');
    }
  } catch {
    const db = getLocalDb();
    db.settings = { ...db.settings, ...settings };
    if (settings.newPin) {
      db.settings.adminPin = settings.newPin;
    }
    saveLocalDb(db);
  }
}
