import React, { useState } from 'react';
import { Smartphone, Zap, AlertCircle, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { Operator, SimType, User } from '../types/telecom';
import { OPERATORS, detectOperatorFromPhone, isValidBdPhone, formatTaka } from '../utils/telecomUtils';

interface RechargeTabProps {
  currentUser: User;
  onRechargeSubmit: (data: {
    operator: Operator;
    targetPhone: string;
    simType: SimType;
    amount: number;
  }) => void;
  onOpenAddMoney: () => void;
}

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

export const RechargeTab: React.FC<RechargeTabProps> = ({
  currentUser,
  onRechargeSubmit,
  onOpenAddMoney,
}) => {
  const [operator, setOperator] = useState<Operator>('GP');
  const [phone, setPhone] = useState('');
  const [simType, setSimType] = useState<SimType>('Prepaid');
  const [amount, setAmount] = useState<string>('50');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const isBalanceSufficient = currentUser.balance >= numAmount;
  const balanceAfter = currentUser.balance - numAmount;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPhone(val);
    setError(null);

    // Auto-detect operator if user hasn't explicitly locked it
    const detected = detectOperatorFromPhone(val);
    if (detected) {
      setOperator(detected);
    }
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidBdPhone(phone)) {
      setError('অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন।');
      return;
    }

    if (numAmount < 10) {
      setError('সর্বনিম্ন রিচার্জ পরিমাণ ১০ টাকা।');
      return;
    }

    if (numAmount > 5000) {
      setError('একবারে সর্বোচ্চ ৫,০০০ টাকা রিচার্জ করা যাবে।');
      return;
    }

    if (!isBalanceSufficient) {
      setError('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে আগে অ্যাড মানি করুন।');
      return;
    }

    setIsConfirming(true);
  };

  const handleConfirmRecharge = () => {
    onRechargeSubmit({
      operator,
      targetPhone: phone,
      simType,
      amount: numAmount,
    });
    setIsConfirming(false);
    setPhone('');
    setAmount('50');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-7">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg text-slate-900">
              মোবাইল রিচার্জ (ফ্লেক্সিলোড)
            </h3>
            <p className="text-xs text-slate-500">
              সকল সিমের প্রিপেইড ও পোস্টপেইড নাম্বারে তাৎক্ষণিক অটো রিচার্জ
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-500">ওয়ালেট ব্যালেন্স:</span>
          <p className="font-mono-nums font-bold text-indigo-700 text-sm">
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

      <form onSubmit={handleStartSubmit} className="space-y-5">
        
        {/* 1. Operator Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            অপারেটর নির্বাচন করুন
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(Object.keys(OPERATORS) as Operator[]).map((opKey) => {
              const op = OPERATORS[opKey];
              const isSelected = operator === opKey;
              return (
                <button
                  type="button"
                  key={opKey}
                  onClick={() => setOperator(opKey)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? `ring-2 ring-indigo-500 border-indigo-600 ${op.bgColor}`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: op.color }}
                  />
                  <span className="text-xs font-bold text-slate-800">{op.name}</span>
                  <span className="text-[10px] text-slate-500">{op.nameBn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Number & Sim Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মোবাইল নাম্বার
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums font-semibold tracking-wide"
              />
              {phone.length >= 3 && (
                <div className="absolute right-3 top-2.5 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {OPERATORS[operator].name}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">নাম্বার লিখলে অপারেটর স্বয়ংক্রিয় সনাক্ত হবে</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সিমের ধরণ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSimType('Prepaid')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  simType === 'Prepaid'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                প্রিপেইড (Prepaid)
              </button>
              <button
                type="button"
                onClick={() => setSimType('Postpaid')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  simType === 'Postpaid'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                পোস্টপেইড (Postpaid)
              </button>
            </div>
          </div>
        </div>

        {/* 3. Amount and Quick Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            রিচার্জের পরিমাণ (টাকা)
          </label>
          <div className="relative mb-2">
            <span className="absolute left-3 top-2.5 font-bold text-slate-400">৳</span>
            <input
              type="number"
              min="10"
              max="5000"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="১০ - ৫০০০"
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums font-bold"
            />
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(q.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-nums font-semibold transition-all ${
                  numAmount === q
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ৳{q}
              </button>
            ))}
          </div>
        </div>

        {/* Balance Preview Card */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs flex flex-col sm:flex-row justify-between gap-2">
          <div>
            <span className="text-slate-500">বর্তমান ব্যালেন্স:</span>{' '}
            <span className="font-mono-nums font-semibold text-slate-800">
              {formatTaka(currentUser.balance)}
            </span>
          </div>
          <div>
            <span className="text-slate-500">রিচার্জের পর অবশিষ্ট:</span>{' '}
            <span
              className={`font-mono-nums font-bold ${
                balanceAfter < 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatTaka(Math.max(0, balanceAfter))}
            </span>
          </div>
        </div>

        {/* Insufficient balance message & CTA */}
        {!isBalanceSufficient && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <span>অপর্যাপ্ত ব্যালেন্স! ওয়ালেটে টাকা যোগ করুন।</span>
            <button
              type="button"
              onClick={onOpenAddMoney}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors"
            >
              + অ্যাড মানি
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isBalanceSufficient || numAmount < 10}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
            !isBalanceSufficient || numAmount < 10
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow'
          }`}
        >
          <span>রিচার্জ নিশ্চিত করুন ({formatTaka(numAmount)})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-center text-lg text-slate-900 mb-1">
              রিচার্জ নিশ্চিতকরণ
            </h4>
            <p className="text-xs text-center text-slate-500 mb-4">
              দয়া করে নিচের তথ্যগুলো যাচাই করুন
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs border border-slate-200/80 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">অপারেটর:</span>
                <span className="font-bold text-slate-800">{OPERATORS[operator].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">প্রাপক নাম্বার:</span>
                <span className="font-mono-nums font-bold text-slate-900">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সিম টাইপ:</span>
                <span className="font-medium text-slate-800">{simType === 'Prepaid' ? 'প্রিপেইড' : 'পোস্টপেইড'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-700">মোট খরচ:</span>
                <span className="text-indigo-600 font-mono-nums text-sm">{formatTaka(numAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmRecharge}
                className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>হ্যাঁ, পাঠিয়ে দিন</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
