import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { RechargeRequest } from '../types/telecom';
import { formatTaka } from '../utils/telecomUtils';

interface AdminPerformanceChartsProps {
  rechargeRequests: RechargeRequest[];
}

interface DailyPoint {
  dateKey: string;
  label: string;
  fullDate: string;
  rechargeRevenue: number;
  rechargeCount: number;
  driveRevenue: number;
  driveCount: number;
  totalRevenue: number;
  totalCount: number;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const AdminPerformanceCharts: React.FC<AdminPerformanceChartsProps> = ({
  rechargeRequests,
}) => {
  const [metricMode, setMetricMode] = useState<'revenue' | 'count'>('revenue');

  const { chartData, sevenDayRechargeTotal, sevenDayDriveTotal, sevenDayRechargeCount, sevenDayDriveCount } =
    useMemo(() => {
      const today = new Date();
      const shortFmt = new Intl.DateTimeFormat('bn-BD', {
        day: 'numeric',
        month: 'short',
      });
      const fullFmt = new Intl.DateTimeFormat('bn-BD', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      });

      const dayMap = new Map<string, DailyPoint>();
      const orderedDays: DailyPoint[] = [];

      for (let offset = 6; offset >= 0; offset--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
        const key = toLocalDateKey(d);
        const point: DailyPoint = {
          dateKey: key,
          label: offset === 0 ? 'আজ' : shortFmt.format(d),
          fullDate: fullFmt.format(d),
          rechargeRevenue: 0,
          rechargeCount: 0,
          driveRevenue: 0,
          driveCount: 0,
          totalRevenue: 0,
          totalCount: 0,
        };
        dayMap.set(key, point);
        orderedDays.push(point);
      }

      for (const req of rechargeRequests) {
        if (req.status !== 'completed') continue;
        const rawDate = req.completedAt || req.timestamp;
        if (!rawDate) continue;
        const parsed = new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) continue;

        const key = toLocalDateKey(parsed);
        const bucket = dayMap.get(key);
        if (!bucket) continue;

        const amt = Number(req.amount) || 0;
        if (req.type === 'recharge') {
          bucket.rechargeRevenue += amt;
          bucket.rechargeCount += 1;
        } else if (req.type === 'drive_offer') {
          bucket.driveRevenue += amt;
          bucket.driveCount += 1;
        }
        bucket.totalRevenue = bucket.rechargeRevenue + bucket.driveRevenue;
        bucket.totalCount = bucket.rechargeCount + bucket.driveCount;
      }

      const rTotal = orderedDays.reduce((s, d) => s + d.rechargeRevenue, 0);
      const dTotal = orderedDays.reduce((s, d) => s + d.driveRevenue, 0);
      const rCount = orderedDays.reduce((s, d) => s + d.rechargeCount, 0);
      const dCount = orderedDays.reduce((s, d) => s + d.driveCount, 0);

      return {
        chartData: orderedDays,
        sevenDayRechargeTotal: rTotal,
        sevenDayDriveTotal: dTotal,
        sevenDayRechargeCount: rCount,
        sevenDayDriveCount: dCount,
      };
    }, [rechargeRequests]);

  const CustomChartTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: DailyPoint }>;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
        <div className="font-bold text-amber-300 border-b border-slate-700 pb-1">
          {item.fullDate}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-emerald-300 font-medium">সফল রিচার্জ ({item.rechargeCount} টি):</span>
          <span className="font-mono-nums font-bold">{formatTaka(item.rechargeRevenue)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-indigo-300 font-medium">ড্রাইভ অফার ({item.driveCount} টি):</span>
          <span className="font-mono-nums font-bold">{formatTaka(item.driveRevenue)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700">
          <span className="text-slate-300 font-semibold">মোট ({item.totalCount} টি):</span>
          <span className="font-mono-nums font-extrabold text-amber-300">
            {formatTaka(item.totalRevenue)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label="৭ দিনের রিচার্জ ও ড্রাইভ অফার পারফরম্যান্স চার্ট"
      className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 space-y-4"
    >
      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              গত ৭ দিনের রিচার্জ ও ড্রাইভ অফার ট্রেন্ড
            </h3>
            <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              <span>
                ৭ দিনে সফল রিচার্জ:{' '}
                <b className="text-emerald-700 font-mono-nums">
                  {formatTaka(sevenDayRechargeTotal)} ({sevenDayRechargeCount} টি)
                </b>
              </span>
              <span>
                ড্রাইভ অফার:{' '}
                <b className="text-indigo-700 font-mono-nums">
                  {formatTaka(sevenDayDriveTotal)} ({sevenDayDriveCount} টি)
                </b>
              </span>
            </p>
          </div>
        </div>

        {/* Metric Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              metricMode === 'revenue'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            টাকার পরিমাণ (৳)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('count')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              metricMode === 'count'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            অর্ডার সংখ্যা (টি)
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Comparison Bar Chart (Successful Recharges vs Drive Offers) */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800">
              দৈনিক রিচার্জ বনাম ড্রাইভ অফার ({metricMode === 'revenue' ? '৳' : 'সংখ্যা'})
            </span>
            <span className="text-[11px] text-slate-400">গত ৭ দিন</span>
          </div>

          <div className="h-[240px] sm:h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar
                  dataKey={metricMode === 'revenue' ? 'rechargeRevenue' : 'rechargeCount'}
                  name="সফল রিচার্জ"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey={metricMode === 'revenue' ? 'driveRevenue' : 'driveCount'}
                  name="ড্রাইভ অফার"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Combined 7-Day Growth Trend Area Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              সম্মিলিত দৈনিক সেলস ট্রেন্ড ({metricMode === 'revenue' ? '৳' : 'মোট অর্ডার'})
            </span>
            <span className="text-[11px] text-slate-400">রিচার্জ + ড্রাইভ</span>
          </div>

          <div className="h-[240px] sm:h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="combinedTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey={metricMode === 'revenue' ? 'totalRevenue' : 'totalCount'}
                  name={metricMode === 'revenue' ? 'মোট সেলস (৳)' : 'মোট সফল অর্ডার'}
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#combinedTrendFill)"
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
