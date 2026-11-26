import React, { useMemo, useState } from 'react';
import {
  Smartphone,
  Zap,
  TrendingUp,
  CheckCircle2,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { RechargeRequest, NidOrderRequest } from '../types/telecom';
import { formatTaka } from '../utils/telecomUtils';

interface AdminDailySummaryCardsProps {
  rechargeRequests: RechargeRequest[];
  nidOrders: NidOrderRequest[];
}

function isSameLocalDay(isoString?: string, referenceDate: Date = new Date()): boolean {
  if (!isoString) return false;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return false;
  return (
    parsed.getFullYear() === referenceDate.getFullYear() &&
    parsed.getMonth() === referenceDate.getMonth() &&
    parsed.getDate() === referenceDate.getDate()
  );
}

export const AdminDailySummaryCards: React.FC<AdminDailySummaryCardsProps> = ({
  rechargeRequests,
  nidOrders,
}) => {
  const [period, setPeriod] = useState<'daily' | 'all'>('daily');

  const stats = useMemo(() => {
    const today = new Date();

    const matchesPeriod = (dateStr?: string) =>
      period === 'all' ? true : isSameLocalDay(dateStr, today);

    const successfulRecharges = rechargeRequests.filter(
      (r) =>
        r.type === 'recharge' &&
        r.status === 'completed' &&
        matchesPeriod(r.completedAt || r.timestamp)
    );

    const successfulDriveOffers = rechargeRequests.filter(
      (r) =>
        r.type === 'drive_offer' &&
        r.status === 'completed' &&
        matchesPeriod(r.completedAt || r.timestamp)
    );

    const successfulNidOrders = nidOrders.filter(
      (o) => o.status === 'completed' && matchesPeriod(o.completedAt || o.timestamp)
    );

    const rechargeAmount = successfulRecharges.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const driveSalesAmount = successfulDriveOffers.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );
    const nidRevenueAmount = successfulNidOrders.reduce((sum, o) => sum + (Number(o.fee) || 0), 0);

    const totalRevenue = rechargeAmount + driveSalesAmount + nidRevenueAmount;
    const totalCompletedCount =
      successfulRecharges.length + successfulDriveOffers.length + successfulNidOrders.length;

    const pendingRechargesCount = rechargeRequests.filter(
      (r) => r.type === 'recharge' && r.status === 'pending' && matchesPeriod(r.timestamp)
    ).length;

    const pendingDriveCount = rechargeRequests.filter(
      (r) => r.type === 'drive_offer' && r.status === 'pending' && matchesPeriod(r.timestamp)
    ).length;

    return {
      rechargeCount: successfulRecharges.length,
      rechargeAmount,
      pendingRechargesCount,
      driveSalesCount: successfulDriveOffers.length,
      driveSalesAmount,
      pendingDriveCount,
      nidCompletedCount: successfulNidOrders.length,
      nidRevenueAmount,
      totalRevenue,
      totalCompletedCount,
    };
  }, [rechargeRequests, nidOrders, period]);

  const todayFormatted = new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <section
      aria-label="দৈনিক সেলস ও রেভিনিউ সামারি"
      className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4"
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {period === 'daily' ? 'আজকের সেলস ও আয় সারসংক্ষেপ' : 'সর্বমোট সেলস ও আয় সারসংক্ষেপ'}
            </h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <span>{period === 'daily' ? `তারিখ: ${todayFormatted}` : 'সকল সফল অর্ডারের সম্মিলিত হিসাব'}</span>
            </p>
          </div>
        </div>

        {/* Period Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'daily'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            আজকের হিসাব
          </button>
          <button
            type="button"
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সর্বমোট
          </button>
        </div>
      </div>

      {/* 3 Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Daily Successful Recharges */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-white p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                সফল মোবাইল রিচার্জ
              </span>
              <div className="mt-1.5 text-2xl font-extrabold font-mono-nums text-slate-900 tracking-tight">
                {formatTaka(stats.rechargeAmount)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 font-mono-nums">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.rechargeCount} টি সফল রিচার্জ
            </span>
            {stats.pendingRechargesCount > 0 ? (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {stats.pendingRechargesCount} পেন্ডিং
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">ফ্লেক্সিলোড সেলস</span>
            )}
          </div>
        </div>

        {/* Card 2: Daily Drive Offer Sales */}
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-white p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                ড্রাইভ অফার বিক্রি
              </span>
              <div className="mt-1.5 text-2xl font-extrabold font-mono-nums text-slate-900 tracking-tight">
                {formatTaka(stats.driveSalesAmount)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-indigo-700 font-mono-nums">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.driveSalesCount} টি প্যাকেজ বিক্রি
            </span>
            {stats.pendingDriveCount > 0 ? (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {stats.pendingDriveCount} পেন্ডিং
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">স্পেশাল প্যাক</span>
            )}
          </div>
        </div>

        {/* Card 3: Total Daily Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-4 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                {period === 'daily' ? 'মোট দৈনিক আয় (Revenue)' : 'সর্বমোট আয় (Revenue)'}
              </span>
              <div className="mt-1.5 text-2xl font-extrabold font-mono-nums text-white tracking-tight">
                {formatTaka(stats.totalRevenue)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
            <span className="text-slate-300 font-semibold font-mono-nums">
              মোট {stats.totalCompletedCount} টি সফল অর্ডার
            </span>
            <span className="inline-flex items-center gap-1 text-amber-300 font-mono-nums">
              <FileText className="w-3 h-3" />
              NID/সেবা: {formatTaka(stats.nidRevenueAmount)} ({stats.nidCompletedCount})
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
