import React from 'react';
import { Radio, Wallet, Shield, User as UserIcon, Plus, Bell, MoreVertical } from 'lucide-react';
import { User } from '../types/telecom';
import { formatTaka } from '../utils/telecomUtils';

interface NavbarProps {
  currentUser: User | null;
  currentView: 'user' | 'admin';
  unreadNotificationsCount?: number;
  onToggleView: (view: 'user' | 'admin') => void;
  onOpenAddMoney: () => void;
  onOpenNotifications: () => void;
  onOpenSideMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  unreadNotificationsCount = 0,
  onToggleView,
  onOpenAddMoney,
  onOpenNotifications,
  onOpenSideMenu,
}) => {
  const isAdmin = currentUser?.role === 'admin' && currentUser?.phone === '01844868379';

  return (
    <header className="sticky top-0 z-40 bg-indigo-900 text-white shadow-md border-b border-indigo-950">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Left Zone: Three-Dot Menu + Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {currentUser && currentView === 'user' && (
            <button
              onClick={onOpenSideMenu}
              className="p-2 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-white border border-indigo-700/70 shadow-2xs transition-all active:scale-95"
              title="মেনু ও সকল সেবা দেখুন"
              aria-label="মেনু খুলুন"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}

          <div 
            onClick={() => {
              if (isAdmin) {
                onToggleView('admin');
              }
            }} 
            className={`flex items-center gap-2.5 group shrink-0 ${isAdmin ? 'cursor-pointer' : ''}`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-500 transition-colors">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg md:text-xl tracking-tight text-white leading-tight">
                  টেলিকম সেবা
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-800 text-indigo-200 border border-indigo-700">
                  BD Portal
                </span>
              </div>
              <p className="text-[11px] text-indigo-300 hidden sm:block">ডিজিটাল রিচার্জ ও ড্রাইভ হাব</p>
            </div>
          </div>
        </div>

        {/* Right Zone: User actions, Balance, Helpline, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Customer Wallet & Name (Shown only to logged-in customers) */}
          {currentUser && !isAdmin && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenAddMoney}
                className="flex items-center gap-2 bg-indigo-950/70 hover:bg-indigo-950 border border-indigo-700/60 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all group"
                title="ব্যালেন্স রিচার্জ করতে ক্লিক করুন"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-indigo-200 hidden md:inline">ব্যালেন্স:</span>
                <span className="font-bold text-white font-mono-nums">
                  {formatTaka(currentUser.balance)}
                </span>
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Plus className="w-3 h-3" />
                </span>
              </button>

              <div
                className="flex items-center gap-1.5 text-xs bg-indigo-800/80 px-2.5 py-1.5 rounded-xl border border-indigo-700 text-indigo-100"
                title="লগইনকৃত প্রোফাইল"
              >
                <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
                <span className="max-w-[90px] sm:max-w-[120px] truncate font-medium">
                  {currentUser.name}
                </span>
              </div>
            </div>
          )}

          {/* Admin Exclusive Controls (Only visible when logged in as Admin) */}
          {currentUser && isAdmin && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>এডমিন</span>
              </div>

              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-indigo-950/70 hover:bg-indigo-950 border border-indigo-700/60 text-indigo-200 hover:text-white transition-all"
                title="অর্ডার নোটিফিকেশন"
              >
                <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? 'text-amber-300 animate-pulse' : ''}`} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center font-mono-nums border-2 border-indigo-900 shadow-sm animate-bounce">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {currentView === 'admin' ? (
                <button
                  onClick={() => onToggleView('user')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-700 hover:bg-indigo-600 text-white border border-indigo-500 shadow-sm transition-all"
                  title="কাস্টমার ড্যাশবোর্ড প্রিভিউ দেখুন"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>কাস্টমার ভিউ</span>
                </button>
              ) : (
                <button
                  onClick={() => onToggleView('admin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
                  title="এডমিন কন্ট্রোল প্যানেলে ফিরে যান"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>এডমিন প্যানেল</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
