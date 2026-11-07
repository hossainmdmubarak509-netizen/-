import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Copy, Check, Printer, X, ShieldCheck, Download } from 'lucide-react';
import { RechargeRequest, AddMoneyRequest, NidOrderRequest, Operator } from '../types/telecom';
import { formatTaka, formatDateTime, OPERATORS } from '../utils/telecomUtils';
import { triggerFileDownload } from '../utils/pdfHelper';

interface ReceiptModalProps {
  receipt: RechargeRequest | AddMoneyRequest | NidOrderRequest | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const isRecharge = 'targetPhone' in receipt;
  const isNidOrder = 'serviceType' in receipt;
  const isAddMoney = !isRecharge && !isNidOrder;

  const amount = isNidOrder
    ? (receipt as NidOrderRequest).fee
    : (receipt as RechargeRequest | AddMoneyRequest).amount;

  const isApproved = receipt.status === 'completed' || receipt.status === 'approved';
  const isPending = receipt.status === 'pending';
  const isRejected = receipt.status === 'rejected';

  const copyTrxId = () => {
    navigator.clipboard.writeText(receipt.trxId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const operatorInfo = isRecharge && (receipt as RechargeRequest).operator !== 'All' 
    ? OPERATORS[(receipt as RechargeRequest).operator as Operator] 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in duration-150 my-6">
        
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base">
              ৳
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">টেলিকম ও ডিজিটাল সেবা</h3>
              <p className="text-xs text-slate-400">অফিসিয়াল ডিজিটাল ভাউচার ও ট্রানজেকশন রশিদ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div className="text-center">
            {isApproved && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>লেনদেন সফল হয়েছে</span>
              </div>
            )}
            {isPending && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200">
                <Clock className="w-4 h-4" />
                <span>প্রক্রিয়াধীন রয়েছে (পেন্ডিং)</span>
              </div>
            )}
            {isRejected && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-sm font-semibold border border-rose-200">
                <XCircle className="w-4 h-4" />
                <span>লেনদেন বাতিল ও রিফান্ডেড</span>
              </div>
            )}
            <div className="mt-3 text-3xl font-bold text-slate-900 font-mono-nums tracking-tight">
              {formatTaka(amount)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRecharge
                ? 'মোবাইল রিচার্জ / ড্রাইভ অফার খরচ'
                : isNidOrder
                ? 'এনআইডি ও সার্ভার কপি প্রসেসিং ফি'
                : 'ওয়ালেটে জমা (অ্যাড মানি)'}
            </p>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5 text-sm">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span>ট্রানজেকশন আইডি (TrxID)</span>
              <div className="flex items-center gap-1 font-mono-nums font-semibold text-slate-800">
                <span>{receipt.trxId}</span>
                <button
                  onClick={copyTrxId}
                  title="কপি করুন"
                  className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600">সেবার ধরণ</span>
              <span className="font-semibold text-slate-900">
                {isRecharge
                  ? (receipt as RechargeRequest).type === 'drive_offer'
                    ? 'ড্রাইভ অফার'
                    : 'মোবাইল রিচার্জ (ফ্লেক্সিলোড)'
                  : isNidOrder
                  ? (receipt as NidOrderRequest).serviceTitle
                  : `অ্যাড মানি (${(receipt as AddMoneyRequest).method})`}
              </span>
            </div>

            {/* Recharge Specific fields */}
            {isRecharge && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">অপারেটর</span>
                  <span className="font-semibold flex items-center gap-1.5">
                    {operatorInfo && (
                      <span className={`w-2.5 h-2.5 rounded-full inline-block`} style={{ backgroundColor: operatorInfo.color }} />
                    )}
                    {(receipt as RechargeRequest).operator} ({operatorInfo?.nameBn || ''})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">প্রাপক নাম্বার</span>
                  <span className="font-mono-nums font-bold text-slate-900">
                    {(receipt as RechargeRequest).targetPhone}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">সিম টাইপ</span>
                  <span className="font-medium text-slate-800">
                    {(receipt as RechargeRequest).simType === 'Prepaid' ? 'প্রিপেইড' : 'পোস্টপেইড'}
                  </span>
                </div>
                {(receipt as RechargeRequest).offerTitle && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-600 shrink-0">অফার প্যাকেজ</span>
                    <span className="text-right font-medium text-indigo-700 text-xs">
                      {(receipt as RechargeRequest).offerTitle}
                    </span>
                  </div>
                )}
                {(receipt as RechargeRequest).customerNote && (
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-600 shrink-0">গ্রাহক বার্তা</span>
                    <span className="text-right font-medium text-slate-800 text-xs">
                      {(receipt as RechargeRequest).customerNote}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* NID Specific fields */}
            {isNidOrder && (
              <>
                {(receipt as NidOrderRequest).name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">আবেদনকারীর নাম</span>
                    <span className="font-semibold text-slate-900">
                      {(receipt as NidOrderRequest).name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">NID নাম্বার</span>
                  <span className="font-mono-nums font-bold text-slate-900">
                    {(receipt as NidOrderRequest).nidNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">জন্ম তারিখ</span>
                  <span className="font-mono-nums font-medium text-slate-800">
                    {(receipt as NidOrderRequest).dateOfBirth}
                  </span>
                </div>
                {(receipt as NidOrderRequest).district && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">এলাকা</span>
                    <span className="font-medium text-slate-800">
                      {(receipt as NidOrderRequest).upazila}, {(receipt as NidOrderRequest).district}
                    </span>
                  </div>
                )}
                {(receipt as NidOrderRequest).deliveryNote && (
                  <div className="flex justify-between items-start gap-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-600 shrink-0">ডেলিভারি নোট</span>
                    <span className="text-right font-semibold text-emerald-700 text-xs">
                      {(receipt as NidOrderRequest).deliveryNote}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Add Money Specific fields */}
            {isAddMoney && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">পেমেন্ট মেথড</span>
                  <span className="font-semibold text-slate-900">{(receipt as AddMoneyRequest).method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">প্রেরক নাম্বার</span>
                  <span className="font-mono-nums font-bold text-slate-900">
                    {(receipt as AddMoneyRequest).senderNumber}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs text-slate-500">
              <span>তারিখ ও সময়</span>
              <span className="font-mono-nums">{formatDateTime(receipt.timestamp)}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>গ্রাহক নাম</span>
              <span className="font-medium text-slate-800">{receipt.userName} ({receipt.userPhone})</span>
            </div>
          </div>

          {/* Security stamp note */}
          <div className="flex items-center gap-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>ডিজিটাল সেবা পোর্টাল সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত অফিসিয়াল রশিদ।</span>
          </div>

          {/* Completed NID Order PDF Download */}
          {isNidOrder && receipt.status === 'completed' && (
            <button
              onClick={() => {
                const nidReq = receipt as NidOrderRequest;
                if (nidReq.pdfDataUrl) {
                  triggerFileDownload(
                    nidReq.pdfDataUrl,
                    nidReq.pdfFileName || `${nidReq.serviceTitle}_${nidReq.nidNumber}.pdf`
                  );
                } else if (nidReq.deliveryFileUrl && nidReq.deliveryFileUrl !== '#') {
                  window.open(nidReq.deliveryFileUrl, '_blank');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>অফিসিয়াল PDF ডাউনলোড করুন</span>
              {(receipt as NidOrderRequest).pdfFileSize && (
                <span className="text-xs text-emerald-100 font-mono-nums">
                  ({(receipt as NidOrderRequest).pdfFileSize})
                </span>
              )}
            </button>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>রশিদ প্রিন্ট</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              ঠিক আছে
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
