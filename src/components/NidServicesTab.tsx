import React, { useState, useEffect } from 'react';
import {
  FileText,
  Server,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileSpreadsheet,
  Globe,
  FileCheck,
  Wallet,
  Zap,
  Lock,
  Plus,
  FileUp,
  Paperclip,
  Trash2,
} from 'lucide-react';
import {
  DigitalServiceItem,
  NidOrderRequest,
  User,
  AppSettings,
  UploadedFileAttachment,
} from '../types/telecom';
import { formatTaka, formatDateTime } from '../utils/telecomUtils';
import { readFileAsDataUrl } from '../utils/pdfHelper';
import { downloadOrderFile } from '../utils/cloudFileService';

interface NidServicesTabProps {
  currentUser: User;
  settings: AppSettings;
  digitalServices: DigitalServiceItem[];
  userNidOrders: NidOrderRequest[];
  selectedServiceId?: string;
  onSelectService?: (serviceId: string | undefined) => void;
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
    customerFiles?: UploadedFileAttachment[];
  }) => void;
  onOpenAddMoney: () => void;
  onViewReceipt: (order: NidOrderRequest) => void;
}

export const NidServicesTab: React.FC<NidServicesTabProps> = ({
  currentUser,
  digitalServices,
  userNidOrders,
  selectedServiceId: externalServiceId,
  onSelectService,
  onOrderService,
  onOpenAddMoney,
  onViewReceipt,
}) => {
  // Only show services that the admin has set to active (চালু)
  const activeServices = digitalServices.filter((s) => s.active);

  // Undefined means show service selection list; string means open dedicated order page for that service
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(externalServiceId);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [customerFiles, setCustomerFiles] = useState<UploadedFileAttachment[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Sync when triggered from SideMenuDrawer or tab reset
  useEffect(() => {
    setSelectedServiceId(externalServiceId);
    setFieldValues({});
    setCustomerFiles([]);
    setError(null);
    setOrderSubmitted(false);
    if (externalServiceId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [externalServiceId]);

  const currentService = selectedServiceId
    ? activeServices.find((s) => s.id === selectedServiceId)
    : undefined;

  const currentFee = currentService ? currentService.fee : 0;
  const hasEnoughBalance = currentUser.balance >= currentFee;
  const remainingBalance = currentUser.balance - currentFee;

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    setError(null);
  };

  const handleAttachCustomerFiles = async (fileList: FileList | null, fieldId?: string) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setIsReadingFiles(true);
    try {
      const filesArray = Array.from(fileList);
      const uploaded: UploadedFileAttachment[] = [];
      for (const file of filesArray) {
        const res = await readFileAsDataUrl(file);
        const uid = `cfile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        uploaded.push({
          id: uid,
          fileId: uid,
          fileName: res.fileName,
          fileSize: res.fileSize,
          fileType: res.fileType,
          dataUrl: res.dataUrl,
        });
      }
      setCustomerFiles((prev) => [...prev, ...uploaded]);
      if (fieldId && uploaded[0]) {
        setFieldValues((prev) => ({
          ...prev,
          [fieldId]: uploaded.map((u) => u.fileName).join(', '),
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsReadingFiles(false);
    }
  };

  const handleRemoveCustomerFile = (fileId: string) => {
    setCustomerFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleOpenServiceOrderPage = (id: string) => {
    setSelectedServiceId(id);
    onSelectService?.(id);
    setFieldValues({});
    setCustomerFiles([]);
    setError(null);
    setOrderSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToServices = () => {
    setSelectedServiceId(undefined);
    onSelectService?.(undefined);
    setFieldValues({});
    setCustomerFiles([]);
    setError(null);
    setOrderSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentService) return;

    // Validate required fields
    for (const field of currentService.fields) {
      if (field.required && !fieldValues[field.id]?.trim()) {
        setError(
          field.type === 'file'
            ? `অনুগ্রহ করে "${field.label}" এর জন্য ফাইল আপলোড করুন।`
            : `অনুগ্রহ করে "${field.label}" পূরণ করুন।`
        );
        return;
      }
    }

    if (!hasEnoughBalance) {
      setError('অর্ডার করার জন্য ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! আগে অ্যাড মানি করুন।');
      return;
    }

    const nidVal =
      fieldValues['nidNumber'] || fieldValues['nid'] || fieldValues['regNumber'] || 'N/A';
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
      customerFiles: customerFiles.length > 0 ? customerFiles : undefined,
    });

    setFieldValues({});
    setCustomerFiles([]);
    setOrderSubmitted(true);
  };

  const renderIcon = (iconName: string, sizeClass = 'w-5 h-5') => {
    switch (iconName) {
      case 'Server':
        return <Server className={sizeClass} />;
      case 'KeyRound':
        return <KeyRound className={sizeClass} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={sizeClass} />;
      case 'Globe':
        return <Globe className={sizeClass} />;
      default:
        return <FileText className={sizeClass} />;
    }
  };

  // ============================================================================
  // VIEW 1: DEDICATED ATTRACTIVE ORDER PAGE (Hides all other services!)
  // ============================================================================
  if (currentService) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
        
        {/* Top Back Navigation Strip */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleBackToServices}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs sm:text-sm font-bold transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
            <span>সকল সেবায় ফিরে যান</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">ব্যালেন্স:</span>
            <span className="font-mono-nums font-extrabold text-indigo-700">
              {formatTaka(currentUser.balance)}
            </span>
          </div>
        </div>

        {/* Focused Order Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          
          {/* Eye-Catching Gradient Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-purple-800 p-6 sm:p-8 text-white">
            {/* Decorative glowing orbs */}
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-12 w-40 h-40 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 shadow-lg text-amber-300">
                  {renderIcon(currentService.icon, 'w-7 h-7')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      <Sparkles className="w-3 h-3" />
                      ডিজিটাল অর্ডার পেইজ
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-indigo-100 border border-white/15">
                      <Zap className="w-3 h-3 text-emerald-300" />
                      অফিসিয়াল PDF ডেলিভারি
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
                    {currentService.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-lg leading-relaxed">
                    {currentService.description}
                  </p>
                </div>
              </div>

              {/* Price Tag Box */}
              <div className="sm:text-right bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shrink-0 self-start sm:self-center">
                <span className="text-[11px] text-indigo-200 block font-medium">
                  সার্ভিস চার্জ
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono-nums text-amber-300 tracking-tight">
                  {formatTaka(currentFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Confirmation Screen OR Form Body */}
          {orderSubmitted ? (
            <div className="p-7 sm:p-10 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  অর্ডার সফলভাবে সাবমিট হয়েছে!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-md mx-auto">
                  আপনার <b>{currentService.title}</b> অর্ডারটি এডমিনের কাছে পাঠানো হয়েছে। অর্ডার সম্পন্ন হলেই আপনার ড্যাশবোর্ড থেকে সরাসরি PDF ডাউনলোড করতে পারবেন।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBackToServices}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>অর্ডার হিস্ট্রি ও ডেলিভারি দেখুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSubmitted(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all"
                >
                  + আরেকটি অর্ডার করুন
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* Form Instruction Strip */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                    ১
                  </span>
                  <span>সঠিক তথ্য দিয়ে নিচের ফরমটি পূরণ করুন</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  মোট {currentService.fields.length} টি তথ্য
                </span>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Dynamic Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {currentService.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className={
                      field.id === 'name' || field.type === 'file' || currentService.fields.length === 1
                        ? 'sm:col-span-2'
                        : ''
                    }
                  >
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <span className="text-indigo-500 font-mono-nums">{idx + 1}.</span>
                      <span>{field.label}</span>
                      {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === 'file' ? (
                      <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer transition-all">
                        <div className="flex items-center gap-2.5 text-xs">
                          <FileUp className="w-5 h-5 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-700">
                            {fieldValues[field.id]
                              ? `সিলেক্টেড: ${fieldValues[field.id]}`
                              : field.placeholder || 'PDF, ছবি বা যেকোনো ফাইল সিলেক্ট করুন'}
                          </span>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold self-start sm:self-auto shrink-0">
                          ফাইল বাছুন
                        </span>
                        <input
                          type="file"
                          onChange={(e) => {
                            handleAttachCustomerFiles(e.target.files, field.id);
                            e.target.value = '';
                          }}
                          className="sr-only"
                        />
                      </label>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Universal Customer File / Document Attachment Zone (PDF, Image, Docs, Any File) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                        প্রয়োজনীয় ডকুমেন্ট / ফাইল আপলোড (ঐচ্ছিক)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        PDF, ছবি (JPG/PNG), Word বা যেকোনো ফাইল সংযুক্ত করতে পারবেন
                      </p>
                    </div>
                  </div>
                  {customerFiles.length > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {customerFiles.length} টি ফাইল
                    </span>
                  )}
                </div>

                <label className="block border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white rounded-2xl p-4 text-center cursor-pointer transition-all">
                  <FileUp className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">
                    {isReadingFiles
                      ? 'ফাইল লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...'
                      : 'মোবাইল বা কম্পিউটার থেকে PDF / ছবি / যেকোনো ফাইল আপলোড করতে এখানে ক্লিক করুন'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    সর্বোচ্চ ১০ MB প্রতি ফাইল · একাধিক ফাইল সিলেক্ট করা যাবে
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      handleAttachCustomerFiles(e.target.files);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>

                {customerFiles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {customerFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{file.fileName}</span>
                          <span className="text-[10px] text-slate-400 font-mono-nums shrink-0">
                            ({file.fileSize})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomerFile(file.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                          title="ফাইল সরিয়ে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wallet Summary Card */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/90 p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>বর্তমান ওয়ালেট ব্যালেন্স:</span>
                  <span className="font-mono-nums font-bold text-slate-900">
                    {formatTaka(currentUser.balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>সার্ভিস প্রসেসিং ফি:</span>
                  <span className="font-mono-nums font-bold text-indigo-700">
                    - {formatTaka(currentFee)}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800">অর্ডার পরবর্তী ব্যালেন্স:</span>
                  {hasEnoughBalance ? (
                    <span className="font-mono-nums font-extrabold text-emerald-700 text-sm sm:text-base">
                      {formatTaka(remainingBalance)}
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 text-xs sm:text-sm">
                      ব্যালেন্স অপর্যাপ্ত (আরও {formatTaka(currentFee - currentUser.balance)} প্রয়োজন)
                    </span>
                  )}
                </div>
              </div>

              {/* Insufficient Balance Callout */}
              {!hasEnoughBalance && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold">
                      এই সেবাটি অর্ডার করতে আপনার ওয়ালেটে অন্তত {formatTaka(currentFee)} থাকতে হবে।
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAddMoney}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>অ্যাড মানি করুন</span>
                  </button>
                </div>
              )}

              {/* Attractive Submit CTA */}
              <button
                type="submit"
                disabled={!hasEnoughBalance}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all ${
                  !hasEnoughBalance
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl active:scale-[0.99]'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span>অর্ডার কনফার্ম করুন ({formatTaka(currentFee)})</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>আপনার সকল তথ্য সম্পূর্ণ গোপন ও নিরাপদ রাখা হয়</span>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: SERVICE SELECTION CATALOG + ORDER HISTORY (Default View)
  // ============================================================================
  return (
    <div className="space-y-6">
      
      {/* Services Catalog Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-7">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
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
                যেকোনো একটি সেবাতে ক্লিক করলেই সরাসরি অর্ডার পেইজ ওপেন হবে
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

        {/* Clickable Services Cards Grid */}
        {activeServices.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            বর্তমানে কোন ডিজিটাল সেবা চালু নেই।
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeServices.map((service) => (
              <button
                type="button"
                key={service.id}
                onClick={() => handleOpenServiceOrderPage(service.id)}
                className="group p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md hover:bg-indigo-50/20 text-left transition-all flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                      {renderIcon(service.icon, 'w-5 h-5')}
                    </div>
                    <span className="font-mono-nums font-extrabold text-base text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {formatTaka(service.fee)}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 mb-1 leading-snug transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {service.fields.length} টি তথ্য প্রয়োজন
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    <span>অর্ডার করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
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
              const hasAttachableFile = Boolean(
                order.pdfDataUrl || order.pdfFileId || (order.deliveryFileUrl && order.deliveryFileUrl !== '#')
              );
              const noteText = isRejected
                ? order.adminRemarks || order.deliveryNote
                : order.deliveryNote;

              const handleDownloadPdf = async () => {
                if (hasAttachableFile) {
                  const downloaded = await downloadOrderFile({
                    fileId: order.pdfFileId || `delivery_${order.id}`,
                    fileName: order.pdfFileName || `${order.serviceTitle}_${order.nidNumber}.pdf`,
                    dataUrl: order.pdfDataUrl,
                    fallbackUrl: order.deliveryFileUrl,
                  });
                  if (!downloaded) {
                    onViewReceipt(order);
                  }
                } else {
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
                          <span
                            className={`font-semibold font-mono-nums ${
                              isRejected ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {order.pdfFileName} ({order.pdfFileSize || 'PDF'})
                          </span>
                        </>
                      )}
                    </div>

                    {order.customerFiles && order.customerFiles.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">আপনার প্রদত্ত ফাইল:</span>
                        {order.customerFiles.map((cf) => (
                          <button
                            key={cf.id}
                            type="button"
                            onClick={() =>
                              void downloadOrderFile({
                                fileId: cf.fileId || cf.id,
                                fileName: cf.fileName,
                                dataUrl: cf.dataUrl,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>{cf.fileName}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {noteText && (
                      isRejected ? (
                        <div className="mt-1.5 p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span><b>বাতিল করার কারণ (এডমিন বার্তা):</b> {noteText}</span>
                        </div>
                      ) : (
                        <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-start gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span><b>এডমিন বার্তা:</b> {noteText}</span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="font-mono-nums font-bold text-slate-900 text-sm">
                      {formatTaka(order.fee)}
                    </span>

                    <div className="flex items-center gap-2">
                      {(isCompleted || (isRejected && hasAttachableFile)) && (
                        <button
                          onClick={handleDownloadPdf}
                          className={`px-3.5 py-1.5 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs ${
                            isRejected
                              ? 'bg-rose-600 hover:bg-rose-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          title={
                            isRejected
                              ? 'বাতিলের কারণ ও সংযুক্ত ফাইল ডাউনলোড করুন'
                              : 'অফিসিয়াল ডেলিভারি ফাইল ডাউনলোড করুন'
                          }
                        >
                          <Download className="w-4 h-4" />
                          <span>
                            {isRejected ? 'কারণ / ফাইল PDF ডাউনলোড' : 'ফাইল / PDF ডাউনলোড'}
                          </span>
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
