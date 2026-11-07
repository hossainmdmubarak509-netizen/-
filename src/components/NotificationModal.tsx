import React from 'react';
import {
  Bell,
  Check,
  Trash2,
  X,
  Smartphone,
  Tag,
  FileText,
  Wallet,
  ExternalLink,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AdminNotification, NotificationSettings } from '../types/telecom';
import { formatDateTime, formatTaka } from '../utils/telecomUtils';
import { playNotificationSound } from '../utils/soundHelper';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  settings: NotificationSettings;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onToggleSound: (enabled: boolean) => void;
  onNavigateToOrder: (type: AdminNotification['type'], targetId?: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  settings,
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteNotification,
  onClearAll,
  onToggleSound,
  onNavigateToOrder,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'recharge':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'drive_offer':
        return <Tag className="w-4 h-4 text-indigo-600" />;
      case 'nid_order':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'add_money':
        return <Wallet className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getBgColor = (type: AdminNotification['type']) => {
    switch (type) {
      case 'recharge':
        return 'bg-emerald-50 text-emerald-700';
      case 'drive_offer':
        return 'bg-indigo-50 text-indigo-700';
      case 'nid_order':
        return 'bg-amber-50 text-amber-700';
      case 'add_money':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full text-slate-800 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/80 flex items-center justify-center text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">এডমিন অর্ডার নোটিফিকেশন</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full font-mono-nums">
                    {unreadCount} নতুন
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                কাস্টমারদের রিচার্জ, ড্রাইভ অফার, NID ও অ্যাড মানি অ্যালার্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick sound toggle */}
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                onToggleSound(next);
                if (next) playNotificationSound();
              }}
              title={settings.soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
              className={`p-2 rounded-xl transition-colors ${
                settings.soundEnabled
                  ? 'bg-indigo-800 text-amber-300 hover:bg-indigo-700'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">মোট {notifications.length} টি নোটিফিকেশন</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>সব পড়া হয়েছে</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 font-medium ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব মুছুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600">কোন নোটিফিকেশন নেই</p>
              <p className="text-xs text-slate-400">কাস্টমার নতুন কোনো অর্ডার করলে এখানে নোটিফিকেশন দেখতে পাবেন।</p>
            </div>
          ) : (
            notifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-3 rounded-xl transition-all flex items-start gap-3 relative ${
                    !notif.read
                      ? 'bg-indigo-50/50 hover:bg-indigo-50/80 border border-indigo-100/70 shadow-2xs'
                      : 'hover:bg-slate-50 bg-white'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${getBgColor(
                      notif.type
                    )}`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <span>গ্রাহক: <b className="text-slate-800">{notif.customerName}</b></span>
                        <span>·</span>
                        <span className="font-mono-nums">{notif.customerPhone}</span>
                        {notif.amount && (
                          <>
                            <span>·</span>
                            <span className="font-mono-nums font-bold text-indigo-700">
                              {formatTaka(notif.amount)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notif.id);
                            onNavigateToOrder(notif.type, notif.targetRefId);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <span>অর্ডারে যান</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notif.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>সাউন্ড অ্যালার্ট: {settings.soundEnabled ? 'চালু আছে' : 'বন্ধ'}</span>
          </div>
          <button
            onClick={() => {
              playNotificationSound();
            }}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold"
          >
            সাউন্ড টেস্ট
          </button>
        </div>

      </div>
    </div>
  );
};
