import React, { useState } from 'react';
import { Wallet, Copy, Check, AlertCircle, ArrowRight, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PaymentMethod, User, AddMoneyRequest, AppSettings } from '../types/telecom';
import { formatTaka, formatDateTime, isValidBdPhone } from '../utils/telecomUtils';

interface AddMoneyTabProps {
  currentUser: User;
  settings: AppSettings;
  userRequests: AddMoneyRequest[];
  onAddMoneySubmit: (data: {
    method: PaymentMethod;
    senderNumber: string;
    amount: number;
    trxId: string;
  }) => void;
  onViewReceipt: (req: AddMoneyRequest) => void;
}

const PAYMENT_INFO: Record<PaymentMethod, { name: string; color: string; bg: string; border: string }> = {
  bKash: {
    name: 'বিকাশ (bKash)',
    color: '#e2136e',
    bg: 'bg-[#e2136e]/10',
    border: 'border-[#e2136e]/30',
  },
  Nagad: {
    name: 'নগদ (Nagad)',
    color: '#f7941d',
    bg: 'bg-[#f7941d]/10',
    border: 'border-[#f7941d]/30',
  },
  Rocket: {
    name: 'রকেট (Rocket)',
    color: '#8c3494',
    bg: 'bg-[#8c3494]/10',
    border: 'border-[#8c3494]/30',
  },
  Upay: {
    name: 'উপায় (Upay)',
    color: '#0083ca',
    bg: 'bg-[#0083ca]/10',
    border: 'border-[#0083ca]/30',
  },
};

export const AddMoneyTab: React.FC<AddMoneyTabProps> = ({
  currentUser,
  settings,
  userRequests,
  onAddMoneySubmit,
  onViewReceipt,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('bKash');
  const [senderNumber, setSenderNumber] = useState(currentUser.phone);
  const [amount, setAmount] = useState('200');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePaymentNumber = settings.paymentNumbers[method] || '01700-112233 (Personal)';

  const handleCopyNumber = () => {
    // Extract only digits and hyphens
    const numberOnly = activePaymentNumber.split(' ')[0];
    navigator.clipboard.writeText(numberOnly);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidBdPhone(senderNumber)) {
      setError('যে নাম্বার থেকে টাকা পাঠিয়েছেন তা সঠিক ১১ ডিজিটে লিখুন।');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 20) {
      setError('সর্বনিম্ন ২০ টাকা অ্যাড মানি করা যাবে।');
      return;
    }

    if (!trxId.trim() || trxId.trim().length < 5) {
      setError('সঠিক ট্রানজেকশন আইডি (TrxID) দিন (কমপক্ষে ৫ ক্যারেক্টার)।');
      return;
    }

    onAddMoneySubmit({
      method,
      senderNumber: senderNumber.trim(),
      amount: numAmount,
      trxId: trxId.trim().toUpperCase(),
    });

    setTrxId('');
  };

  const handleGenerateSampleTrx = () => {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setTrxId(res);
  };

  return (
    <div className="space-y-6">
      
      {/* Add Money Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-7">
        
        {/* Title */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-slate-900">
                ম্যানুয়াল অ্যাড মানি (ওয়ালেটে টাকা যোগ)
              </h3>
              <p className="text-xs text-slate-500">
                বিকাশ, নগদ, রকেট বা উপায়ের মাধ্যমে তাৎক্ষণিক ব্যালেন্স লোড করুন
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500">বর্তমান ব্যালেন্স:</span>
            <p className="font-mono-nums font-bold text-slate-900 text-sm">
              {formatTaka(currentUser.balance)}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Method Picker */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            পেমেন্ট মেথড নির্বাচন করুন
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(PAYMENT_INFO) as PaymentMethod[]).map((m) => {
              const info = PAYMENT_INFO[m];
              const isSelected = method === m;
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    isSelected
                      ? `ring-2 ring-indigo-500 border-indigo-600 ${info.bg}`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold" style={{ color: info.color }}>
                    {info.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Instructions Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 mb-6 text-xs text-amber-950">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-200">
            <span className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              টাকা পাঠানোর নিয়ম ও একাউন্ট নাম্বার:
            </span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              Send Money করুন
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-200 mb-3">
            <div>
              <span className="text-[11px] text-slate-500">আমাদের {method} নাম্বার:</span>
              <p className="font-mono-nums font-bold text-sm text-slate-900">
                {activePaymentNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyNumber}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'নাম্বার কপি করুন'}</span>
            </button>
          </div>

          <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px]">
            <li>আপনার {method} অ্যাপে গিয়ে উপরে উল্লেখিত নাম্বারে <b>Send Money</b> করুন।</li>
            <li>টাকা সফলভাবে পাঠানোর পর অ্যাপের ফিরতি মেসেজ থেকে <b>TrxID</b> কপি করুন।</li>
            <li>নিচের ফর্মে প্রেরক নাম্বার, টাকার পরিমাণ এবং TrxID দিয়ে সাবমিট করুন।</li>
            <li>এডমিন ৫-১০ মিনিটের মধ্যে ভেরিফাই করে আপনার ওয়ালেটে টাকা যুক্ত করে দেবে।</li>
          </ol>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                যে নাম্বার থেকে পাঠিয়েছেন (প্রেরক নাম্বার)
              </label>
              <input
                type="tel"
                required
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                টাকার পরিমাণ (টাকা)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  min="20"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="মিনিমাম ২০ টাকা"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                ট্রানজেকশন আইডি (TrxID)
              </label>
              <button
                type="button"
                onClick={handleGenerateSampleTrx}
                className="text-[11px] text-indigo-600 hover:underline font-semibold"
              >
                + টেস্ট TrxID অটো-জেনারেট
              </button>
            </div>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="উদাঃ 9K8L7M6N"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums uppercase font-bold tracking-wider"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            <span>অ্যাড মানি রিকোয়েস্ট পাঠান (৳{amount})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Recent User Add Money Requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
        <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
          <span>আপনার সাম্প্রতিক অ্যাড মানি হিস্ট্রি</span>
          <span className="text-xs text-slate-400 font-normal">
            মোট {userRequests.length} টি রিকোয়েস্ট
          </span>
        </h4>

        {userRequests.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            এখনও কোন অ্যাড মানি রিকোয়েস্ট করেননি।
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {userRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => onViewReceipt(req)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{req.method}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono-nums text-slate-600">{req.senderNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="font-mono-nums">TrxID: {req.trxId}</span>
                    <span>·</span>
                    <span>{formatDateTime(req.timestamp)}</span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="font-mono-nums font-bold text-slate-900 text-sm">
                    {formatTaka(req.amount)}
                  </span>
                  {req.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      অনুমোদিত
                    </span>
                  )}
                  {req.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Clock className="w-3 h-3" />
                      পেন্ডিং
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <XCircle className="w-3 h-3" />
                      বাতিল
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
