import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  FileText,
  Zap,
  Smartphone,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  AddMoneyRequest,
  NidOrderRequest,
  RechargeRequest,
} from '../types/telecom';
import { formatDateTime, formatTaka } from '../utils/telecomUtils';

type OrderKind = 'all' | 'nid' | 'drive' | 'recharge' | 'add_money';

interface UnifiedOrderResult {
  id: string;
  kind: Exclude<OrderKind, 'all'>;
  kindLabel: string;
  title: string;
  customerName: string;
  customerPhone: string;
  secondaryPhone?: string;
  trxId: string;
  amount: number;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  timestamp: string;
  targetTab: 'nid-orders' | 'drive-orders' | 'recharges' | 'add-money';
}

interface AdminGlobalSearchBarProps {
  nidOrders: NidOrderRequest[];
  rechargeRequests: RechargeRequest[];
  addMoneyRequests: AddMoneyRequest[];
  onNavigateToOrder: (
    tab: 'nid-orders' | 'drive-orders' | 'recharges' | 'add-money',
    trxOrQuery?: string
  ) => void;
  onCompleteRecharge?: (requestId: string) => void;
  onApproveAddMoney?: (requestId: string) => void;
}

export const AdminGlobalSearchBar: React.FC<AdminGlobalSearchBarProps> = ({
  nidOrders,
  rechargeRequests,
  addMoneyRequests,
  onNavigateToOrder,
  onCompleteRecharge,
  onApproveAddMoney,
}) => {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<OrderKind>('all');
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);

  const normalized = query.trim().toLowerCase();

  const matches = useMemo<UnifiedOrderResult[]>(() => {
    if (!normalized) return [];

    const results: UnifiedOrderResult[] = [];

    for (const o of nidOrders) {
      const hay = [
        o.trxId,
        o.userPhone,
        o.userName,
        o.name || '',
        o.nidNumber,
        o.serviceTitle,
      ]
        .join(' ')
        .toLowerCase();

      if (hay.includes(normalized)) {
        results.push({
          id: o.id,
          kind: 'nid',
          kindLabel: 'NID / ডিজিটাল সেবা',
          title: o.serviceTitle,
          customerName: o.userName,
          customerPhone: o.userPhone,
          trxId: o.trxId,
          amount: o.fee,
          status: o.status,
          timestamp: o.timestamp,
          targetTab: 'nid-orders',
        });
      }
    }

    for (const r of rechargeRequests) {
      const isDrive = r.type === 'drive_offer';
      const hay = [
        r.trxId,
        r.userPhone,
        r.targetPhone,
        r.userName,
        r.offerTitle || '',
        r.operator,
      ]
        .join(' ')
        .toLowerCase();

      if (hay.includes(normalized)) {
        results.push({
          id: r.id,
          kind: isDrive ? 'drive' : 'recharge',
          kindLabel: isDrive ? 'ড্রাইভ অফার' : 'মোবাইল রিচার্জ',
          title: isDrive
            ? `${r.operator} · ${r.offerTitle || 'ড্রাইভ প্যাক'}`
            : `${r.operator} ফ্লেক্সিলোড (${r.simType})`,
          customerName: r.userName,
          customerPhone: r.userPhone,
          secondaryPhone: r.targetPhone !== r.userPhone ? r.targetPhone : undefined,
          trxId: r.trxId,
          amount: r.amount,
          status: r.status,
          timestamp: r.timestamp,
          targetTab: isDrive ? 'drive-orders' : 'recharges',
        });
      }
    }

    for (const a of addMoneyRequests) {
      const hay = [
        a.trxId,
        a.userPhone,
        a.senderNumber,
        a.userName,
        a.method,
      ]
        .join(' ')
        .toLowerCase();

      if (hay.includes(normalized)) {
        results.push({
          id: a.id,
          kind: 'add_money',
          kindLabel: 'অ্যাড মানি',
          title: `${a.method} অ্যাড মানি রিকোয়েস্ট`,
          customerName: a.userName,
          customerPhone: a.userPhone,
          secondaryPhone: a.senderNumber !== a.userPhone ? a.senderNumber : undefined,
          trxId: a.trxId,
          amount: a.amount,
          status: a.status,
          timestamp: a.timestamp,
          targetTab: 'add-money',
        });
      }
    }

    results.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return results;
  }, [normalized, nidOrders, rechargeRequests, addMoneyRequests]);

  const filteredMatches = useMemo(() => {
    if (kindFilter === 'all') return matches;
    return matches.filter((m) => m.kind === kindFilter);
  }, [matches, kindFilter]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrx(text);
    setTimeout(() => setCopiedTrx(null), 1800);
  };

  const renderKindIcon = (kind: UnifiedOrderResult['kind']) => {
    switch (kind) {
      case 'nid':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'drive':
        return <Zap className="w-4 h-4 text-indigo-600" />;
      case 'recharge':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'add_money':
        return <Wallet className="w-4 h-4 text-purple-600" />;
    }
  };

  const renderStatusBadge = (status: UnifiedOrderResult['status']) => {
    if (status === 'pending') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          পেন্ডিং
        </span>
      );
    }
    if (status === 'completed' || status === 'approved') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {status === 'approved' ? 'অনুমোদিত' : 'সফল'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        বাতিল
      </span>
    );
  };

  return (
    <section
      aria-label="গ্লোবাল অর্ডার সার্চ"
      className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3.5 sm:p-4 space-y-3"
    >
      {/* Search Input Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="গ্লোবাল সার্চ: TrxID, গ্রাহকের নাম বা মোবাইল নাম্বার দিয়ে যেকোনো অর্ডার খুঁজুন..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-sm text-slate-900 bg-slate-50/70 focus:bg-white transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setKindFilter('all');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              aria-label="সার্চ মুছুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {normalized && (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            {(
              [
                { id: 'all', label: `সব (${matches.length})` },
                { id: 'nid', label: `NID/সেবা (${matches.filter((m) => m.kind === 'nid').length})` },
                { id: 'drive', label: `ড্রাইভ (${matches.filter((m) => m.kind === 'drive').length})` },
                { id: 'recharge', label: `রিচার্জ (${matches.filter((m) => m.kind === 'recharge').length})` },
                { id: 'add_money', label: `অ্যাড মানি (${matches.filter((m) => m.kind === 'add_money').length})` },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setKindFilter(chip.id)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                  kindFilter === chip.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Search Results Panel */}
      {normalized && (
        <div className="border-t border-slate-100 pt-3">
          {filteredMatches.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              &ldquo;<b className="text-slate-800">{query.trim()}</b>&rdquo; দিয়ে কোনো অর্ডার বা অ্যাড মানি রিকোয়েস্ট পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredMatches.slice(0, 25).map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="p-3 rounded-xl border border-slate-200/90 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {renderKindIcon(item.kind)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                          {item.kindLabel}
                        </span>
                        {renderStatusBadge(item.status)}
                        <span className="font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600">
                        <span>
                          গ্রাহক: <b className="text-slate-900">{item.customerName}</b>
                        </span>
                        <span className="font-mono-nums text-slate-700">
                          ({item.customerPhone})
                        </span>
                        {item.secondaryPhone && (
                          <span className="font-mono-nums text-indigo-700 font-semibold">
                            প্রাপক/প্রেরক: {item.secondaryPhone}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(item.trxId)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono-nums font-bold border border-indigo-200/80"
                          title="TrxID কপি করুন"
                        >
                          <span>TrxID: {item.trxId}</span>
                          {copiedTrx === item.trxId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <span className="text-slate-400">{formatDateTime(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
                    <span className="font-mono-nums font-extrabold text-sm text-slate-900">
                      {formatTaka(item.amount)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {item.status === 'pending' &&
                        (item.kind === 'drive' || item.kind === 'recharge') &&
                        onCompleteRecharge && (
                          <button
                            type="button"
                            onClick={() => onCompleteRecharge(item.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>সফল</span>
                          </button>
                        )}
                      {item.status === 'pending' &&
                        item.kind === 'add_money' &&
                        onApproveAddMoney && (
                          <button
                            type="button"
                            onClick={() => onApproveAddMoney(item.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>অনুমোদন</span>
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToOrder(
                            item.targetTab,
                            item.kind === 'nid' ? item.trxId : undefined
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        <span>ট্যাবে দেখুন</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMatches.length > 25 && (
                <p className="text-center text-[11px] text-slate-500 py-1">
                  প্রথম ২৫টি ফলাফল দেখানো হচ্ছে। আরও নির্দিষ্ট করে খুঁজতে পুরো TrxID বা নাম্বার লিখুন।
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
