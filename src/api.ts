import { AppSettings, Category, MenuItem, Order, UserAccount } from './types';

export const API_BASE = '';

export async function fetchAppData(): Promise<{
  settings: AppSettings;
  categories: Category[];
  items: MenuItem[];
}> {
  const res = await fetch(`${API_BASE}/api/data`);
  if (!res.ok) {
    throw new Error('Failed to load menu data');
  }
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Invalid login credentials');
  }
  return data;
}

export async function fetchAccounts(adminPin: string): Promise<UserAccount[]> {
  const res = await fetch(`${API_BASE}/api/auth/accounts`, {
    headers: { 'x-admin-pin': adminPin },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch user accounts');
  }
  return res.json();
}

export async function updateAccounts(
  accounts: UserAccount[],
  adminPin: string
): Promise<{ success: boolean; accounts: UserAccount[] }> {
  const res = await fetch(`${API_BASE}/api/auth/accounts`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ accounts }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update accounts');
  }
  return data;
}

export async function moveItemCategory(
  itemId: string,
  newCategory: string,
  adminPin: string
): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/api/items/${itemId}/category`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ category: newCategory }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update category');
  }
  return data.item;
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
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit order');
  }
  return data;
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/admin/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  return Boolean(data.success);
}

export async function fetchOrders(adminPin: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    headers: { 'x-admin-pin': adminPin },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Unauthorized to fetch orders');
  }
  return res.json();
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  adminPin: string
): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update order status');
  }
  return data.order;
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
  const res = await fetch(`${API_BASE}/api/orders/collate-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ orderIds }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to collate orders');
  }
  return data;
}

export async function toggleItemSoldOut(
  itemId: string,
  isSoldOut: boolean,
  adminPin: string
): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/api/items/${itemId}/sold-out`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ isSoldOut }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to toggle sold-out status');
  }
  return data.item;
}

export async function adjustItemStock(
  itemId: string,
  payload: { adjustment?: number; newQuantity?: number; autoUnmarkSoldOut?: boolean },
  adminPin: string
): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/api/items/${itemId}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update item stock');
  }
  return data.item;
}

export async function saveMenuItem(
  item: Partial<MenuItem>,
  adminPin: string,
  isEdit: boolean
): Promise<MenuItem> {
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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save menu item');
  }
  return data;
}

export async function deleteMenuItem(itemId: string, adminPin: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': adminPin },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete menu item');
  }
}

export async function addCategory(name: string, adminPin: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create category');
  }
  return data;
}

export async function renameCategory(id: string, name: string, adminPin: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to rename category');
  }
  return data.category;
}

export async function reorderCategories(orderedIds: string[], adminPin: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/categories-reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to reorder categories');
  }
}

export async function deleteCategory(id: string, adminPin: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/categories/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': adminPin },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete category');
  }
}

export async function updateSettings(
  settings: Partial<AppSettings> & { currentPin?: string; newPin?: string },
  adminPin: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update settings');
  }
}
