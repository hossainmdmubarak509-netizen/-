import React, { useState } from 'react';
import { User as UserIcon, Phone, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { User } from '../types/telecom';
import { isValidBdPhone } from '../utils/telecomUtils';

interface AuthSectionProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
}

export const AuthSection: React.FC<AuthSectionProps> = ({ onLogin, availableUsers }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('অনুগ্রহ করে আপনার নাম প্রদান করুন।');
      return;
    }

    if (!isValidBdPhone(phone)) {
      setError('সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    // Check if user already exists
    const existing = availableUsers.find((u) => u.phone === phone);
    if (existing) {
      onLogin(existing);
      return;
    }

    // Create new registered user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${phone}@telecom.local`,
      role: 'user',
      balance: 100.00, // Welcome bonus of ৳100 for newly registered customers!
      createdAt: new Date().toISOString(),
    };

    onLogin(newUser);
  };

  const handleSelectDemoUser = (user: User) => {
    onLogin(user);
  };

  return (
    <div className="max-w-md mx-auto my-6 px-4">
      {/* Welcome Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            টেলিকম সেবায় স্বাগতম
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            মোবাইল রিচার্জ ও ডিসকাউন্ট ড্রাইভ অফার উপভোগ করতে লগইন বা রেজিস্ট্রেশন করুন
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              আপনার পূর্ণ নাম
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="উদাঃ মোঃ রহিম"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মোবাইল নাম্বার
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">১১ ডিজিটের যেকোনো সচল নাম্বার</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ইমেইল এড্রেস (ঐচ্ছিক)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahim@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
          >
            <span>রেজিস্ট্রেশন ও প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            অথবা ডেমো একাউন্ট দিয়ে টেস্ট করুন
          </p>
          <div className="space-y-2">
            {availableUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectDemoUser(u)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors text-xs font-bold">
                    {u.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : '৳'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono-nums">{u.phone}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                  {u.role === 'admin' ? 'এডমিন' : `৳${u.balance.toFixed(2)}`}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
