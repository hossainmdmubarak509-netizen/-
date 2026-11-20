import React from 'react';
import { Megaphone, X, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { formatDateTime } from '../utils/telecomUtils';

interface CustomerNoticeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  sentAt?: string;
  onClose: () => void;
}

export const CustomerNoticeModal: React.FC<CustomerNoticeModalProps> = ({
  isOpen,
  title,
  message,
  sentAt,
  onClose,
}) => {
  if (!isOpen || !message.trim()) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-purple-800 p-5 sm:p-6 text-white">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-8 w-28 h-28 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
                <Megaphone className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-amber-300 border border-white/15 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>এডমিন নোটিশ</span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg leading-snug text-white">
                  {title || 'গুরুত্বপূর্ণ ঘোষণা'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white transition-colors shrink-0"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-indigo-50/40 border border-amber-200/70 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
            {message}
          </div>

          {sentAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 justify-end">
              <Clock className="w-3.5 h-3.5" />
              <span>প্রকাশিত: {formatDateTime(sentAt)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>বুঝেছি, ঠিক আছে</span>
          </button>
        </div>

      </div>
    </div>
  );
};
