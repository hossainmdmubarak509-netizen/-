import React, { useState } from 'react';
import { MessageCircle, Phone, X, ExternalLink, Copy, Check, Headphones } from 'lucide-react';

interface WhatsAppSupportButtonProps {
  phoneNumber: string; // e.g. "+8801844868379"
}

export const WhatsAppSupportButton: React.FC<WhatsAppSupportButtonProps> = ({
  phoneNumber,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sanitize phone number for wa.me link (only digits, strip + and spaces)
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const greetingText = encodeURIComponent(
    'আসসালামু আলাইকুম এডমিন, টেলিকম ও ডিজিটাল সেবা পোর্টাল সম্পর্কিত তথ্যের জন্য যোগাযোগ করছি।'
  );
  const waUrl = `https://wa.me/${cleanNumber}?text=${greetingText}`;

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2">
      {/* Popover Card */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 max-w-xs w-72 text-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                {/* Custom WhatsApp Icon */}
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 leading-tight">এডমিন হেল্পলাইন</h4>
                <p className="text-[10px] text-emerald-600 font-semibold">হোয়াটসঅ্যাপে সার্বক্ষণিক সেবা</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            রিচার্জ, ড্রাইভ অফার বা NID সেবা নিয়ে যেকোনো সহায়তার জন্য সরাসরি এডমিনের সাথে হোয়াটসঅ্যাপে চ্যাট করুন।
          </p>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono-nums font-bold tracking-wide">{phoneNumber}</span>
            </div>
            <button
              onClick={handleCopyNumber}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 flex items-center gap-1 transition-colors"
              title="নাম্বার কপি করুন"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <span>হোয়াটসঅ্যাপে মেসেজ পাঠান</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2.5 py-2.5 px-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ring-2 ring-emerald-400/30"
          title="এডমিন হেল্পলাইন হোয়াটসঅ্যাপ"
        >
          {/* WhatsApp Icon */}
          <div className="w-5 h-5 flex items-center justify-center">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <span className="hidden sm:inline">হেল্পলাইন</span>
          <span className="font-mono-nums text-[11px] opacity-90 hidden md:inline">
            {phoneNumber}
          </span>
          {/* Subtle online indicator dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
        </button>
      </div>
    </div>
  );
};
