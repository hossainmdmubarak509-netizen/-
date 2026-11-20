import React from 'react';
import {
  X,
  Smartphone,
  Tag,
  FileText,
  Wallet,
  History,
  Server,
  KeyRound,
  FileSpreadsheet,
  Globe,
  LogOut,
  ChevronRight,
  Radio,
  Sparkles,
} from 'lucide-react';
import { DigitalServiceItem, User } from '../types/telecom';
import { formatTaka } from '../utils/telecomUtils';

export type CustomerTab = 'recharge' | 'offers' | 'nid-services' | 'add-money' | 'history';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  activeTab: CustomerTab;
  selectedServiceId?: string;
  digitalServices: DigitalServiceItem[];
  whatsappNumber: string;
  onSelectTab: (tab: CustomerTab) => void;
  onSelectDigitalService: (serviceId: string) => void;
  onLogout: () => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTab,
  selectedServiceId,
  digitalServices,
  whatsappNumber,
  onSelectTab,
  onSelectDigitalService,
  onLogout,
}) => {
  if (!isOpen) return null;

  const activeDigitalServices = digitalServices.filter((s) => s.active);

  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Server':
        return <Server className="w-4 h-4" />;
      case 'KeyRound':
        return <KeyRound className="w-4 h-4" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'Globe':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleTabClick = (tab: CustomerTab) => {
    onSelectTab(tab);
    onClose();
  };

  const handleServiceClick = (serviceId: string) => {
    onSelectDigitalService(serviceId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Left Slide-Over Drawer */}
      <aside className="relative z-10 w-72 sm:w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col border-r border-slate-200 animate-in slide-in-from-left duration-200">
        
        {/* Drawer Header */}
        <div className="bg-indigo-900 text-white px-4 py-4 flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">টেলিকম সেবা</h3>
              <p className="text-[10px] text-indigo-300">কুইক মেনু ও সেবাসমূহ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800/70 transition-colors"
            title="মেনু বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance Summary Box */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 border-b border-slate-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</span>
            <span className="text-[10px] font-mono-nums text-slate-500">{currentUser.phone}</span>
          </div>
          <div className="flex items-center justify-between mt-2 bg-white rounded-xl p-2.5 border border-indigo-100 shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-500 block">বর্তমান ব্যালেন্স</span>
              <span className="text-sm font-extrabold font-mono-nums text-indigo-700">
                {formatTaka(currentUser.balance)}
              </span>
            </div>
            <button
              onClick={() => handleTabClick('add-money')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
            >
              + অ্যাড মানি
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          
          {/* Core Options */}
          <div>
            <p className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              মূল সেবা সমূহ
            </p>
            <div className="space-y-1">
              <button
                onClick={() => handleTabClick('recharge')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'recharge'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4" />
                  <span>মোবাইল রিচার্জ</span>
                </span>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'recharge' ? 'text-indigo-200' : 'text-slate-400'}`} />
              </button>

              <button
                onClick={() => handleTabClick('add-money')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'add-money'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4" />
                  <span>অ্যাড মানি</span>
                </span>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'add-money' ? 'text-indigo-200' : 'text-slate-400'}`} />
              </button>

              <button
                onClick={() => handleTabClick('nid-services')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'nid-services'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  <span>NID ও ডিজিটাল সেবা</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  activeTab === 'nid-services'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {activeDigitalServices.length}
                </span>
              </button>

              <button
                onClick={() => handleTabClick('offers')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'offers'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4" />
                  <span>ডিসকাউন্ট ড্রাইভ অফার</span>
                </span>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'offers' ? 'text-indigo-200' : 'text-slate-400'}`} />
              </button>

              <button
                onClick={() => handleTabClick('history')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <History className="w-4 h-4" />
                  <span>লেনদেন ইতিহাস</span>
                </span>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'history' ? 'text-indigo-200' : 'text-slate-400'}`} />
              </button>
            </div>
          </div>

          {/* Dynamic NID & Admin-Arranged Services */}
          {activeDigitalServices.length > 0 && (
            <div>
              <div className="px-2.5 mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>NID ও অনলাইন সার্ভিস</span>
                </p>
                <span className="text-[10px] text-indigo-600 font-semibold">
                  {activeDigitalServices.length} টি চালু
                </span>
              </div>

              <div className="space-y-1">
                {activeDigitalServices.map((service) => {
                  const isSelected = activeTab === 'nid-services' && selectedServiceId === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceClick(service.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold'
                          : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 ${isSelected ? 'text-amber-600' : 'text-indigo-500'}`}>
                          {renderServiceIcon(service.icon)}
                        </span>
                        <span className="truncate">{service.title}</span>
                      </span>
                      <span className="font-mono-nums text-[11px] font-bold text-indigo-600 shrink-0 ml-2">
                        {formatTaka(service.fee)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('আসসালামু আলাইকুম এডমিন, হেল্প প্রয়োজন।')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <span>হোয়াটসঅ্যাপ হেল্পলাইন ({whatsappNumber})</span>
          </a>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট করুন</span>
          </button>
        </div>

      </aside>
    </div>
  );
};
