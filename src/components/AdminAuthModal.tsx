import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, X, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types/telecom';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthenticated: (adminUser: User) => void;
  adminUserTemplate: User;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAdminAuthenticated,
  adminUserTemplate,
}) => {
  const [username, setUsername] = useState('01844868379');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Check strict credentials requested by user:
    // User: 01844868379, Pass: mnb229Am
    if (cleanUsername === '01844868379' && cleanPassword === 'mnb229Am') {
      const verifiedAdmin: User = {
        ...adminUserTemplate,
        phone: '01844868379',
        role: 'admin',
        password: 'mnb229Am',
      };
      onAdminAuthenticated(verifiedAdmin);
      onClose();
    } else {
      setError('ইউজার নাম্বার বা পাসওয়ার্ড সঠিক নয়! এডমিন তথ্যাদি পুনরায় যাচাই করুন।');
    }
  };

  const handleQuickFillAdmin = () => {
    setUsername('01844868379');
    setPassword('mnb229Am');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                এডমিন প্যানেল সিকিউরিটি
              </h4>
              <p className="text-[11px] text-slate-500">অনুমোদিত এডমিন লগইন ভেরিফিকেশন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              এডমিন ইউজার / মোবাইল
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="01844868379"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono-nums font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 font-mono outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm text-xs sm:text-sm"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>এডমিন প্যানেলে প্রবেশ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Fill for Owner */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleQuickFillAdmin}
            className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline"
          >
            এডমিন ক্রেডেনশিয়াল অটো-ফিল করুন (01844868379 / mnb229Am)
          </button>
        </div>

      </div>
    </div>
  );
};
