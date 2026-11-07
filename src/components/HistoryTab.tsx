import React, { useState } from 'react';
import { History, Search, CheckCircle2, Clock, XCircle, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { RechargeRequest, AddMoneyRequest } from '../types/telecom';
import { formatTaka, formatDateTime } from '../utils/telecomUtils';

interface HistoryTabProps {
  rechargeList: RechargeRequest[];
  addMoneyList: AddMoneyRequest[];
  onViewReceipt: (item: RechargeRequest | AddMoneyRequest) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  rechargeList,
  addMoneyList,
  onViewReceipt,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'recharge' | 'drive' | 'add_money'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'success' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine and normalize items
  type UnifiedItem = {
    id: string;
    itemType: 'recharge' | 'drive' | 'add_money';
    title: string;
    subTitle: string;
    amount: number;
    isIncome: boolean;
    status: 'pending' | 'completed' | 'approved' | 'rejected';
    timestamp: string;
    trxId: string;
    raw: RechargeRequest | AddMoneyRequest;
  };

  const unifiedList: UnifiedItem[] = [
    ...rechargeList.map((r) => ({
      id: r.id,
      itemType: (r.type === 'drive_offer' ? 'drive' : 'recharge') as 'recharge' | 'drive',
      title: r.type === 'drive_offer' ? (r.offerTitle || 'ড্রাইভ অফার') : `${r.operator} ফ্লেক্সিলোড`,
      subTitle: `নাম্বার: ${r.targetPhone} (${r.simType === 'Prepaid' ? 'প্রিপেইড' : 'পোস্টপেইড'})`,
      amount: r.amount,
      isIncome: false,
      status: r.status,
      timestamp: r.timestamp,
      trxId: r.trxId,
      raw: r,
    })),
    ...addMoneyList.map((a) => ({
      id: a.id,
      itemType: 'add_money' as const,
      title: `অ্যাড মানি (${a.method})`,
      subTitle: `প্রেরক: ${a.senderNumber}`,
      amount: a.amount,
      isIncome: true,
      status: a.status,
      timestamp: a.timestamp,
      trxId: a.trxId,
      raw: a,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = unifiedList.filter((item) => {
    if (filterType !== 'all' && item.itemType !== filterType) return false;
    if (filterStatus === 'pending' && item.status !== 'pending') return false;
    if (
      filterStatus === 'success' &&
      item.status !== 'completed' &&
      item.status !== 'approved'
    )
      return false;
    if (filterStatus === 'rejected' && item.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subTitle.toLowerCase().includes(q) ||
        item.trxId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-7">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg text-slate-900">
              লেনদেন হিস্ট্রি ও স্টেটমেন্ট
            </h3>
            <p className="text-xs text-slate-500">
              সকল রিচার্জ, ড্রাইভ অফার এবং ওয়ালেট ডিপোজিটের বিস্তারিত রশিদ
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="TrxID বা নাম্বার খুঁজুন..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs transition-all"
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 mr-1">ধরণ:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সব লেনদেন
          </button>
          <button
            onClick={() => setFilterType('recharge')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'recharge'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ফ্লেক্সিলোড
          </button>
          <button
            onClick={() => setFilterType('drive')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'drive'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ড্রাইভ অফার
          </button>
          <button
            onClick={() => setFilterType('add_money')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterType === 'add_money'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            অ্যাড মানি
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1">স্ট্যাটাস:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white outline-none"
          >
            <option value="all">সকল অবস্থা</option>
            <option value="success">সফল / অনুমোদিত</option>
            <option value="pending">পেন্ডিং</option>
            <option value="rejected">বাতিল</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <p className="text-sm">কোন লেনদেন রেকর্ড পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 text-xs">
          {filtered.map((item) => {
            const isApproved = item.status === 'completed' || item.status === 'approved';
            const isPending = item.status === 'pending';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                onClick={() => onViewReceipt(item.raw)}
                className="py-3.5 px-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.isIncome
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {item.isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                      {item.title}
                    </h5>
                    <p className="text-slate-500 text-xs mt-0.5">{item.subTitle}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="font-mono-nums">TrxID: {item.trxId}</span>
                      <span>·</span>
                      <span>{formatDateTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pl-12 sm:pl-0">
                  <span
                    className={`font-mono-nums font-bold text-sm ${
                      item.isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {item.isIncome ? `+${formatTaka(item.amount)}` : `-${formatTaka(item.amount)}`}
                  </span>

                  <div className="flex items-center gap-2">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        সফল
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Clock className="w-3 h-3" />
                        পেন্ডিং
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        বাতিল
                      </span>
                    )}
                    <button
                      type="button"
                      className="p-1 text-slate-400 group-hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors hidden sm:inline-block"
                      title="রশিদ দেখুন"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
