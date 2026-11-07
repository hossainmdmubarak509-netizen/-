import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

interface NoticeBannerProps {
  noticeText: string;
  enabled: boolean;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ noticeText, enabled }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!enabled || dismissed || !noticeText) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-y border-amber-200/80 px-4 py-2 text-xs md:text-sm text-amber-900">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 shrink-0">
            <Megaphone className="w-4 h-4 text-amber-600 animate-bounce" />
            <span className="hidden sm:inline">নোটিশ:</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-ellipsis font-medium">
            {noticeText}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-700 hover:text-amber-950 p-1 rounded transition-colors shrink-0"
          title="নোটিশ বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
