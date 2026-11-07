import React from 'react';
import { Radio, Wallet, Shield, User as UserIcon, LogOut, ArrowRightLeft, Plus, Bell } from 'lucide-react';
import { User } from '../types/telecom';
import { formatTaka } from '../utils/telecomUtils';

interface NavbarProps {
  currentUser: User | null;
  currentView: 'user' | 'admin';
  unreadNotificationsCount?: number;
  whatsappNumber?: string;
  onToggleView: (view: 'user' | 'admin') => void;
  onLogout: () => void;
  onOpenAddMoney: () => void;
  onSwitchUserPrompt: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  unreadNotificationsCount = 0,
  whatsappNumber = '+8801844868379',
  onToggleView,
  onLogout,
  onOpenAddMoney,
  onSwitchUserPrompt,
  onOpenNotifications,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-indigo-900 text-white shadow-md border-b border-indigo-950">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => onToggleView('user')} 
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
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

        {/* Right Zone: User actions, Balance, Mode toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && currentView === 'user' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Wallet Balance Pill */}
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

              {/* User Name Badge / Switcher */}
              <button
                onClick={onSwitchUserPrompt}
                className="flex items-center gap-1.5 text-xs bg-indigo-800/80 hover:bg-indigo-800 px-2.5 py-1.5 rounded-xl border border-indigo-700 text-indigo-100 transition-colors"
                title="একাউন্ট পরিবর্তন করুন"
              >
                <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
                <span className="max-w-[90px] sm:max-w-[120px] truncate font-medium">
                  {currentUser.name}
                </span>
                <ArrowRightLeft className="w-3 h-3 text-indigo-300 opacity-70" />
              </button>
            </div>
          )}

          {/* Admin Order Notifications Bell */}
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

          {/* WhatsApp Admin Helpline Link */}
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('আসসালামু আলাইকুম এডমিন, হেল্প প্রয়োজন।')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs border border-emerald-500/50"
            title={`হোয়াটসঅ্যাপ হেল্পলাইন: ${whatsappNumber}`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="hidden sm:inline">হেল্পলাইন</span>
          </a>

          {/* Mode Switcher: User <-> Admin */}
          <div className="flex items-center">
            {currentView === 'user' ? (
              <button
                onClick={() => onToggleView('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
                title="এডমিন কন্ট্রোল প্যানেলে প্রবেশ করুন"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>এডমিন প্যানেল</span>
              </button>
            ) : (
              <button
                onClick={() => onToggleView('user')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-700 hover:bg-indigo-600 text-white border border-indigo-500 shadow-sm transition-all"
                title="কাস্টমার ড্যাশবোর্ডে ফিরে যান"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>কাস্টমার মোড</span>
              </button>
            )}
          </div>

          {/* Logout */}
          {currentUser && (
            <button
              onClick={onLogout}
              className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-800/60 rounded-lg transition-colors"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
