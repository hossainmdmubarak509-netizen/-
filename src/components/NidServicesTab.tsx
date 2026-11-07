import React, { useState } from 'react';
import {
  FileText,
  Server,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Check,
  ArrowRight,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Sparkles,
  FileSpreadsheet,
  Globe,
  FileCheck,
} from 'lucide-react';
import {
  DigitalServiceItem,
  NidOrderRequest,
  User,
  AppSettings,
} from '../types/telecom';
import { formatTaka, formatDateTime } from '../utils/telecomUtils';
import { triggerFileDownload } from '../utils/pdfHelper';

interface NidServicesTabProps {
  currentUser: User;
  settings: AppSettings;
  digitalServices: DigitalServiceItem[];
  userNidOrders: NidOrderRequest[];
  onOrderService: (data: {
    serviceId: string;
    serviceTitle: string;
    fee: number;
    formData: Record<string, string>;
    name?: string;
    nidNumber: string;
    dateOfBirth: string;
    upazila?: string;
    district?: string;
  }) => void;
  onOpenAddMoney: () => void;
  onViewReceipt: (order: NidOrderRequest) => void;
}

export const NidServicesTab: React.FC<NidServicesTabProps> = ({
  currentUser,
  settings,
  digitalServices,
  userNidOrders,
  onOrderService,
  onOpenAddMoney,
  onViewReceipt,
}) => {
  // Only show services that the admin has set to active (চালু)
  const activeServices = digitalServices.filter((s) => s.active);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    return activeServices[0]?.id || 'nid_pdf';
  });

  // Dynamic field values
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const currentService =
    activeServices.find((s) => s.id === selectedServiceId) || activeServices[0];

  const currentFee = currentService ? currentService.fee : 100;
  const hasEnoughBalance = currentUser.balance >= currentFee;

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    setError(null);
  };

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    setFieldValues({});
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentService) return;

    // Validate required fields
    for (const field of currentService.fields) {
      if (field.required && !fieldValues[field.id]?.trim()) {
        setError(`অনুগ্রহ করে "${field.label}" পূরণ করুন।`);
        return;
      }
    }

    if (!hasEnoughBalance) {
      setError('অর্ডার করার জন্য ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! আগে অ্যাড মানি করুন।');
      return;
    }

    // Extract common fields for legacy mapping
    const nidVal =
      fieldValues['nidNumber'] || fieldValues['nid'] || fieldValues['regNumber'] || '0000000000';
    const dobVal = fieldValues['dateOfBirth'] || fieldValues['dob'] || 'N/A';
    const nameVal = fieldValues['name'];
    const upazilaVal = fieldValues['upazila'];
    const districtVal = fieldValues['district'];

    onOrderService({
      serviceId: currentService.id,
      serviceTitle: currentService.title,
      fee: currentFee,
      formData: fieldValues,
      name: nameVal,
      nidNumber: nidVal,
      dateOfBirth: dobVal,
      upazila: upazilaVal,
      district: districtVal,
    });

    setFieldValues({});
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Server':
        return <Server className="w-4 h-4" />;
      case 'KeyRound':
        return <KeyRound className="w-4 h-4" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'Globe':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Services Selector & Order Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-7">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg text-slate-900">
                  এনআইডি ও ডিজিটাল সেবা পোর্টাল
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  {activeServices.length} টি সেবা চালু
                </span>
              </div>
              <p className="text-xs text-slate-500">
                অফিসিয়াল NID PDF কপি, অনলাইন সার্ভার কপি ও অন্যান্য সরকারি ডিজিটাল সেবা
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">ওয়ালেট ব্যালেন্স:</span>
            <p className="font-mono-nums font-bold text-indigo-700 text-sm">
              {formatTaka(currentUser.balance)}
            </p>
          </div>
        </div>

        {/* Dynamic Services Selector Pills / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {activeServices.map((service) => {
            const isSelected = selectedServiceId === service.id;
            return (
              <button
                type="button"
                key={service.id}
                onClick={() => handleSelectService(service.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {renderIcon(service.icon)}
                    </div>
                    <span className="font-mono-nums font-extrabold text-sm text-indigo-700">
                      {formatTaka(service.fee)}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-1 leading-snug">
                    {service.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{service.fields.length} টি তথ্য প্রয়োজন</span>
                  <span className={isSelected ? 'text-indigo-600 font-bold' : ''}>
                    {isSelected ? '✓ নির্বাচিত' : 'সিলেক্ট করুন'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Form for Selected Service */}
        {currentService && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800">
                  নির্বাচিত সেবা: <b>{currentService.title}</b>
                </span>
              </div>
              <span className="font-mono-nums font-bold text-indigo-700 text-sm">
                প্রসেসিং ফি: {formatTaka(currentFee)}
              </span>
            </div>

            {/* Render each dynamic field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentService.fields.map((field) => (
                <div
                  key={field.id}
                  className={
                    field.id === 'name' || currentService.fields.length === 1
                      ? 'sm:col-span-2'
                      : ''
                  }
                >
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium transition-all"
                  />
                </div>
              ))}
            </div>

            {/* Balance check */}
            {!hasEnoughBalance && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                <span>ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন {formatTaka(currentFee)}।</span>
                <button
                  type="button"
                  onClick={onOpenAddMoney}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
                >
                  + অ্যাড মানি
                </button>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={!hasEnoughBalance}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                !hasEnoughBalance
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow'
              }`}
            >
              <span>
                অর্ডার সাবমিট করুন (চার্জ: {formatTaka(currentFee)})
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

      {/* User's Digital Services Orders History with Real PDF Download */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              আপনার ডিজিটাল সেবা ও PDF ডেলিভারি হিস্ট্রি
            </h4>
            <p className="text-xs text-slate-500">
              এডমিন অর্ডার সফল করার সাথে সাথে এখান থেকে সরাসরি PDF ডাউনলোড করতে পারবেন
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            মোট {userNidOrders.length} টি অর্ডার
          </span>
        </div>

        {userNidOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            এখনও কোন NID বা ডিজিটাল সেবা অর্ডার করেননি।
          </div>
        ) : (
          <div className="space-y-3">
            {userNidOrders.map((order) => {
              const isCompleted = order.status === 'completed';
              const isPending = order.status === 'pending';
              const isRejected = order.status === 'rejected';

              const handleDownloadPdf = () => {
                if (order.pdfDataUrl) {
                  triggerFileDownload(
                    order.pdfDataUrl,
                    order.pdfFileName || `${order.serviceTitle}_${order.nidNumber}.pdf`
                  );
                } else if (order.deliveryFileUrl && order.deliveryFileUrl !== '#') {
                  window.open(order.deliveryFileUrl, '_blank');
                } else {
                  // Open receipt
                  onViewReceipt(order);
                }
              };

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {order.serviceTitle}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          ডেলিভারি সম্পন্ন
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3" />
                          প্রক্রিয়াধীন রয়েছে
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          বাতিল ও রিফান্ডেড
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>NID: <b className="font-mono-nums text-slate-800">{order.nidNumber}</b></span>
                      <span>·</span>
                      <span>জন্ম তারিখ: <b className="font-mono-nums">{order.dateOfBirth}</b></span>
                      {order.name && (
                        <>
                          <span>·</span>
                          <span>নাম: <b>{order.name}</b></span>
                        </>
                      )}
                      {order.district && (
                        <>
                          <span>·</span>
                          <span>{order.upazila}, {order.district}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-mono-nums">TrxID: {order.trxId}</span>
                      <span>·</span>
                      <span>{formatDateTime(order.timestamp)}</span>
                      {order.pdfFileName && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold font-mono-nums">
                            {order.pdfFileName} ({order.pdfFileSize || 'PDF'})
                          </span>
                        </>
                      )}
                    </div>

                    {order.deliveryNote && (
                      <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><b>এডমিন বার্তা:</b> {order.deliveryNote}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="font-mono-nums font-bold text-slate-900 text-sm">
                      {formatTaka(order.fee)}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* PDF DOWNLOAD BUTTON */}
                      {isCompleted && (
                        <button
                          onClick={handleDownloadPdf}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                          title="অফিসিয়াল PDF ডাউনলোড করুন"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF ডাউনলোড</span>
                        </button>
                      )}
                      <button
                        onClick={() => onViewReceipt(order)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
                      >
                        রশিদ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
