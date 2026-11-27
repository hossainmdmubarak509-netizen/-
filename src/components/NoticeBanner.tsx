import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Megaphone, X } from 'lucide-react';

interface NoticeBannerProps {
  noticeText: string;
  enabled: boolean;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ noticeText, enabled }) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!enabled || dismissed || !noticeText) return null;

  const cleanText = noticeText.trim();
  const marqueeClass =
    cleanText.length > 180
      ? 'animate-notice-marquee-slow'
      : cleanText.length > 80
        ? 'animate-notice-marquee-medium'
        : 'animate-notice-marquee-fast';

  return (
    <div className="bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border-y border-amber-200/90 text-xs md:text-sm text-amber-950 shadow-2xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Badge */}
        <div className="flex items-center gap-1.5 font-extrabold text-amber-800 shrink-0 bg-amber-200/60 border border-amber-300/70 px-2 py-1 rounded-lg">
          <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 animate-bounce" />
          <span className="text-[11px] sm:text-xs">নোটিশ</span>
        </div>

        {/* Continuous Smoothly Walking Marquee Track */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="notice-marquee-container flex-1 min-w-0 overflow-hidden text-left cursor-pointer focus:outline-none"
          title="সম্পূর্ণ নোটিশ একসাথে পড়তে ক্লিক করুন (মাউস রাখলে থামবে)"
        >
          <div className={marqueeClass}>
            <span className="font-semibold text-amber-950 whitespace-nowrap pr-12 flex items-center gap-3">
              <span>{cleanText}</span>
              <span className="text-amber-500 text-xs" aria-hidden="true">✦</span>
            </span>
            <span
              className="font-semibold text-amber-950 whitespace-nowrap pr-12 flex items-center gap-3"
              aria-hidden="true"
            >
              <span>{cleanText}</span>
              <span className="text-amber-500 text-xs">✦</span>
            </span>
          </div>
        </button>

        {/* Right Controls: Expand Full Notice + Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-300/70 text-amber-900 font-bold text-[10px] sm:text-[11px] transition-colors"
            title={expanded ? 'সংক্ষিপ্ত করুন' : 'সম্পূর্ণ নোটিশ পড়ুন'}
          >
            <span className="hidden sm:inline">{expanded ? 'বন্ধ করুন' : 'পুরো পড়ুন'}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-amber-700 hover:text-amber-950 hover:bg-amber-200/60 p-1 rounded-lg transition-colors"
            title="নোটিশ বন্ধ করুন"
            aria-label="নোটিশ বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Full-Text Readable Notice Panel */}
      {expanded && (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-3">
          <div className="bg-white/90 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed whitespace-pre-wrap shadow-2xs">
            {cleanText}
          </div>
        </div>
      )}
    </div>
  );
};
