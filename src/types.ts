export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  isSoldOut: boolean;
  allowAddonCategory?: string | null;
  isAddonRequired?: boolean;
  imageUrl?: string;
}

export interface CartItem {
  id: string; // unique cart line ID (combines itemId, addonId, note)
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  addonId?: string | null;
  addonName?: string | null;
  addonPrice?: number;
  note?: string;
  imageUrl?: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  addonId?: string | null;
  addonName?: string | null;
  addonPrice?: number;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  whatsappMessage?: string;
}

export interface AppSettings {
  restaurantName: string;
  tagline: string;
  whatsappNumber: string;
  isStoreClosed: boolean;
  deliveryFee: number;
  currencySymbol: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
}

export type UserRole = 'admin' | 'staff';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}

export interface AuthSession {
  user: UserAccount;
  token: string;
}

