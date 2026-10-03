import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, X, Shield, ChefHat, Eye, EyeOff } from 'lucide-react';
import { loginAdminOrStaff } from '../api';
import { UserAccount } from '../types';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user?: UserAccount) => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState<string>('admin@rxcozybite.com');
  const [password, setPassword] = useState<string>('admin1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectRolePreset = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@rxcozybite.com');
      setPassword('admin1234');
    } else {
      setEmail('staff@rxcozybite.com');
      setPassword('staff1234');
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'email') {
        if (!email.trim() || !password) {
          setError('Please enter both email and password.');
          setLoading(false);
          return;
        }

        const res = await loginAdminOrStaff({
          email: email.trim(),
          password,
        });

        sessionStorage.setItem('choporder_admin_pin', res.token);
        sessionStorage.setItem('choporder_user', JSON.stringify(res.user));
        onSuccess(res.token, res.user);
      } else {
        if (!pin.trim()) {
          setError('Please enter your 4-digit admin PIN.');
          setLoading(false);
          return;
        }

        const res = await loginAdminOrStaff({ pin: pin.trim() });
        sessionStorage.setItem('choporder_admin_pin', res.token);
        sessionStorage.setItem('choporder_user', JSON.stringify(res.user));
        onSuccess(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-3 border border-amber-300 shadow-xs">
          <Lock className="w-6 h-6 text-[#9D1D11]" />
        </div>

        <div className="text-center mb-5">
          <h3 className="text-xl font-black font-display text-slate-900 tracking-tight">
            Staff & Admin Portal
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your email and password to access orders, categories, and inventory.
          </p>
        </div>

        {/* Tab Switcher: Email vs PIN */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('email')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              authMode === 'email'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Email Login (Admin & Staff)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('pin')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              authMode === 'pin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Master PIN (Quick)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {authMode === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Demo Pre-fill presets */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Account Type:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectRolePreset('admin')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 transition-all cursor-pointer ${
                    email === 'admin@rxcozybite.com'
                      ? 'border-[#9D1D11] bg-red-50/50 text-[#9D1D11] ring-1 ring-[#9D1D11]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Shield className="w-4 h-4 text-[#9D1D11] shrink-0" />
                  <div>
                    <span className="block font-extrabold leading-tight">Admin / Manager</span>
                    <span className="text-[10px] text-slate-400 font-normal">Full settings access</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRolePreset('staff')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 transition-all cursor-pointer ${
                    email === 'staff@rxcozybite.com'
                      ? 'border-[#9D1D11] bg-red-50/50 text-[#9D1D11] ring-1 ring-[#9D1D11]'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <ChefHat className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="block font-extrabold leading-tight">Restaurant Staff</span>
                    <span className="text-[10px] text-slate-400 font-normal">Orders & kitchen only</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@restaurant.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Password *</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9D1D11] hover:bg-[#80170C] text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Log In to Dashboard</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center text-xs text-slate-500 mb-2">
              Default Master PIN is <code className="bg-slate-100 font-mono px-1 py-0.5 rounded font-bold">1234</code>
            </div>

            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 text-center tracking-[0.5em] text-xl font-bold font-mono border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9D1D11]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9D1D11] hover:bg-[#80170C] text-white py-3 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Unlock with PIN</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
