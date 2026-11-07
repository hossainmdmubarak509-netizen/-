import React, { useState } from 'react';
import { Tag, Search, Sparkles, AlertCircle, Check, Smartphone, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { DriveOffer, Operator, OfferCategory, User, SimType } from '../types/telecom';
import { OPERATORS, formatTaka, isValidBdPhone } from '../utils/telecomUtils';

interface DriveOffersTabProps {
  currentUser: User;
  offers: DriveOffer[];
  onBuyOffer: (offer: DriveOffer, targetPhone: string, simType: SimType, customerNote?: string) => void;
  onOpenAddMoney: () => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'সব ধরণ' },
  { id: 'combo', label: 'কম্বো প্যাক' },
  { id: 'internet', label: 'ইন্টারনেট' },
  { id: 'minute', label: 'মিনিট' },
  { id: 'cashback', label: 'ক্যাশব্যাক' },
  { id: 'special', label: 'স্পেশাল ডিল' },
];

export const DriveOffersTab: React.FC<DriveOffersTabProps> = ({
  currentUser,
  offers,
  onBuyOffer,
  onOpenAddMoney,
}) => {
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Buy Modal State
  const [activeOffer, setActiveOffer] = useState<DriveOffer | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [simType, setSimType] = useState<SimType>('Prepaid');
  const [customerNote, setCustomerNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filtered offers (only active offers)
  const filteredOffers = offers.filter((o) => {
    if (!o.active) return false;
    if (selectedOperator !== 'ALL' && o.operator !== selectedOperator) return false;
    if (selectedCategory !== 'ALL' && o.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.operator.toLowerCase().includes(q) ||
        o.division.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.tag && o.tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenBuy = (offer: DriveOffer) => {
    setActiveOffer(offer);
    setRecipientPhone(currentUser.phone);
    setSimType('Prepaid');
    setCustomerNote('');
    setError(null);
  };

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffer) return;

    if (!isValidBdPhone(recipientPhone)) {
      setError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (currentUser.balance < activeOffer.offerPrice) {
      setError('অফারটি কেনার জন্য ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! দয়া করে আগে অ্যাড মানি করুন।');
      return;
    }

    onBuyOffer(activeOffer, recipientPhone, simType, customerNote.trim());
    setActiveOffer(null);
    setRecipientPhone('');
    setCustomerNote('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-7">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base md:text-lg text-slate-900">
                সকল সিমের স্পেশাল ডিসকাউন্ট অফার
              </h3>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                {filteredOffers.length} টি সক্রিয়
              </span>
            </div>
            <p className="text-xs text-slate-500">
              এডমিন অনুমোদিত মেগা ইন্টারনেট, মিনিট বান্ডেল ও ক্যাশব্যাক অফার (অর্ডার করলে এডমিন ম্যানুয়ালি সফল করবে)
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="অফার খুঁজুন (যেমন: 40 GB, ক্যাশব্যাক)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs transition-all"
          />
        </div>
      </div>

      {/* Operator Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <button
          onClick={() => setSelectedOperator('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedOperator === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          সকল অপারেটর
        </button>
        {(['GP', 'Robi', 'Banglalink', 'Airtel', 'Teletalk', 'Skitto'] as Operator[]).map((opKey) => {
          const op = OPERATORS[opKey];
          const isSelected = selectedOperator === opKey;
          return (
            <button
              key={opKey}
              onClick={() => setSelectedOperator(opKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: op.color }}
              />
              <span>{op.name}</span>
            </button>
          );
        })}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
        <span className="text-slate-400">ধরণ:</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <p className="text-sm">কোন ডিসকাউন্ট অফার পাওয়া যায়নি।</p>
          <button
            onClick={() => {
              setSelectedOperator('ALL');
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="mt-2 text-xs text-indigo-600 hover:underline font-semibold"
          >
            ফিল্টার রিসেট করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffers.map((offer) => {
            const op = OPERATORS[offer.operator];
            const savings = offer.regularPrice - offer.offerPrice;

            return (
              <div
                key={offer.id}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-indigo-400 bg-white hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Operator, Division & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5"
                        style={{ backgroundColor: `${op.color}15`, color: op.color }}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: op.color }}
                        />
                        {op.name}
                      </span>

                      {offer.tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          {offer.tag}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {offer.division}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-sm text-slate-900 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
                    {offer.title}
                  </h4>

                  {/* Description if present */}
                  {offer.description && (
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      {offer.description}
                    </p>
                  )}

                  {/* Metadata: Validity & Savings */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 mb-3">
                    <span>মেয়াদ: <b className="text-slate-700">{offer.validity}</b></span>
                    <span>·</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {savings > 0 ? `৳${savings} সাশ্রয়` : 'স্পেশাল রেট'}
                    </span>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-slate-900 font-mono-nums">
                        ৳{offer.offerPrice}
                      </span>
                      {offer.regularPrice > offer.offerPrice && (
                        <del className="text-xs text-slate-400 font-mono-nums">
                          ৳{offer.regularPrice}
                        </del>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">অফার মূল্য</span>
                  </div>

                  <button
                    onClick={() => handleOpenBuy(offer)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <span>অর্ডার করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy Offer Modal */}
      {activeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
            <h4 className="font-bold text-base text-slate-900 mb-1">
              ড্রাইভ অফার অর্ডার নিশ্চিতকরণ
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              অর্ডারটি সাবমিট করলে এডমিন ম্যানুয়ালি আপনার সিমে সফল করবেন
            </p>

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Offer details snapshot */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="font-bold text-indigo-700 text-sm">{activeOffer.title}</div>
              {activeOffer.description && (
                <div className="text-[11px] text-slate-500">{activeOffer.description}</div>
              )}
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>অপারেটর:</span>
                <span className="font-semibold text-slate-800">{activeOffer.operator}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>অফার মূল্য:</span>
                <span className="font-mono-nums font-bold text-slate-900 text-sm">
                  {formatTaka(activeOffer.offerPrice)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                <span>আপনার বর্তমান ব্যালেন্স:</span>
                <span className="font-mono-nums font-semibold text-slate-800">
                  {formatTaka(currentUser.balance)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPurchase} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  যে নাম্বারে অফারটি নিতে চান (প্রাপক নাম্বার)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono-nums font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সিমের ধরণ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimType('Prepaid')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      simType === 'Prepaid'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    প্রিপেইড (Prepaid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('Postpaid')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      simType === 'Postpaid'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    পোস্টপেইড (Postpaid)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  গ্রাহক নোট / বিশেষ বার্তা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="উদাঃ জরুরী প্রয়োজন / ড্রাইভ সিম"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-600"
                />
              </div>

              {/* Informative Note */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-[11px] text-amber-900">
                <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  অর্ডার করার সাথে সাথে ব্যালেন্স কাটা হবে এবং পেন্ডিং অবস্থায় থাকবে। এডমিন ৫-১০ মিনিটের মধ্যে ম্যানুয়ালি সফল করবেন।
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveOffer(null)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>অর্ডার কনফার্ম করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
