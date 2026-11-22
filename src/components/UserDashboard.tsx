import React from 'react';
import { Wallet, Plus, Zap, Tag, History, Smartphone, FileText, LogOut, ExternalLink, Headphones } from 'lucide-react';
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
  UploadedFileAttachment,
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
  selectedNidServiceId?: string;
  onSelectNidService?: (serviceId: string | undefined) => void;
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
    customerFiles?: UploadedFileAttachment[];
  }) => void;
  onAddMoneySubmit: (data: {
    method: PaymentMethod;
    senderNumber: string;
    amount: number;
    trxId: string;
  }) => void;
  onViewReceipt: (item: RechargeRequest | AddMoneyRequest | NidOrderRequest) => void;
  onLogout: () => void;
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
  selectedNidServiceId,
  onSelectNidService,
  onTabChange,
  onRechargeSubmit,
  onBuyOffer,
  onOrderNidService,
  onAddMoneySubmit,
  onViewReceipt,
  onLogout,
}) => {
  const isDedicatedNidOrderPage = activeTab === 'nid-services' && Boolean(selectedNidServiceId);

  return (
    <div className="space-y-6">
      
      {!isDedicatedNidOrderPage && (
        <>
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

            {/* 3. NID Services */}
            <button
              onClick={() => {
                onSelectNidService?.(undefined);
                onTabChange('nid-services');
              }}
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
        </>
      )}

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
          selectedServiceId={selectedNidServiceId}
          onSelectService={onSelectNidService}
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

      {/* In-Page Support & Account Controls (WhatsApp Helpline & Exit/Logout inside the page) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
              এডমিন হোয়াটসঅ্যাপ হেল্পলাইন
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500">
              যেকোনো সহায়তার জন্য সরাসরি মেসেজ করুন: <span className="font-mono-nums font-bold text-slate-700">{settings.whatsappNumber || '+8801844868379'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href={`https://wa.me/${(settings.whatsappNumber || '+8801844868379').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('আসসালামু আলাইকুম এডমিন, টেলিকম ও ডিজিটাল সেবা পোর্টাল সম্পর্কিত হেল্প প্রয়োজন।')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>হোয়াটসঅ্যাপে চ্যাট</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </div>

    </div>
  );
};
