import React, { useState, useEffect } from 'react';
import {
  Store,
  Phone,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Truck,
  ExternalLink,
  Shield,
  ChefHat,
  Users,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { AppSettings, UserAccount } from '../../types';
import { updateSettings, fetchAccounts, updateAccounts } from '../../api';

interface SettingsTabProps {
  settings: AppSettings;
  adminPin: string;
  currentUser?: UserAccount | null;
  onRefreshData: () => void;
  onPinChanged: (newPin: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  adminPin,
  currentUser,
  onRefreshData,
  onPinChanged,
}) => {
  const isManager = currentUser?.role === 'manager';
  // General settings state
  const [restaurantName, setRestaurantName] = useState<string>(settings.restaurantName);
  const [tagline, setTagline] = useState<string>(settings.tagline);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(settings.whatsappNumber);
  const [deliveryFee, setDeliveryFee] = useState<string>(String(settings.deliveryFee || 1000));
  const [isStoreClosed, setIsStoreClosed] = useState<boolean>(settings.isStoreClosed);

  // Accounts state (Admin & Staff)
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [adminEmail, setAdminEmail] = useState<string>('admin@rxcozybite.com');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('staff@rxcozybite.com');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [showAdminPass, setShowAdminPass] = useState<boolean>(false);
  const [showStaffPass, setShowStaffPass] = useState<boolean>(false);

  // PIN change state
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');

  // UI state
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [savingGeneral, setSavingGeneral] = useState<boolean>(false);
  const [savingAccounts, setSavingAccounts] = useState<boolean>(false);
  const [savingPin, setSavingPin] = useState<boolean>(false);

  // Load accounts
  useEffect(() => {
    async function loadAccs() {
      try {
        const data = await fetchAccounts(adminPin);
        setAccounts(data);
        const adminAcc = data.find((a) => a.role === 'admin');
        const staffAcc = data.find((a) => a.role === 'staff');
        if (adminAcc) {
          setAdminEmail(adminAcc.email);
          setAdminPassword(adminAcc.password || '');
        }
        if (staffAcc) {
          setStaffEmail(staffAcc.email);
          setStaffPassword(staffAcc.password || '');
        }
      } catch (err) {
        console.error('Could not fetch accounts:', err);
      }
    }
    loadAccs();
  }, [adminPin]);

  // Clean, forgiving phone normalization helper
  const normalizePhone = (num: string): string => {
    let clean = num.replace(/[\s\+\-\(\)]/g, '');
    if (/^0\d{10}$/.test(clean)) {
      clean = '234' + clean.slice(1);
    }
    return clean;
  };

  const previewNormalizedPhone = normalizePhone(whatsappNumber);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);

    const normalized = normalizePhone(whatsappNumber);
    if (!/^[1-9]\d{7,15}$/.test(normalized)) {
      setGeneralError('Please enter a valid phone number (e.g. 08138788589 or 2348138788589).');
      return;
    }

    const feeNum = parseFloat(deliveryFee);
    if (isNaN(feeNum) || feeNum < 0) {
      setGeneralError('Please enter a valid delivery fee.');
      return;
    }

    setSavingGeneral(true);
    try {
      await updateSettings(
        {
          restaurantName: restaurantName.trim(),
          tagline: tagline.trim(),
          whatsappNumber: normalized,
          deliveryFee: feeNum,
          isStoreClosed,
        },
        adminPin
      );

      setWhatsappNumber(normalized);
      setGeneralSuccess('Store settings and WhatsApp number updated successfully!');
      onRefreshData();
      setTimeout(() => setGeneralSuccess(null), 3000);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to update settings');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    setAccountSuccess(null);

    if (!adminEmail.trim() || !staffEmail.trim()) {
      setAccountError('Both Admin and Staff emails are required.');
      return;
    }

    if (!adminPassword || adminPassword.length < 4) {
      setAccountError('Admin password must be at least 4 characters.');
      return;
    }

    if (!staffPassword || staffPassword.length < 4) {
      setAccountError('Staff password must be at least 4 characters.');
      return;
    }

    setSavingAccounts(true);
    try {
      const updatedAccounts: UserAccount[] = [
        {
          id: 'acc_admin',
          role: 'admin',
          name: 'General Manager / Owner',
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword.trim(),
        },
        {
          id: 'acc_staff',
          role: 'staff',
          name: 'Restaurant Staff / Kitchen',
          email: staffEmail.trim().toLowerCase(),
          password: staffPassword.trim(),
        },
      ];

      await updateAccounts(updatedAccounts, adminPin);
      setAccounts(updatedAccounts);
      setAccountSuccess('Admin and Staff credentials saved successfully! Staff can now log in with their email and password.');
      setTimeout(() => setAccountSuccess(null), 4000);
    } catch (err: any) {
      setAccountError(err.message || 'Failed to update user accounts');
    } finally {
      setSavingAccounts(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!currentPin) {
      setPinError('Current PIN is required.');
      return;
    }

    if (currentPin !== adminPin) {
      setPinError('Current PIN is incorrect.');
      return;
    }

    if (newPin.length < 4) {
      setPinError('New PIN must be at least 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    setSavingPin(true);
    try {
      await updateSettings(
        {
          currentPin,
          newPin,
        },
        adminPin
      );

      setPinSuccess('Master PIN changed successfully!');
      onPinChanged(newPin);
      sessionStorage.setItem('choporder_admin_pin', newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => setPinSuccess(null), 4000);
    } catch (err: any) {
      setPinError(err.message || 'Failed to change PIN');
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. WhatsApp Number & Restaurant Details Section */}
      <form
        onSubmit={handleSaveGeneral}
        className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6"
      >
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-slate-900">
                WhatsApp Order Line & Store Information
              </h3>
              <p className="text-xs text-slate-500">
                Your WhatsApp number is <strong>100% editable</strong>. Orders placed on the website will be dispatched to this line.
              </p>
            </div>
          </div>
        </div>

        {generalError && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {generalSuccess && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{generalSuccess}</span>
          </div>
        )}

        {/* WhatsApp Line Editor */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            WhatsApp Receiving Phone Number *
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 08138788589 or 2348138788589"
                className="w-full text-sm font-mono font-bold px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00875A]"
              />
            </div>

            <a
              href={`https://wa.me/${previewNormalizedPhone}?text=${encodeURIComponent(
                "Hello, testing WhatsApp order line for " + restaurantName
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-[#00875A] hover:bg-[#00704A] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shrink-0 shadow-xs"
              title="Test if this WhatsApp number opens correctly"
            >
              <span>Test WhatsApp Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1">
              <span className="text-emerald-700 font-bold">Auto-conversion:</span> You can type your number as <code className="bg-white px-1.5 py-0.5 rounded border font-mono">08138788589</code> or <code className="bg-white px-1.5 py-0.5 rounded border font-mono">2348138788589</code>.
            </p>
            <p className="text-slate-600 font-mono">
              Active WhatsApp URL target: <strong className="text-emerald-800">https://wa.me/{previewNormalizedPhone}</strong>
            </p>
          </div>
        </div>

        {/* Temporarily close store toggle */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isStoreClosed ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-sm text-slate-900 block font-display">
                Kitchen Status: Temporarily Pause Orders
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle this to temporarily close online ordering (e.g. at end of day or rush hour).
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isStoreClosed}
                onChange={(e) => setIsStoreClosed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
          {isStoreClosed && (
            <div className="mt-2 text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Kitchen is currently marked CLOSED on the customer menu.</span>
            </div>
          )}
        </div>

        {/* Restaurant Name & Tagline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Restaurant Brand Name *</span>
            </label>
            <input
              type="text"
              required
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard Delivery Fee (₦) *</span>
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>Homepage Slogan / Tagline</span>
          </label>
          <textarea
            rows={2}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
          />
        </div>

        <button
          type="submit"
          disabled={savingGeneral}
          className="bg-[#9D1D11] hover:bg-[#80170C] text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {savingGeneral ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Restaurant & WhatsApp Settings</span>
            </>
          )}
        </button>
      </form>

      {/* 2. Dual Logins (Admin & Restaurant Staff Accounts) */}
      <form
        onSubmit={handleSaveAccounts}
        className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6"
      >
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-slate-900">
                Staff & Admin Accounts (Two Email Logins)
              </h3>
              <p className="text-xs text-slate-500">
                Configure separate email logins and passwords for the General Manager (Admin) and Restaurant Staff.
              </p>
            </div>
          </div>
        </div>

        {accountError && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{accountError}</span>
          </div>
        )}

        {accountSuccess && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{accountSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account 1: Admin */}
          <div className="p-4 sm:p-5 bg-red-50/40 rounded-2xl border border-red-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#9D1D11]" />
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 font-display">
                  1. Admin / Manager Login
                </h4>
                <span className="text-[11px] text-slate-500">Full system access</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Email *
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Password *
              </label>
              <div className="relative">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="admin1234"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Account 2: Restaurant Staff */}
          <div className="p-4 sm:p-5 bg-amber-50/40 rounded-2xl border border-amber-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-700" />
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 font-display">
                  2. Restaurant Staff Login
                </h4>
                <span className="text-[11px] text-slate-500">Kitchen & menu operations</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Staff Email *
              </label>
              <input
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Staff Password *
              </label>
              <div className="relative">
                <input
                  type={showStaffPass ? 'text' : 'password'}
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="staff1234"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPass(!showStaffPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showStaffPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingAccounts}
          className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {savingAccounts ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Update Admin & Staff Logins</span>
            </>
          )}
        </button>
      </form>

      {/* 3. Master PIN Change Form (Restricted for Admin Manager) */}
      {!isManager ? (
        <form
          onSubmit={handleChangePin}
          className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black font-display text-slate-900">
                  Change Master Admin PIN
                </h3>
                <p className="text-xs text-slate-500">
                  Update the 4-digit master PIN used for quick bypass.
                </p>
              </div>
            </div>
          </div>

          {pinError && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {pinSuccess && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pinSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current PIN *
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="••••"
                className="w-full text-xs sm:text-sm font-mono tracking-widest px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New PIN (at least 4 digits) *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  minLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-xs sm:text-sm font-mono tracking-widest px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New PIN *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  minLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-xs sm:text-sm font-mono tracking-widest px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPin}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {savingPin ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Save Master PIN</span>
            )}
          </button>
        </form>
      ) : (
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-slate-700" />
          </div>
          <h3 className="text-base font-black font-display text-slate-900">
            Master PIN & Security Protected
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            As an Admin Manager, you have full access to update store settings, menu items, categories, and manage orders. However, viewing, changing, or resetting the <strong>Master Admin PIN</strong> is restricted exclusively to the Master Admin / Owner.
          </p>
        </div>
      )}
    </div>
  );
};
