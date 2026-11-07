import React from 'react';
import { Wallet, Plus, Zap, Tag, History, Smartphone, FileText } from 'lucide-react';
import {
  User,
  DriveOffer,
  AddMoneyRequest,
  RechargeRequest,
  NidOrderRequest,
  DigitalServiceItem,
  AppSettings,
  Operator,
  SimType,
  PaymentMethod,
} from '../types/telecom';
import { formatTaka } from '../utils/telecomUtils';
import { RechargeTab } from './RechargeTab';
import { DriveOffersTab } from './DriveOffersTab';
import { NidServicesTab } from './NidServicesTab';
import { AddMoneyTab } from './AddMoneyTab';
import { HistoryTab } from './HistoryTab';

interface UserDashboardProps {
  currentUser: User;
  offers: DriveOffer[];
  userRecharges: RechargeRequest[];
  userAddMoney: AddMoneyRequest[];
  userNidOrders: NidOrderRequest[];
  digitalServices: DigitalServiceItem[];
  settings: AppSettings;
  activeTab: 'recharge' | 'offers' | 'nid-services' | 'add-money' | 'history';
  onTabChange: (tab: 'recharge' | 'offers' | 'nid-services' | 'add-money' | 'history') => void;
  onRechargeSubmit: (data: {
    operator: Operator;
    targetPhone: string;
    simType: SimType;
    amount: number;
  }) => void;
  onBuyOffer: (offer: DriveOffer, targetPhone: string, simType: SimType, customerNote?: string) => void;
  onOrderNidService: (data: {
    serviceId: string;
    serviceTitle: string;
    fee: number;
    formData: Record<string, string>;
    name?: string;
    nidNumber: string;
    dateOfBirth: string;
    upazila?: string;
    district?: string;
  }) => void;
  onAddMoneySubmit: (data: {
    method: PaymentMethod;
    senderNumber: string;
    amount: number;
    trxId: string;
  }) => void;
  onViewReceipt: (item: RechargeRequest | AddMoneyRequest | NidOrderRequest) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  offers,
  userRecharges,
  userAddMoney,
  userNidOrders,
  digitalServices,
  settings,
  activeTab,
  onTabChange,
  onRechargeSubmit,
  onBuyOffer,
  onOrderNidService,
  onAddMoneySubmit,
  onViewReceipt,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Wallet Balance Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-7 text-white shadow-lg">
        {/* Subtle decorative background circles */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-24 bottom-0 translate-y-12 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs sm:text-sm font-medium">
              <span>স্বাগতম, {currentUser.name}</span>
              <span>·</span>
              <span className="font-mono-nums">{currentUser.phone}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono-nums tracking-tight">
                {formatTaka(currentUser.balance)}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              বর্তমান মূল ওয়ালেট ব্যালেন্স (রিচার্জ, ড্রাইভ অফার ও NID সেবায় ব্যবহারযোগ্য)
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
            <button
              onClick={() => onTabChange('add-money')}
              className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-slate-100 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>+ অ্যাড মানি</span>
            </button>
            <button
              onClick={() => onTabChange('recharge')}
              className="flex items-center gap-2 bg-indigo-900/60 hover:bg-indigo-900 text-white border border-indigo-400/30 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>রিচার্জ করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-1.5 flex gap-1 overflow-x-auto scrollbar-none">
        
        {/* 1. Mobile Recharge */}
        <button
          onClick={() => onTabChange('recharge')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'recharge'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>মোবাইল রিচার্জ</span>
        </button>

        {/* 2. Drive Offers */}
        <button
          onClick={() => onTabChange('offers')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'offers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>ডিসকাউন্ট অফার</span>
          <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full hidden sm:inline">
            হট
          </span>
        </button>

        {/* 3. NID Services (NEW) */}
        <button
          onClick={() => onTabChange('nid-services')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'nid-services'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>NID ও সার্ভার কপি</span>
          <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full hidden sm:inline">
            নতুন
          </span>
        </button>

        {/* 4. Add Money */}
        <button
          onClick={() => onTabChange('add-money')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'add-money'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>অ্যাড মানি</span>
        </button>

        {/* 5. History */}
        <button
          onClick={() => onTabChange('history')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>লেনদেন ইতিহাস</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'recharge' && (
        <RechargeTab
          currentUser={currentUser}
          onRechargeSubmit={onRechargeSubmit}
          onOpenAddMoney={() => onTabChange('add-money')}
        />
      )}

      {activeTab === 'offers' && (
        <DriveOffersTab
          currentUser={currentUser}
          offers={offers}
          onBuyOffer={onBuyOffer}
          onOpenAddMoney={() => onTabChange('add-money')}
        />
      )}

      {activeTab === 'nid-services' && (
        <NidServicesTab
          currentUser={currentUser}
          settings={settings}
          digitalServices={digitalServices}
          userNidOrders={userNidOrders}
          onOrderService={onOrderNidService}
          onOpenAddMoney={() => onTabChange('add-money')}
          onViewReceipt={onViewReceipt}
        />
      )}

      {activeTab === 'add-money' && (
        <AddMoneyTab
          currentUser={currentUser}
          settings={settings}
          userRequests={userAddMoney}
          onAddMoneySubmit={onAddMoneySubmit}
          onViewReceipt={onViewReceipt}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          rechargeList={userRecharges}
          addMoneyList={userAddMoney}
          onViewReceipt={onViewReceipt}
        />
      )}

    </div>
  );
};
