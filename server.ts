import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(express.json());

// In-memory state cached from DB_FILE
interface Category {
  id: string;
  name: string;
  order: number;
}

interface MenuItem {
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

interface CartItemPayload {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  addonId?: string | null;
  addonName?: string | null;
  addonPrice?: number;
  note?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  notes?: string;
  items: CartItemPayload[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  whatsappMessage?: string;
}

interface Settings {
  restaurantName: string;
  tagline: string;
  whatsappNumber: string;
  adminPin: string;
  isStoreClosed: boolean;
  deliveryFee: number;
  currencySymbol: string;
}

interface Account {
  id: string;
  role: 'admin' | 'staff';
  name: string;
  email: string;
  password: string;
}

interface Database {
  accounts: Account[];
  settings: Settings;
  categories: Category[];
  items: MenuItem[];
  orders: Order[];
}

// Normalizes any phone number input (e.g. 08138788589 -> 2348138788589, +234 813... -> 234813...)
function normalizeWhatsAppNumber(raw: string): string {
  let digits = raw.replace(/[\s\+\-\(\)]/g, '');
  // If Nigerian format starting with 0 and length 11 (e.g. 08138788589, 090..., 070...)
  if (/^0\d{10}$/.test(digits)) {
    digits = '234' + digits.slice(1);
  }
  return digits;
}

// Load database
function loadDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.accounts || parsed.accounts.length === 0) {
        parsed.accounts = [
          {
            id: 'acc_admin',
            role: 'admin',
            name: 'General Manager / Owner',
            email: 'admin@rxcozybite.com',
            password: 'admin1234',
          },
          {
            id: 'acc_staff',
            role: 'staff',
            name: 'Restaurant Staff / Kitchen',
            email: 'staff@rxcozybite.com',
            password: 'staff1234',
          },
        ];
      }
      if (parsed.settings && parsed.settings.restaurantName === 'R&X Cozy Bite') {
        parsed.settings.restaurantName = "Ama's Food & Bites";
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
  }

  // Fallback defaults
  return {
    accounts: [
      {
        id: 'acc_admin',
        role: 'admin',
        name: 'General Manager / Owner',
        email: 'admin@rxcozybite.com',
        password: 'admin1234',
      },
      {
        id: 'acc_staff',
        role: 'staff',
        name: 'Restaurant Staff / Kitchen',
        email: 'staff@rxcozybite.com',
        password: 'staff1234',
      },
    ],
    settings: {
      restaurantName: "Ama's Food & Bites",
      tagline: "From sizzling Jollof and Basmati specials to Pizza, Shawarma, Burgers and more — your favourite meals are now just a tap away.",
      whatsappNumber: "2348138788589",
      adminPin: "1234",
      isStoreClosed: false,
      deliveryFee: 1000,
      currencySymbol: "₦"
    },
    categories: [],
    items: [],
    orders: []
  };
}

let db = loadDb();

function saveDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// SSE (Server-Sent Events) clients for real-time inventory and orders
const sseClients: Response[] = [];

function broadcastEvent(eventType: string, payload: any) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(data);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Helper: check Admin PIN or User Role authorization
function checkAuth(req: Request, requiredRole?: 'admin' | 'staff'): boolean {
  const pinHeader = req.headers['x-admin-pin'] as string;
  const roleHeader = req.headers['x-user-role'] as string;
  const pinBody = req.body?.adminPin;
  const providedPin = pinHeader || pinBody;

  // Master PIN always has full admin access
  if (providedPin === db.settings.adminPin) {
    return true;
  }

  // If a role is provided via authenticated session token
  if (roleHeader === 'admin') {
    return true;
  }
  if (roleHeader === 'staff' && requiredRole !== 'admin') {
    return true;
  }

  return false;
}

// Backward compatible check
function checkAdminPin(req: Request): boolean {
  return checkAuth(req);
}

// Format WhatsApp message helper
function buildWhatsAppMessage(order: Order, settings: Settings): string {
  const lines: string[] = [];
  lines.push(`🍔 *NEW ORDER — ${settings.restaurantName.toUpperCase()}* 🍔`);
  lines.push(`*Order ID:* ${order.orderNumber}`);
  lines.push(`*Date:* ${new Date(order.createdAt).toLocaleString('en-GB')}`);
  lines.push(`---------------------------------`);
  lines.push(`*CUSTOMER DETAILS:*`);
  lines.push(`👤 *Name:* ${order.customerName}`);
  lines.push(`📞 *Phone:* ${order.customerPhone}`);
  lines.push(`📍 *Type:* ${order.deliveryType === 'delivery' ? 'Home Delivery' : 'Pickup at Restaurant'}`);
  if (order.deliveryType === 'delivery' && order.deliveryAddress) {
    lines.push(`🏠 *Address:* ${order.deliveryAddress}`);
  }
  if (order.notes && order.notes.trim()) {
    lines.push(`📝 *Order Note:* ${order.notes.trim()}`);
  }
  lines.push(`---------------------------------`);
  lines.push(`*ITEMS ORDERED:*`);

  order.items.forEach((item, index) => {
    let itemLine = `${index + 1}. *${item.quantity}x ${item.name}*`;
    if (item.addonName) {
      itemLine += ` + _${item.addonName}_`;
    }
    const itemTotal = (item.price + (item.addonPrice || 0)) * item.quantity;
    itemLine += ` — ${settings.currencySymbol}${itemTotal.toLocaleString()}`;
    lines.push(itemLine);

    if (item.note && item.note.trim()) {
      lines.push(`   └ 📌 _Note: ${item.note.trim()}_`);
    }
  });

  lines.push(`---------------------------------`);
  lines.push(`*Subtotal:* ${settings.currencySymbol}${order.subtotal.toLocaleString()}`);
  if (order.deliveryType === 'delivery') {
    lines.push(`*Delivery Fee:* ${settings.currencySymbol}${order.deliveryFee.toLocaleString()}`);
  }
  lines.push(`*GRAND TOTAL:* *${settings.currencySymbol}${order.total.toLocaleString()}*`);
  lines.push(`---------------------------------`);
  lines.push(`Please confirm this order and provide estimated preparation time. Thank you!`);

  return lines.join('\n');
}

// ================= API ROUTES =================

// SSE Endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'connected' })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// GET /api/data (full app bundle: categories, items, public settings)
app.get('/api/data', (_req: Request, res: Response) => {
  const publicSettings = {
    restaurantName: db.settings.restaurantName,
    tagline: db.settings.tagline,
    whatsappNumber: db.settings.whatsappNumber,
    isStoreClosed: db.settings.isStoreClosed,
    deliveryFee: db.settings.deliveryFee,
    currencySymbol: db.settings.currencySymbol || '₦',
  };

  const sortedCategories = [...db.categories].sort((a, b) => a.order - b.order);

  res.json({
    settings: publicSettings,
    categories: sortedCategories,
    items: db.items,
  });
});

// Auth Login (Supports Email+Password for Admin & Restaurant Staff, or PIN)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, pin } = req.body;

  // Support PIN login
  if (pin) {
    if (pin === db.settings.adminPin) {
      const adminAcc = db.accounts?.find((a) => a.role === 'admin') || {
        id: 'acc_admin',
        role: 'admin' as const,
        name: 'General Manager / Owner',
        email: 'admin@rxcozybite.com',
      };
      return res.json({
        success: true,
        user: {
          id: adminAcc.id,
          role: 'admin',
          name: adminAcc.name,
          email: adminAcc.email,
        },
        token: db.settings.adminPin,
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
  }

  // Email and password login
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const account = db.accounts?.find(
    (a) => a.email.toLowerCase() === cleanEmail && a.password === String(password)
  );

  if (account) {
    return res.json({
      success: true,
      user: {
        id: account.id,
        role: account.role,
        name: account.name,
        email: account.email,
      },
      token: db.settings.adminPin,
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid email or password. Default logins: admin@rxcozybite.com / admin1234 or staff@rxcozybite.com / staff1234',
  });
});

// Admin verify PIN (backwards compatibility)
app.post('/api/admin/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, message: 'PIN required' });
  }
  if (pin === db.settings.adminPin) {
    return res.json({ success: true, message: 'PIN verified' });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// Accounts Management: GET & PUT
app.get('/api/auth/accounts', (req: Request, res: Response) => {
  if (!checkAuth(req, 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: admin access required' });
  }
  res.json(db.accounts || []);
});

app.put('/api/auth/accounts', (req: Request, res: Response) => {
  if (!checkAuth(req, 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: admin access required' });
  }

  const { accounts } = req.body;
  if (!Array.isArray(accounts)) {
    return res.status(400).json({ error: 'Accounts array required' });
  }

  accounts.forEach((incoming: any) => {
    const existing = db.accounts?.find((a) => a.id === incoming.id || a.role === incoming.role);
    if (existing) {
      if (incoming.email && String(incoming.email).trim()) {
        existing.email = String(incoming.email).trim().toLowerCase();
      }
      if (incoming.name && String(incoming.name).trim()) {
        existing.name = String(incoming.name).trim();
      }
      if (incoming.password && String(incoming.password).trim()) {
        existing.password = String(incoming.password).trim();
      }
    }
  });

  saveDb();
  res.json({ success: true, message: 'Accounts updated successfully', accounts: db.accounts });
});

// Settings: GET & PUT
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({
    restaurantName: db.settings.restaurantName,
    tagline: db.settings.tagline,
    whatsappNumber: db.settings.whatsappNumber,
    isStoreClosed: db.settings.isStoreClosed,
    deliveryFee: db.settings.deliveryFee,
    currencySymbol: db.settings.currencySymbol || '₦',
  });
});

app.put('/api/settings', (req: Request, res: Response) => {
  if (!checkAuth(req, 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: admin access required to modify settings' });
  }

  const { restaurantName, tagline, whatsappNumber, isStoreClosed, deliveryFee, newPin, currentPin } = req.body;

  // Seamless WhatsApp Number normalization and validation
  if (whatsappNumber !== undefined) {
    const normalized = normalizeWhatsAppNumber(String(whatsappNumber));
    if (!/^[1-9]\d{7,15}$/.test(normalized)) {
      return res.status(400).json({
        error: 'Invalid WhatsApp number. Please enter a valid phone number (e.g. 08138788589, +2348138788589, or 2348138788589).',
      });
    }
    db.settings.whatsappNumber = normalized;
  }

  if (restaurantName !== undefined && String(restaurantName).trim()) {
    db.settings.restaurantName = String(restaurantName).trim();
  }

  if (tagline !== undefined) {
    db.settings.tagline = String(tagline).trim();
  }

  if (isStoreClosed !== undefined) {
    db.settings.isStoreClosed = Boolean(isStoreClosed);
  }

  if (deliveryFee !== undefined && !isNaN(Number(deliveryFee))) {
    db.settings.deliveryFee = Math.max(0, Number(deliveryFee));
  }

  // Handle PIN change if requested
  if (newPin) {
    if (!currentPin || currentPin !== db.settings.adminPin) {
      return res.status(400).json({ error: 'Current PIN is incorrect.' });
    }
    if (String(newPin).length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 digits.' });
    }
    db.settings.adminPin = String(newPin);
  }

  saveDb();
  broadcastEvent('settings_updated', {
    restaurantName: db.settings.restaurantName,
    tagline: db.settings.tagline,
    whatsappNumber: db.settings.whatsappNumber,
    isStoreClosed: db.settings.isStoreClosed,
    deliveryFee: db.settings.deliveryFee,
  });

  res.json({ success: true, message: 'Settings updated successfully' });
});

// Categories endpoints
app.get('/api/categories', (_req: Request, res: Response) => {
  const sorted = [...db.categories].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

app.post('/api/categories', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const trimmed = name.trim();
  const exists = db.categories.some(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: `Category "${trimmed}" already exists (case-insensitive duplicate).` });
  }

  const maxOrder = db.categories.reduce((max, c) => Math.max(max, c.order || 0), 0);
  const newCategory: Category = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: trimmed,
    order: maxOrder + 1,
  };

  db.categories.push(newCategory);
  saveDb();
  broadcastEvent('categories_updated', db.categories);

  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const trimmed = name.trim();
  const cat = db.categories.find((c) => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Check duplicate with other category
  const duplicate = db.categories.some(
    (c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return res.status(400).json({ error: `Category "${trimmed}" already exists.` });
  }

  const oldName = cat.name;
  cat.name = trimmed;

  // Cascade: update every menu item that belongs to this category!
  let affectedItems = 0;
  db.items.forEach((item) => {
    if (item.category === oldName) {
      item.category = trimmed;
      affectedItems++;
    }
    if (item.allowAddonCategory === oldName) {
      item.allowAddonCategory = trimmed;
    }
  });

  saveDb();
  broadcastEvent('categories_updated', db.categories);
  broadcastEvent('items_updated', db.items);

  res.json({ success: true, category: cat, affectedItems });
});

app.put('/api/categories-reorder', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array required' });
  }

  orderedIds.forEach((id: string, index: number) => {
    const cat = db.categories.find((c) => c.id === id);
    if (cat) {
      cat.order = index + 1;
    }
  });

  saveDb();
  broadcastEvent('categories_updated', db.categories);
  res.json({ success: true, categories: db.categories });
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { id } = req.params;
  const cat = db.categories.find((c) => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Count items assigned to this category
  const itemCount = db.items.filter((item) => item.category === cat.name).length;
  if (itemCount > 0) {
    return res.status(400).json({
      error: `Cannot delete category "${cat.name}". It contains ${itemCount} menu item(s). Move or delete them first.`,
    });
  }

  db.categories = db.categories.filter((c) => c.id !== id);
  saveDb();
  broadcastEvent('categories_updated', db.categories);
  res.json({ success: true, message: `Category "${cat.name}" deleted` });
});

// Menu Items endpoints
app.get('/api/items', (_req: Request, res: Response) => {
  res.json(db.items);
});

app.post('/api/items', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { name, description, price, category, stockQuantity, isSoldOut, allowAddonCategory, isAddonRequired, imageUrl } = req.body;

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const stock = Number(stockQuantity) >= 0 ? Number(stockQuantity) : 10;
  const newItem: MenuItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: String(name).trim(),
    description: String(description || '').trim(),
    price: Math.max(0, Number(price)),
    category: String(category).trim(),
    stockQuantity: stock,
    isSoldOut: Boolean(isSoldOut) || stock === 0,
    allowAddonCategory: allowAddonCategory ? String(allowAddonCategory).trim() : null,
    isAddonRequired: Boolean(isAddonRequired),
    imageUrl: imageUrl ? String(imageUrl).trim() : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  };

  db.items.push(newItem);
  saveDb();
  broadcastEvent('items_updated', db.items);
  res.status(201).json(newItem);
});

app.put('/api/items/:id', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { id } = req.params;
  const item = db.items.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { name, description, price, category, stockQuantity, isSoldOut, allowAddonCategory, isAddonRequired, imageUrl } = req.body;

  if (name !== undefined) item.name = String(name).trim();
  if (description !== undefined) item.description = String(description).trim();
  if (price !== undefined) item.price = Math.max(0, Number(price));
  if (category !== undefined) item.category = String(category).trim();
  if (stockQuantity !== undefined) {
    item.stockQuantity = Math.max(0, Number(stockQuantity));
    if (item.stockQuantity === 0) {
      item.isSoldOut = true;
    }
  }
  if (isSoldOut !== undefined) item.isSoldOut = Boolean(isSoldOut);
  if (allowAddonCategory !== undefined) {
    item.allowAddonCategory = allowAddonCategory ? String(allowAddonCategory).trim() : null;
  }
  if (isAddonRequired !== undefined) item.isAddonRequired = Boolean(isAddonRequired);
  if (imageUrl !== undefined) item.imageUrl = String(imageUrl).trim();

  saveDb();
  broadcastEvent('items_updated', db.items);
  res.json(item);
});

// Sold-out toggle strictly checked server-side
app.patch('/api/items/:id/sold-out', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: only administrators can change sold out status' });
  }

  const { id } = req.params;
  const item = db.items.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { isSoldOut } = req.body;
  item.isSoldOut = Boolean(isSoldOut);
  saveDb();

  broadcastEvent('stock_updated', {
    itemId: item.id,
    stockQuantity: item.stockQuantity,
    isSoldOut: item.isSoldOut,
  });
  broadcastEvent('items_updated', db.items);

  res.json({ success: true, item });
});

// Real-time Stock adjustment endpoint
app.patch('/api/items/:id/stock', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { id } = req.params;
  const item = db.items.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { adjustment, newQuantity } = req.body;
  if (newQuantity !== undefined) {
    item.stockQuantity = Math.max(0, Number(newQuantity));
  } else if (adjustment !== undefined) {
    item.stockQuantity = Math.max(0, item.stockQuantity + Number(adjustment));
  }

  // Auto-mark sold out if 0 stock
  if (item.stockQuantity === 0) {
    item.isSoldOut = true;
  } else if (req.body.autoUnmarkSoldOut && item.isSoldOut && item.stockQuantity > 0) {
    item.isSoldOut = false;
  }

  saveDb();
  broadcastEvent('stock_updated', {
    itemId: item.id,
    stockQuantity: item.stockQuantity,
    isSoldOut: item.isSoldOut,
  });
  broadcastEvent('items_updated', db.items);

  res.json({ success: true, item });
});

// Quick Category Reassignment endpoint for staff & admin
app.patch('/api/items/:id/category', (req: Request, res: Response) => {
  if (!checkAuth(req)) {
    return res.status(403).json({ error: 'Unauthorized: login required' });
  }

  const { id } = req.params;
  const item = db.items.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { category } = req.body;
  if (!category || !String(category).trim()) {
    return res.status(400).json({ error: 'Category is required' });
  }

  item.category = String(category).trim();
  saveDb();
  broadcastEvent('items_updated', db.items);

  res.json({ success: true, item });
});

app.delete('/api/items/:id', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { id } = req.params;
  const idx = db.items.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const removed = db.items.splice(idx, 1)[0];
  saveDb();
  broadcastEvent('items_updated', db.items);
  res.json({ success: true, removed });
});

// Orders & Collation
app.get('/api/orders', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }
  // Return newest first
  const sorted = [...db.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sorted);
});

// Place new order with inventory decrementing and WhatsApp link generation
app.post('/api/orders', (req: Request, res: Response) => {
  if (db.settings.isStoreClosed) {
    return res.status(400).json({ error: 'Store is temporarily closed. Orders cannot be accepted right now.' });
  }

  const { customerName, customerPhone, deliveryType, deliveryAddress, notes, items } = req.body;

  if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Customer name, phone number, and at least one item are required.' });
  }

  // Validate phone format
  const cleanPhone = String(customerPhone).replace(/\s+/g, '');

  // Calculate subtotals and check inventory
  let subtotal = 0;
  const processedItems: CartItemPayload[] = [];
  const inventoryDeductions: { item: MenuItem; qty: number }[] = [];

  for (const cartItem of items) {
    const menuItem = db.items.find((i) => i.id === cartItem.itemId);
    if (!menuItem) {
      return res.status(400).json({ error: `Item "${cartItem.name}" is no longer on the menu.` });
    }

    if (menuItem.isSoldOut || menuItem.stockQuantity <= 0) {
      return res.status(400).json({ error: `Sorry, "${menuItem.name}" is currently sold out.` });
    }

    const qty = Math.max(1, Number(cartItem.quantity) || 1);
    if (qty > menuItem.stockQuantity) {
      return res.status(400).json({
        error: `Only ${menuItem.stockQuantity} portion(s) of "${menuItem.name}" remaining in stock.`,
      });
    }

    inventoryDeductions.push({ item: menuItem, qty });

    let addonName: string | null = null;
    let addonPrice = 0;

    // Check add-on if provided
    if (cartItem.addonId) {
      const addonItem = db.items.find((i) => i.id === cartItem.addonId);
      if (addonItem) {
        if (addonItem.isSoldOut || addonItem.stockQuantity <= 0) {
          return res.status(400).json({ error: `Add-on "${addonItem.name}" is currently sold out.` });
        }
        addonName = addonItem.name;
        addonPrice = addonItem.price;
        inventoryDeductions.push({ item: addonItem, qty });
      }
    }

    const lineTotal = (menuItem.price + addonPrice) * qty;
    subtotal += lineTotal;

    processedItems.push({
      itemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
      addonId: cartItem.addonId || null,
      addonName,
      addonPrice,
      note: cartItem.note ? String(cartItem.note).trim() : '',
    });
  }

  const isDelivery = deliveryType === 'delivery';
  const deliveryFee = isDelivery ? db.settings.deliveryFee : 0;
  const grandTotal = subtotal + deliveryFee;

  // Deduct inventory in real-time
  inventoryDeductions.forEach(({ item, qty }) => {
    item.stockQuantity = Math.max(0, item.stockQuantity - qty);
    if (item.stockQuantity === 0) {
      item.isSoldOut = true;
    }
  });

  // Generate unique readable order number e.g. RX-4982
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `RX-${randNum}`;

  const newOrder: Order = {
    id: `ord_${Date.now()}_${randNum}`,
    orderNumber,
    customerName: String(customerName).trim(),
    customerPhone: cleanPhone,
    deliveryType: isDelivery ? 'delivery' : 'pickup',
    deliveryAddress: isDelivery ? String(deliveryAddress || '').trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    items: processedItems,
    subtotal,
    deliveryFee,
    total: grandTotal,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  const whatsappMessage = buildWhatsAppMessage(newOrder, db.settings);
  newOrder.whatsappMessage = whatsappMessage;

  db.orders.push(newOrder);
  saveDb();

  // Broadcast real-time SSE notifications
  broadcastEvent('items_updated', db.items);
  broadcastEvent('order_created', {
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    total: newOrder.total,
    customerName: newOrder.customerName,
  });

  // Build clean wa.me link: https://wa.me/[phone]?text=[encoded message]
  const targetPhone = db.settings.whatsappNumber;
  const encodedMsg = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMsg}`;

  res.status(201).json({
    success: true,
    order: newOrder,
    whatsappUrl,
    whatsappMessage,
  });
});

// Update order status (Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered -> Cancelled)
app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = status;
  saveDb();
  broadcastEvent('order_updated', { orderId: order.id, status: order.status });
  res.json({ success: true, order });
});

// Collate Orders for Kitchen & Dispatch WhatsApp message
app.post('/api/orders/collate-whatsapp', (req: Request, res: Response) => {
  if (!checkAdminPin(req)) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin PIN' });
  }

  const { orderIds } = req.body;
  let targetOrders = db.orders;

  if (Array.isArray(orderIds) && orderIds.length > 0) {
    targetOrders = db.orders.filter((o) => orderIds.includes(o.id));
  } else {
    // Collate all active non-delivered and non-cancelled orders by default
    targetOrders = db.orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  }

  if (targetOrders.length === 0) {
    return res.status(400).json({ error: 'No orders available to collate.' });
  }

  // Aggregate item breakdown
  const itemCounts: { [name: string]: number } = {};
  let totalRevenue = 0;

  targetOrders.forEach((o) => {
    totalRevenue += o.total;
    o.items.forEach((item) => {
      let label = item.name;
      if (item.addonName) {
        label += ` (+ ${item.addonName})`;
      }
      itemCounts[label] = (itemCounts[label] || 0) + item.quantity;
    });
  });

  const lines: string[] = [];
  lines.push(`🔥 *${db.settings.restaurantName.toUpperCase()} — BATCH ORDER COLLATION* 🔥`);
  lines.push(`📅 *Date:* ${new Date().toLocaleDateString('en-GB')} | ${new Date().toLocaleTimeString('en-GB')}`);
  lines.push(`📦 *Total Active Orders:* ${targetOrders.length}`);
  lines.push(`💰 *Total Order Value:* ${db.settings.currencySymbol}${totalRevenue.toLocaleString()}`);
  lines.push(`---------------------------------`);
  lines.push(`🍳 *KITCHEN PREPARATION SUMMARY:*`);

  Object.entries(itemCounts).forEach(([name, count], idx) => {
    lines.push(`• [${count}x] ${name}`);
  });

  lines.push(`---------------------------------`);
  lines.push(`🛵 *ORDER RUN SHEET & DISPATCH:*`);
  targetOrders.forEach((o, i) => {
    const typeTag = o.deliveryType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup';
    lines.push(`\n*#${i + 1} [${o.orderNumber}]* — ${typeTag} (${o.status})`);
    lines.push(`👤 ${o.customerName} (📞 ${o.customerPhone})`);
    if (o.deliveryAddress) {
      lines.push(`📍 ${o.deliveryAddress}`);
    }
    const itemsShort = o.items.map((it) => `${it.quantity}x ${it.name}${it.addonName ? ` + ${it.addonName}` : ''}${it.note ? ` (${it.note})` : ''}`).join(', ');
    lines.push(`🍽️ ${itemsShort}`);
    lines.push(`💵 Total: ${db.settings.currencySymbol}${o.total.toLocaleString()}`);
  });

  lines.push(`\n---------------------------------`);
  lines.push(`Generated from ${db.settings.restaurantName} Orders Management System`);

  const collatedText = lines.join('\n');
  const targetPhone = db.settings.whatsappNumber;
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(collatedText)}`;

  res.json({
    success: true,
    totalOrders: targetOrders.length,
    totalRevenue,
    collatedText,
    whatsappUrl,
  });
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  startServer();
} else if (!process.env.VERCEL) {
  startServer();
}

export default app;
