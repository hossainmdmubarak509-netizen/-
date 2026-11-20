import React, { useState } from 'react';
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { User } from '../types/telecom';
import { isValidBdPhone } from '../utils/telecomUtils';

interface AuthSectionProps {
  onLogin: (user: User, openAdmin?: boolean) => void;
  availableUsers: User[];
}

export const AuthSection: React.FC<AuthSectionProps> = ({ onLogin, availableUsers }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regEmail, setRegEmail] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = loginPhone.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanPhone) {
      setError('অনুগ্রহ করে মোবাইল নাম্বার দিন।');
      return;
    }

    if (!cleanPassword) {
      setError('অনুগ্রহ করে পাসওয়ার্ড দিন।');
      return;
    }

    // 1. Check Admin Credentials: 01844868379 / mnb229Am
    if (cleanPhone === '01844868379') {
      if (cleanPassword === 'mnb229Am') {
        const adminUser: User = availableUsers.find((u) => u.phone === '01844868379') || {
          id: 'user-admin',
          name: 'টেলিকম সুপার এডমিন',
          phone: '01844868379',
          email: 'admin@telecomportal.bd',
          role: 'admin',
          balance: 50000.0,
          password: 'mnb229Am',
          createdAt: new Date().toISOString(),
        };
        onLogin(adminUser, true);
        return;
      } else {
        setError('এডমিন পাসওয়ার্ড সঠিক নয়!');
        return;
      }
    }

    // 2. Check Customer Demo Credentials: 01624488010 / mnb229Am
    if (cleanPhone === '01624488010') {
      if (cleanPassword === 'mnb229Am') {
        const demoCustomer: User = availableUsers.find((u) => u.phone === '01624488010') || {
          id: 'user-demo-customer',
          name: 'টেস্ট কাস্টমার',
          phone: '01624488010',
          email: 'customer@telecom.bd',
          role: 'user',
          balance: 850.0,
          password: 'mnb229Am',
          createdAt: new Date().toISOString(),
        };
        onLogin(demoCustomer, false);
        return;
      } else {
        setError('পাসওয়ার্ড সঠিক নয়! সঠিক পাসওয়ার্ড mnb229Am দিন।');
        return;
      }
    }

    // 3. Check Other existing users
    const matchedUser = availableUsers.find((u) => u.phone === cleanPhone);
    if (matchedUser) {
      if (matchedUser.password && matchedUser.password !== cleanPassword) {
        setError('পাসওয়ার্ড ভুল হয়েছে! পুনরায় চেষ্টা করুন।');
        return;
      }
      onLogin(matchedUser, matchedUser.role === 'admin');
      return;
    }

    setError('এই নাম্বারে কোনো একাউন্ট পাওয়া যায়নি! অনুগ্রহ করে নতুন একাউন্ট খুলুন।');
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError('অনুগ্রহ করে আপনার নাম প্রদান করুন।');
      return;
    }

    if (!isValidBdPhone(regPhone)) {
      setError('সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setError('কমপক্ষে ৪ ডিজিটের পাসওয়ার্ড দিন।');
      return;
    }

    // Check if already registered
    const existing = availableUsers.find((u) => u.phone === regPhone.trim());
    if (existing) {
      setError('এই মোবাইল নাম্বারে ইতোমধ্যে একাউন্ট খোলা আছে! অনুগ্রহ করে লগইন করুন।');
      return;
    }

    // Create new registered customer
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: regName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || `${regPhone.trim()}@telecom.bd`,
      password: regPassword.trim(),
      role: 'user',
      balance: 100.0, // Welcome bonus of ৳100 for newly registered customers
      createdAt: new Date().toISOString(),
    };

    onLogin(newUser, false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/60 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 md:p-8">
          
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              টেলিকম ও ডিজিটাল সেবা পোর্টাল
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              সেবা ব্যবহার করতে আপনার নতুন একাউন্ট খুলুন অথবা লগইন করুন
            </p>
          </div>

          {/* Tab Switcher: Register (Create Account) vs Login */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নতুন একাউন্ট খুলুন</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন করুন</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

        {/* MODE 1: LOGIN FORM */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ইউজার / মোবাইল নাম্বার
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড দিন"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
            >
              <span>লগইন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* MODE 2: REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আপনার পূর্ণ নাম
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
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
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                নতুন পাসওয়ার্ড সেট করুন
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="কমপক্ষে ৪ সংখ্যার পাসওয়ার্ড"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ইমেইল এড্রেস (ঐচ্ছিক)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
            >
              <span>রেজিস্ট্রেশন করুন (+ ৳১০০ বোনাস)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        </div>
      </div>
    </div>
  );
};
