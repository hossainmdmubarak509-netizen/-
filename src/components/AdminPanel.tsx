import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit,
  Users,
  Settings,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Phone,
  Save,
  Tag,
  Wallet,
  Smartphone,
  Copy,
  Check,
  Search,
  Zap,
  FileText,
  Server,
  KeyRound,
  Download,
  UploadCloud,
  FileCheck,
  FileSpreadsheet,
  Globe,
  Sliders,
  FileUp,
  Bell,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';
import {
  User,
  DriveOffer,
  AddMoneyRequest,
  RechargeRequest,
  NidOrderRequest,
  DigitalServiceItem,
  CustomServiceField,
  AppSettings,
  Operator,
  OfferCategory,
  AdminNotification,
  NotificationSettings,
} from '../types/telecom';
import { formatTaka, formatDateTime, OPERATORS } from '../utils/telecomUtils';
import { generateSampleNidPdf, triggerFileDownload } from '../utils/pdfHelper';
import { playNotificationSound, requestBrowserNotificationPermission } from '../utils/soundHelper';

interface AdminPanelProps {
  users: User[];
  offers: DriveOffer[];
  addMoneyRequests: AddMoneyRequest[];
  rechargeRequests: RechargeRequest[];
  nidOrders: NidOrderRequest[];
  digitalServices: DigitalServiceItem[];
  notifications: AdminNotification[];
  settings: AppSettings;
  onApproveAddMoney: (requestId: string) => void;
  onRejectAddMoney: (requestId: string, reason?: string) => void;
  onCompleteRecharge: (requestId: string) => void;
  onRejectRecharge: (requestId: string, refund: boolean) => void;
  onCompleteNidOrder: (
    orderId: string,
    deliveryNote?: string,
    fileUrl?: string,
    pdfDataUrl?: string,
    pdfFileName?: string,
    pdfFileSize?: string
  ) => void;
  onRejectNidOrder: (orderId: string, refund: boolean) => void;
  onAddDigitalService: (newService: Omit<DigitalServiceItem, 'id'>) => void;
  onUpdateDigitalService: (serviceId: string, updated: Partial<DigitalServiceItem>) => void;
  onDeleteDigitalService: (serviceId: string) => void;
  onAddOffer: (newOffer: Omit<DriveOffer, 'id'>) => void;
  onUpdateOffer: (offerId: string, updated: Partial<DriveOffer>) => void;
  onDeleteOffer: (offerId: string) => void;
  onAdjustUserBalance: (userId: string, deltaAmount: number, reason: string) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onMarkAllNotificationsAsRead: () => void;
  onMarkNotificationAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onUpdateNotificationSettings: (newNotifSettings: Partial<NotificationSettings>) => void;
  onResetDemoData: () => void;
  onBackToUserView: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  offers,
  addMoneyRequests,
  rechargeRequests,
  nidOrders,
  digitalServices,
  notifications,
  settings,
  onApproveAddMoney,
  onRejectAddMoney,
  onCompleteRecharge,
  onRejectRecharge,
  onCompleteNidOrder,
  onRejectNidOrder,
  onAddDigitalService,
  onUpdateDigitalService,
  onDeleteDigitalService,
  onAddOffer,
  onUpdateOffer,
  onDeleteOffer,
  onAdjustUserBalance,
  onUpdateSettings,
  onMarkAllNotificationsAsRead,
  onMarkNotificationAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onUpdateNotificationSettings,
  onResetDemoData,
  onBackToUserView,
}) => {
  const [adminTab, setAdminTab] = useState<
    'nid-orders' | 'services-builder' | 'drive-orders' | 'offers' | 'add-money' | 'recharges' | 'users' | 'settings' | 'notifications'
  >('nid-orders');

  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'recharge' | 'drive_offer' | 'nid_order' | 'add_money'>('all');

  // Copy feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Delivery Modal for NID Orders with Real PDF Upload
  const [deliveringNidOrder, setDeliveringNidOrder] = useState<NidOrderRequest | null>(null);
  const [deliveryNoteInput, setDeliveryNoteInput] = useState('আপনার অফিসিয়াল কপি প্রস্তুত। ডাউনলোড করে নিন।');
  const [uploadedPdfDataUrl, setUploadedPdfDataUrl] = useState<string | null>(null);
  const [uploadedPdfFileName, setUploadedPdfFileName] = useState<string | null>(null);
  const [uploadedPdfFileSize, setUploadedPdfFileSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Service Modal State (Custom Digital Service Builder)
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState<'create' | 'edit'>('create');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<{
    title: string;
    description: string;
    fee: number;
    category: 'nid' | 'certificate' | 'gov' | 'other';
    icon: string;
    active: boolean;
    fields: CustomServiceField[];
  }>({
    title: '',
    description: '',
    fee: 100,
    category: 'nid',
    icon: 'FileText',
    active: true,
    fields: [
      { id: 'nidNumber', label: 'NID নাম্বার', placeholder: '১০, ১৩ বা ১৭ ডিজিট', required: true, type: 'number' },
      { id: 'dateOfBirth', label: 'জন্ম তারিখ', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
    ],
  });

  // Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerModalMode, setOfferModalMode] = useState<'create' | 'edit'>('create');
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<{
    operator: Operator;
    title: string;
    category: OfferCategory;
    description: string;
    regularPrice: number;
    offerPrice: number;
    validity: string;
    division: string;
    commission: number;
    tag: string;
    active: boolean;
  }>({
    operator: 'GP',
    title: '',
    category: 'combo',
    description: '',
    regularPrice: 799,
    offerPrice: 649,
    validity: '৩০ দিন',
    division: 'সারাদেশে চলবে',
    commission: 150,
    tag: 'হট ডিল 🔥',
    active: true,
  });

  // Search & Filters
  const [nidStatusFilter, setNidStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [nidSearchQuery, setNidSearchQuery] = useState('');

  // User balance adjustment
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('100');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState('সরাসরি এডমিন রিচার্জ');

  // Settings form state
  const [noticeInput, setNoticeInput] = useState(settings.noticeText);
  const [noticeActive, setNoticeActive] = useState(settings.noticeEnabled);
  const [paymentNumbers, setPaymentNumbers] = useState(settings.paymentNumbers);
  const [whatsappInput, setWhatsappInput] = useState(settings.whatsappNumber || '+8801844868379');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Computed metrics
  const pendingNidOrders = nidOrders.filter((o) => o.status === 'pending');
  const pendingNidOrdersTotal = pendingNidOrders.reduce((sum, o) => sum + o.fee, 0);

  const driveOrders = rechargeRequests.filter((r) => r.type === 'drive_offer');
  const pendingDriveOrders = driveOrders.filter((r) => r.status === 'pending');

  const pendingAddMoney = addMoneyRequests.filter((r) => r.status === 'pending');
  const totalUserBalance = users.reduce((sum, u) => sum + u.balance, 0);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const unreadNotificationsCount = unreadNotifications.length;

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'unread') return !n.read;
    if (notifFilter === 'all') return true;
    return n.type === notifFilter;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleApplyUserAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const num = parseFloat(adjustAmount) || 0;
    if (num <= 0) return;
    const delta = adjustType === 'deduct' ? -num : num;
    onAdjustUserBalance(adjustingUser.id, delta, adjustReason);
    setAdjustingUser(null);
  };

  // Handle PDF file selection from admin computer
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setUploadedPdfDataUrl(reader.result as string);
        setUploadedPdfFileName(file.name);
        setUploadedPdfFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate Sample PDF instantly
  const handleGenerateSamplePdf = () => {
    if (!deliveringNidOrder) return;
    const sample = generateSampleNidPdf({
      serviceTitle: deliveringNidOrder.serviceTitle,
      name: deliveringNidOrder.name,
      nidNumber: deliveringNidOrder.nidNumber,
      dateOfBirth: deliveringNidOrder.dateOfBirth,
      upazila: deliveringNidOrder.upazila,
      district: deliveringNidOrder.district,
      trxId: deliveringNidOrder.trxId,
      deliveryDate: new Date().toLocaleString('bn-BD'),
    });
    setUploadedPdfDataUrl(sample.dataUrl);
    setUploadedPdfFileName(sample.fileName);
    setUploadedPdfFileSize(sample.fileSize);
  };

  // Confirm NID delivery with PDF
  const handleConfirmNidDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringNidOrder) return;

    onCompleteNidOrder(
      deliveringNidOrder.id,
      deliveryNoteInput,
      '#',
      uploadedPdfDataUrl || undefined,
      uploadedPdfFileName || `${deliveringNidOrder.serviceTitle}_${deliveringNidOrder.nidNumber}.pdf`,
      uploadedPdfFileSize || 'PDF'
    );
    setDeliveringNidOrder(null);
    setUploadedPdfDataUrl(null);
    setUploadedPdfFileName(null);
    setUploadedPdfFileSize(null);
  };

  // Service builder handlers
  const handleOpenCreateService = () => {
    setServiceModalMode('create');
    setEditingServiceId(null);
    setServiceForm({
      title: '',
      description: '',
      fee: 100,
      category: 'nid',
      icon: 'FileText',
      active: true,
      fields: [
        { id: 'nidNumber', label: 'NID নাম্বার', placeholder: '১০ বা ১৭ ডিজিট', required: true, type: 'number' },
        { id: 'dateOfBirth', label: 'জন্ম তারিখ', placeholder: 'YYYY-MM-DD', required: true, type: 'date' },
      ],
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (service: DigitalServiceItem) => {
    setServiceModalMode('edit');
    setEditingServiceId(service.id);
    setServiceForm({
      title: service.title,
      description: service.description,
      fee: service.fee,
      category: service.category,
      icon: service.icon,
      active: service.active,
      fields: [...service.fields],
    });
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title.trim()) return;

    if (serviceModalMode === 'create') {
      onAddDigitalService(serviceForm);
    } else if (editingServiceId) {
      onUpdateDigitalService(editingServiceId, serviceForm);
    }
    setShowServiceModal(false);
  };

  // Field helpers for Service Builder
  const handleAddField = () => {
    const newFieldId = `field_${Date.now()}`;
    setServiceForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: newFieldId,
          label: 'নতুন তথ্যের নাম',
          placeholder: 'এখানে লিখুন...',
          required: true,
          type: 'text',
        },
      ],
    }));
  };

  const handleRemoveField = (index: number) => {
    setServiceForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleFieldPropChange = (
    index: number,
    key: keyof CustomServiceField,
    val: any
  ) => {
    setServiceForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, [key]: val } : f)),
    }));
  };

  // Filtered NID orders
  const filteredNidOrders = nidOrders.filter((order) => {
    if (nidStatusFilter !== 'all' && order.status !== nidStatusFilter) return false;
    if (nidSearchQuery.trim()) {
      const q = nidSearchQuery.toLowerCase();
      return (
        order.nidNumber.includes(q) ||
        order.trxId.toLowerCase().includes(q) ||
        order.userName.toLowerCase().includes(q) ||
        (order.name && order.name.toLowerCase().includes(q)) ||
        (order.upazila && order.upazila.toLowerCase().includes(q)) ||
        (order.district && order.district.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">এডমিন কন্ট্রোল প্যানেল</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                নতুন সেবা যুক্ত/বন্ধকরণ, পিডিএফ আপলোড ও ডেলিভারি এবং ওয়ালেট নিয়ন্ত্রণ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateService}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-xs"
              title="নতুন ডিজিটাল সেবা যোগ করুন"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন সেবা তৈরি</span>
            </button>
            <button
              onClick={onResetDemoData}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">রিসেট</span>
            </button>
            <button
              onClick={onBackToUserView}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>গ্রাহক মোড</span>
            </button>
          </div>
        </div>

        {/* 4 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium">পেন্ডিং এনআইডি ও পিডিএফ</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono-nums text-amber-400">
                {pendingNidOrders.length} টি
              </span>
              <span className="text-xs font-mono-nums text-slate-300">
                {formatTaka(pendingNidOrdersTotal)}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium">ডিজিটাল সেবা তালিকা</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono-nums text-emerald-400">
                {digitalServices.length} টি
              </span>
              <span className="text-xs text-slate-400">
                {digitalServices.filter((s) => s.active).length} টি চালু
              </span>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium">পেন্ডিং ড্রাইভ অর্ডার</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono-nums text-sky-400">
                {pendingDriveOrders.length} টি
              </span>
              <span className="text-xs text-slate-400">{offers.length} টি অফার</span>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <span className="text-[11px] text-slate-400 font-medium">গ্রাহক মোট ওয়ালেট</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono-nums text-indigo-300">
                {formatTaka(totalUserBalance)}
              </span>
              <span className="text-xs text-slate-400">{users.length} গ্রাহক</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-1.5 flex gap-1 overflow-x-auto scrollbar-none">
        
        {/* 1. NID & PDF Delivery Orders */}
        <button
          onClick={() => setAdminTab('nid-orders')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'nid-orders'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>NID অর্ডার ও PDF আপলোড</span>
          {pendingNidOrders.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px]">
              {pendingNidOrders.length}
            </span>
          )}
        </button>

        {/* 2. Services Builder (NEW) */}
        <button
          onClick={() => setAdminTab('services-builder')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'services-builder'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-300" />
          <span>ডিজিটাল সেবা নিয়ন্ত্রণ ({digitalServices.length})</span>
        </button>

        {/* 3. Drive Orders */}
        <button
          onClick={() => setAdminTab('drive-orders')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'drive-orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>ড্রাইভ অর্ডার ({pendingDriveOrders.length})</span>
        </button>

        {/* 4. Drive Offers */}
        <button
          onClick={() => setAdminTab('offers')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'offers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>অফার প্রকাশ ({offers.length})</span>
        </button>

        {/* 5. Add Money */}
        <button
          onClick={() => setAdminTab('add-money')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'add-money'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>অ্যাড মানি</span>
        </button>

        {/* 6. Users */}
        <button
          onClick={() => setAdminTab('users')}
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>গ্রাহক</span>
        </button>

        {/* 7. Settings */}
        <button
          onClick={() => setAdminTab('settings')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>সেটিংস</span>
        </button>

        {/* 8. Notifications */}
        <button
          onClick={() => setAdminTab('notifications')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            adminTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-300" />
          <span>নোটিফিকেশন</span>
          {unreadNotificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse font-mono-nums">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: NID & DIGITAL SERVICE ORDERS (PDF UPLOAD & COMPLETION) */}
      {adminTab === 'nid-orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  এনআইডি ও ডিজিটাল সেবা অর্ডার (PDF আপলোড ও ডেলিভারি)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200">
                  {pendingNidOrders.length} টি পেন্ডিং
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                গ্রাহকদের আবেদনের তথ্য দেখে সার্ভার থেকে প্রস্তুতকৃত <b>PDF ফাইল আপলোড করে</b> সফল করুন।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={nidSearchQuery}
                  onChange={(e) => setNidSearchQuery(e.target.value)}
                  placeholder="NID, নাম বা TrxID খুঁজুন..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-600 w-48"
                />
              </div>

              <select
                value={nidStatusFilter}
                onChange={(e) => setNidStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
              >
                <option value="all">সকল অর্ডার</option>
                <option value="pending">পেন্ডিং ({pendingNidOrders.length})</option>
                <option value="completed">ডেলিভারি সম্পন্ন</option>
                <option value="rejected">বাতিল ও রিফান্ডেড</option>
              </select>
            </div>
          </div>

          {filteredNidOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">কোন অর্ডার পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">সেবার ধরণ</th>
                    <th className="p-3">গ্রাহকের প্রদত্ত তথ্য (Data)</th>
                    <th className="p-3">গ্রাহক</th>
                    <th className="p-3">ফি</th>
                    <th className="p-3">TrxID ও সময়</th>
                    <th className="p-3">পিডিএফ ডেলিভারি স্ট্যাটাস</th>
                    <th className="p-3 text-right">এডমিন ম্যানুয়াল অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNidOrders.map((order) => {
                    const isPending = order.status === 'pending';
                    const isCompleted = order.status === 'completed';
                    const isRejected = order.status === 'rejected';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        <td className="p-3">
                          <span className="font-bold px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                            {order.serviceTitle}
                          </span>
                        </td>

                        <td className="p-3 max-w-[280px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono-nums font-bold text-slate-900 text-sm">
                              <span>NID: {order.nidNumber}</span>
                              <button
                                onClick={() => copyToClipboard(order.nidNumber)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800"
                                title="কপি করুন"
                              >
                                {copiedText === order.nidNumber ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {order.name && (
                              <div className="flex items-center gap-1 text-slate-700 font-semibold">
                                <span>নাম: {order.name}</span>
                                <button
                                  onClick={() => copyToClipboard(order.name!)}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400"
                                  title="নাম কপি করুন"
                                >
                                  {copiedText === order.name ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}

                            <div className="text-slate-600 font-mono-nums">
                              জন্ম তারিখ: <b>{order.dateOfBirth}</b>
                            </div>

                            {order.district && (
                              <div className="text-slate-500 text-[11px]">
                                এলাকা: <b>{order.upazila}</b>, <b>{order.district}</b>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{order.userName}</div>
                          <div className="font-mono-nums text-[11px] text-slate-400">{order.userPhone}</div>
                        </td>

                        <td className="p-3 font-mono-nums font-bold text-slate-900 text-sm">
                          {formatTaka(order.fee)}
                        </td>

                        <td className="p-3">
                          <div className="font-mono-nums font-bold text-indigo-700">{order.trxId}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{formatDateTime(order.timestamp)}</div>
                        </td>

                        <td className="p-3">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              পেন্ডিং (PDF প্রয়োজন)
                            </span>
                          )}
                          {isCompleted && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                PDF ডেলিভারি সম্পন্ন
                              </span>
                              {order.pdfFileName && (
                                <div className="text-[10px] text-slate-500 font-mono-nums mt-0.5">
                                  {order.pdfFileName}
                                </div>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              বাতিল ও রিফান্ডেড
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open PDF Delivery Modal */}
                              <button
                                onClick={() => {
                                  setDeliveringNidOrder(order);
                                  setDeliveryNoteInput(
                                    `আপনার ${order.serviceTitle} প্রস্তুত। ডাউনলোড করে নিন।`
                                  );
                                  setUploadedPdfDataUrl(null);
                                  setUploadedPdfFileName(null);
                                  setUploadedPdfFileSize(null);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-2xs"
                                title="PDF আপলোড করে সফল করুন"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>PDF আপলোড ও সফল</span>
                              </button>

                              <button
                                onClick={() => onRejectNidOrder(order.id, true)}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs border border-rose-200 transition-colors"
                                title="বাতিল করুন ও ওয়ালেটে টাকা ফেরত দিন"
                              >
                                রিফান্ড
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {order.pdfDataUrl && (
                                <button
                                  onClick={() =>
                                    triggerFileDownload(
                                      order.pdfDataUrl!,
                                      order.pdfFileName || `${order.serviceTitle}.pdf`
                                    )
                                  }
                                  className="p-1 hover:bg-emerald-50 text-emerald-700 rounded"
                                  title="আপলোডকৃত PDF ফাইল দেখুন/ডাউনলোড করুন"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <span className="text-slate-400 text-[11px]">
                                {isCompleted ? '✓ সম্পন্ন' : 'রিফান্ডেড'}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIGITAL SERVICES BUILDER (CREATE, TOGGLE ON/OFF, EDIT, DELETE) */}
      {adminTab === 'services-builder' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  ডিজিটাল সেবা নিয়ন্ত্রণ ও নতুন সেবা বিল্ডার
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  মোট {digitalServices.length} টি সেবা
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                এখানে ইচ্ছামতো নতুন যে কোনো ডিজিটাল সেবা যুক্ত করতে পারবেন এবং যে কোনো সময় অন/অফ করতে পারবেন।
              </p>
            </div>

            <button
              onClick={handleOpenCreateService}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন ডিজিটাল সেবা যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {digitalServices.map((service) => (
              <div
                key={service.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  service.active
                    ? 'border-slate-200 bg-white shadow-2xs hover:border-indigo-400'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-nums font-extrabold text-sm text-indigo-700">
                      চার্জ: {formatTaka(service.fee)}
                    </span>

                    {/* Active / Inactive switch (অন বা অফ করার অপশন) */}
                    <button
                      onClick={() =>
                        onUpdateDigitalService(service.id, { active: !service.active })
                      }
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${
                        service.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                      title="কাস্টমারদের জন্য চালু বা বন্ধ করুন"
                    >
                      {service.active ? 'চালু (Active)' : 'বন্ধ (Off)'}
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1">{service.title}</h4>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 mb-3 text-[11px] space-y-1">
                    <span className="font-semibold text-slate-700 block">
                      প্রয়োজনীয় ফিল্ডসমূহ ({service.fields.length} টি):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {service.fields.map((f) => (
                        <span
                          key={f.id}
                          className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px]"
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    {service.active ? 'কাস্টমারদের দৃশ্যমান' : 'কাস্টমারদের জন্য লুকানো'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditService(service)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="সেবা এডিট করুন"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!service.isSystemDefault && (
                      <button
                        onClick={() => onDeleteDigitalService(service.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="সেবা মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DRIVE ORDERS */}
      {adminTab === 'drive-orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">ড্রাইভ অফার অর্ডার প্রসেসিং</h3>
              <p className="text-xs text-slate-500">সিমে ড্রাইভ পুশ করে সফল করুন</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700">
              {pendingDriveOrders.length} টি পেন্ডিং
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3">অপারেটর</th>
                  <th className="p-3">প্যাকেজ</th>
                  <th className="p-3">প্রাপক নাম্বার</th>
                  <th className="p-3">গ্রাহক</th>
                  <th className="p-3">মূল্য</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driveOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold">{order.operator}</td>
                    <td className="p-3 font-semibold">{order.offerTitle}</td>
                    <td className="p-3 font-mono-nums font-bold">{order.targetPhone}</td>
                    <td className="p-3">{order.userName}</td>
                    <td className="p-3 font-bold">{formatTaka(order.amount)}</td>
                    <td className="p-3">
                      {order.status === 'pending' && <span className="text-amber-600 font-bold">পেন্ডিং</span>}
                      {order.status === 'completed' && <span className="text-emerald-600 font-bold">সফল</span>}
                      {order.status === 'rejected' && <span className="text-rose-600 font-bold">বাতিল</span>}
                    </td>
                    <td className="p-3 text-right">
                      {order.status === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onCompleteRecharge(order.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                          >
                            সফল
                          </button>
                          <button
                            onClick={() => onRejectRecharge(order.id, true)}
                            className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs"
                          >
                            রিফান্ড
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OFFERS */}
      {adminTab === 'offers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">ডিসকাউন্ট ড্রাইভ অফার তালিকা</h3>
            <button
              onClick={() => {
                setOfferModalMode('create');
                setShowOfferModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              + নতুন অফার
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {offers.map((o) => (
              <div key={o.id} className="p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span>{o.operator}</span>
                  <span className="text-emerald-600">৳{o.offerPrice}</span>
                </div>
                <p className="font-semibold">{o.title}</p>
                <div className="mt-2 flex justify-between">
                  <span className="text-slate-400">{o.validity}</span>
                  <button onClick={() => onDeleteOffer(o.id)} className="text-rose-600">মুছুন</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ADD MONEY */}
      {adminTab === 'add-money' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
          <h3 className="font-bold text-base text-slate-900 mb-4">পেন্ডিং অ্যাড মানি রিকোয়েস্ট</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3">মেথড</th>
                  <th className="p-3">গ্রাহক</th>
                  <th className="p-3">প্রেরক নাম্বার</th>
                  <th className="p-3">পরিমাণ</th>
                  <th className="p-3">TrxID</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {addMoneyRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="p-3 font-bold">{req.method}</td>
                    <td className="p-3">{req.userName}</td>
                    <td className="p-3 font-mono-nums font-bold">{req.senderNumber}</td>
                    <td className="p-3 font-bold">{formatTaka(req.amount)}</td>
                    <td className="p-3 font-mono-nums font-bold text-indigo-700">{req.trxId}</td>
                    <td className="p-3 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onApproveAddMoney(req.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold"
                          >
                            অনুমোদন
                          </button>
                          <button
                            onClick={() => onRejectAddMoney(req.id)}
                            className="px-2 py-1 bg-slate-100 text-rose-600 rounded"
                          >
                            বাতিল
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: RECHARGES */}
      {adminTab === 'recharges' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
          <h3 className="font-bold text-base text-slate-900 mb-4">ফ্লেক্সিলোড রিকোয়েস্ট</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-3">অপারেটর</th>
                  <th className="p-3">নাম্বার</th>
                  <th className="p-3">পরিমাণ</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {rechargeRequests.filter((r) => r.type === 'recharge').map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 font-bold">{r.operator}</td>
                    <td className="p-3 font-mono-nums font-bold">{r.targetPhone}</td>
                    <td className="p-3 font-bold">{formatTaka(r.amount)}</td>
                    <td className="p-3 text-right">
                      {r.status === 'pending' ? (
                        <button
                          onClick={() => onCompleteRecharge(r.id)}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded font-bold"
                        >
                          সফল
                        </button>
                      ) : (
                        <span className="text-slate-400">সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: USERS */}
      {adminTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
          <h3 className="font-bold text-base text-slate-900 mb-4">গ্রাহক তালিকা ও ওয়ালেট</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="p-3">নাম</th>
                <th className="p-3">মোবাইল</th>
                <th className="p-3">ব্যালেন্স</th>
                <th className="p-3 text-right">সমন্বয়</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3 font-semibold">{u.name}</td>
                  <td className="p-3 font-mono-nums">{u.phone}</td>
                  <td className="p-3 font-bold font-mono-nums text-indigo-700">{formatTaka(u.balance)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setAdjustingUser(u)}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded"
                    >
                      ব্যালেন্স নিয়ন্ত্রণ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 8: SETTINGS */}
      {adminTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-base text-slate-900">সিস্টেম ও নোটিফিকেশন সেটিংস</h3>
            <p className="text-slate-500 text-xs">অর্ডার নোটিফিকেশন অ্যালার্ট, সাউন্ড ও নোটিশ নিয়ন্ত্রণ করুন</p>
          </div>

          {/* Notification Controls in Settings */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900 text-xs">অর্ডার নোটিফিকেশন অপশন</span>
              </div>
              <button
                type="button"
                onClick={() => playNotificationSound()}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>সাউন্ড টেস্ট</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Sound on/off */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">সাউন্ড অ্যালার্ট</span>
                  <span className="text-[11px] text-slate-500">অর্ডার আসলে সাউন্ড বাজবে</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNotificationSettings({
                      soundEnabled: !settings.notifications.soundEnabled,
                    })
                  }
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                    settings.notifications.soundEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.notifications.soundEnabled ? 'চালু' : 'বন্ধ'}
                </button>
              </div>

              {/* Browser push */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">ব্রাউজার নোটিফিকেশন</span>
                  <span className="text-[11px] text-slate-500">স্ক্রিন অফ/মিনিমাইজ থাকলেও পপআপ</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!settings.notifications.browserNotificationsEnabled) {
                      const granted = await requestBrowserNotificationPermission();
                      onUpdateNotificationSettings({
                        browserNotificationsEnabled: granted,
                      });
                    } else {
                      onUpdateNotificationSettings({
                        browserNotificationsEnabled: false,
                      });
                    }
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                    settings.notifications.browserNotificationsEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.notifications.browserNotificationsEnabled ? 'চালু' : 'অনুমতি দিন'}
                </button>
              </div>

              {/* Recharge orders */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-800 font-medium">মোবাইল রিচার্জে অ্যালার্ট</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNotificationSettings({
                      notifyOnRecharge: !settings.notifications.notifyOnRecharge,
                    })
                  }
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    settings.notifications.notifyOnRecharge
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.notifications.notifyOnRecharge ? 'অন' : 'অফ'}
                </button>
              </div>

              {/* Drive packages */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-800 font-medium">ড্রাইভ অফার অর্ডারে অ্যালার্ট</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNotificationSettings({
                      notifyOnDriveOffer: !settings.notifications.notifyOnDriveOffer,
                    })
                  }
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    settings.notifications.notifyOnDriveOffer
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.notifications.notifyOnDriveOffer ? 'অন' : 'অফ'}
                </button>
              </div>

              {/* NID orders */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-800 font-medium">NID ও ডিজিটাল সেবায় অ্যালার্ট</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNotificationSettings({
                      notifyOnNidOrder: !settings.notifications.notifyOnNidOrder,
                    })
                  }
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    settings.notifications.notifyOnNidOrder
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.notifications.notifyOnNidOrder ? 'অন' : 'অফ'}
                </button>
              </div>

              {/* Add money */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-800 font-medium">অ্যাড মানি রিকোয়েস্টে অ্যালার্ট</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNotificationSettings({
                      notifyOnAddMoney: !settings.notifications.notifyOnAddMoney,
                    })
                  }
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    settings.notifications.notifyOnAddMoney
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {settings.notifications.notifyOnAddMoney ? 'অন' : 'অফ'}
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Admin Helpline Setting */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1">
              এডমিন হোয়াটসঅ্যাপ হেল্পলাইন নাম্বার
            </label>
            <p className="text-slate-500 text-[11px] mb-2">
              কাস্টমাররা এই নাম্বারে সরাসরি হোয়াটসঅ্যাপে যোগাযোগ ও সাহায্য চাইতে পারবেন
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="+8801844868379"
                className="w-full max-w-sm p-2.5 border rounded-xl font-mono-nums font-bold text-slate-900 bg-white"
              />
              <a
                href={`https://wa.me/${whatsappInput.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl whitespace-nowrap"
              >
                টেস্ট চ্যাট
              </a>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">ঘোষণা বার্তা (Marquee Notice)</label>
            <textarea
              rows={2}
              value={noticeInput}
              onChange={(e) => setNoticeInput(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white"
            />
          </div>

          <button
            onClick={() => {
              onUpdateSettings({
                noticeText: noticeInput,
                noticeEnabled: noticeActive,
                whatsappNumber: whatsappInput,
              });
            }}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            সেটিংস সংরক্ষণ করুন
          </button>
        </div>
      )}

      {/* TAB 9: NOTIFICATIONS & ALERTS CENTER */}
      {adminTab === 'notifications' && (
        <div className="space-y-5">
          {/* Top Hero Card for Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base md:text-lg text-slate-900">
                      অর্ডার নোটিফিকেশন ও অ্যালার্ট কন্ট্রোল
                    </h3>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-xs bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full font-mono-nums">
                        {unreadNotificationsCount} অপঠিত
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    কাস্টমার অর্ডার করার সাথে সাথে এখানে রিয়েল-টাইম নোটিফিকেশন ও সাউন্ড অ্যালার্ট পাবেন
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => playNotificationSound()}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-indigo-200"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>সাউন্ড টেস্ট করুন</span>
                </button>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={onMarkAllNotificationsAsRead}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>সব পড়া হয়েছে</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAllNotifications}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সব মুছুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification Options Toggles Panel */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 mb-6">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <span className="font-bold text-xs text-slate-800">
                  অ্যালার্ট ও নোটিফিকেশন কনফিগারেশন:
                </span>
                <span className="text-[11px] text-slate-500">
                  প্রয়োজনমতো অ্যালার্ট চালু বা বন্ধ রাখুন
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* 1. Sound Alert */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">সাউন্ড অ্যালার্ট</span>
                    <span className="text-[11px] text-slate-500">নতুন অর্ডারে রিংটোন বাজবে</span>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateNotificationSettings({
                        soundEnabled: !settings.notifications.soundEnabled,
                      })
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      settings.notifications.soundEnabled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.notifications.soundEnabled ? 'চালু আছে' : 'বন্ধ'}
                  </button>
                </div>

                {/* 2. Browser Push Notification */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">ব্রাউজার নোটিফিকেশন</span>
                    <span className="text-[11px] text-slate-500">মিনিমাইজ থাকলেও নোটিফিকেশন</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!settings.notifications.browserNotificationsEnabled) {
                        const granted = await requestBrowserNotificationPermission();
                        onUpdateNotificationSettings({
                          browserNotificationsEnabled: granted,
                        });
                      } else {
                        onUpdateNotificationSettings({
                          browserNotificationsEnabled: false,
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      settings.notifications.browserNotificationsEnabled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.notifications.browserNotificationsEnabled ? 'অনুমোদিত' : 'অনুমতি দিন'}
                  </button>
                </div>

                {/* 3. Recharge notification */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">মোবাইল রিচার্জ</span>
                    <span className="text-[11px] text-slate-500">ফ্লেক্সিলোড অর্ডারে অ্যালার্ট</span>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateNotificationSettings({
                        notifyOnRecharge: !settings.notifications.notifyOnRecharge,
                      })
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      settings.notifications.notifyOnRecharge
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.notifications.notifyOnRecharge ? 'চালু' : 'বন্ধ'}
                  </button>
                </div>

                {/* 4. Drive offer notification */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">ড্রাইভ অফার</span>
                    <span className="text-[11px] text-slate-500">ডিসকাউন্ট প্যাকেজ অর্ডারে</span>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateNotificationSettings({
                        notifyOnDriveOffer: !settings.notifications.notifyOnDriveOffer,
                      })
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      settings.notifications.notifyOnDriveOffer
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.notifications.notifyOnDriveOffer ? 'চালু' : 'বন্ধ'}
                  </button>
                </div>

                {/* 5. NID order notification */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">NID ও ডিজিটাল সেবা</span>
                    <span className="text-[11px] text-slate-500">PDF বা সার্ভার কপি অর্ডারে</span>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateNotificationSettings({
                        notifyOnNidOrder: !settings.notifications.notifyOnNidOrder,
                      })
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      settings.notifications.notifyOnNidOrder
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.notifications.notifyOnNidOrder ? 'চালু' : 'বন্ধ'}
                  </button>
                </div>

                {/* 6. Add money notification */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">অ্যাড মানি রিকোয়েস্ট</span>
                    <span className="text-[11px] text-slate-500">বিকাশ/নগদ ব্যালেন্স রিকোয়েস্টে</span>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateNotificationSettings({
                        notifyOnAddMoney: !settings.notifications.notifyOnAddMoney,
                      })
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      settings.notifications.notifyOnAddMoney
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settings.notifications.notifyOnAddMoney ? 'চালু' : 'বন্ধ'}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-slate-100">
              <button
                onClick={() => setNotifFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  notifFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                সব ({notifications.length})
              </button>
              <button
                onClick={() => setNotifFilter('unread')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  notifFilter === 'unread'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                অপঠিত ({unreadNotificationsCount})
              </button>
              <button
                onClick={() => setNotifFilter('nid_order')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  notifFilter === 'nid_order'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                NID ও ডিজিটাল সেবা
              </button>
              <button
                onClick={() => setNotifFilter('drive_offer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  notifFilter === 'drive_offer'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ড্রাইভ অফার
              </button>
              <button
                onClick={() => setNotifFilter('recharge')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  notifFilter === 'recharge'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                মোবাইল রিচার্জ
              </button>
              <button
                onClick={() => setNotifFilter('add_money')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  notifFilter === 'add_money'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                অ্যাড মানি
              </button>
            </div>

            {/* Notifications Feed */}
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600 text-sm">এই ক্যাটাগরিতে কোনো নোটিফিকেশন নেই</p>
                <p className="text-xs text-slate-400">কাস্টমার নতুন কোনো অর্ডার দিলে এখানে নোটিফিকেশন জমা হবে।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => {
                  const handleGoToOrder = () => {
                    onMarkNotificationAsRead(notif.id);
                    if (notif.type === 'nid_order') {
                      setAdminTab('nid-orders');
                    } else if (notif.type === 'drive_offer') {
                      setAdminTab('drive-orders');
                    } else if (notif.type === 'recharge') {
                      setAdminTab('recharges');
                    } else if (notif.type === 'add_money') {
                      setAdminTab('add-money');
                    }
                  };

                  return (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationAsRead(notif.id)}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        !notif.read
                          ? 'border-indigo-200 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.type === 'nid_order'
                              ? 'bg-amber-100 text-amber-700'
                              : notif.type === 'drive_offer'
                              ? 'bg-indigo-100 text-indigo-700'
                              : notif.type === 'recharge'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {notif.type === 'nid_order' && <FileText className="w-4 h-4" />}
                          {notif.type === 'drive_offer' && <Tag className="w-4 h-4" />}
                          {notif.type === 'recharge' && <Smartphone className="w-4 h-4" />}
                          {notif.type === 'add_money' && <Wallet className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                                নতুন
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                            <span>গ্রাহক: <b className="text-slate-800">{notif.customerName}</b></span>
                            <span>·</span>
                            <span className="font-mono-nums">{notif.customerPhone}</span>
                            <span>·</span>
                            <span>{formatDateTime(notif.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        {notif.amount && (
                          <span className="font-mono-nums font-bold text-indigo-700 text-sm mr-2">
                            {formatTaka(notif.amount)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToOrder();
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <span>অর্ডারে যান</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(notif.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL PDF UPLOAD & DELIVERY MODAL */}
      {deliveringNidOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-base text-slate-900">
                  PDF আপলোড ও অর্ডার সফল করুন
                </h4>
              </div>
              <button onClick={() => setDeliveringNidOrder(null)} className="text-slate-400">✕</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4 text-xs space-y-1">
              <div>সেবা: <b>{deliveringNidOrder.serviceTitle}</b></div>
              <div>NID: <b className="font-mono-nums">{deliveringNidOrder.nidNumber}</b></div>
              <div>গ্রাহক: <b>{deliveringNidOrder.userName}</b> ({deliveringNidOrder.userPhone})</div>
            </div>

            <form onSubmit={handleConfirmNidDelivery} className="space-y-4 text-xs">
              
              {/* PDF File Upload Zone */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  ১. PDF ফাইল আপলোড করুন (বাধ্যতামূলক নয়, অপশনাল)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  onChange={handlePdfFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    uploadedPdfFileName
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50'
                  }`}
                >
                  <FileUp className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                  {uploadedPdfFileName ? (
                    <div>
                      <p className="font-bold text-emerald-700 text-xs">
                        ✓ ফাইল সিলেক্ট হয়েছে: {uploadedPdfFileName}
                      </p>
                      <p className="text-[10px] text-slate-500">সাইজ: {uploadedPdfFileSize}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-700">
                        কম্পিউটার/মোবাইল থেকে PDF সিলেক্ট করতে ক্লিক করুন
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        শুধুমাত্র .pdf ফরম্যাট
                      </p>
                    </div>
                  )}
                </div>

                {/* Or Instant Sample PDF generator */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">হাতে ফাইল না থাকলে?</span>
                  <button
                    type="button"
                    onClick={handleGenerateSamplePdf}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>নমুনা NID PDF অটো-তৈরি করুন</span>
                  </button>
                </div>
              </div>

              {/* Delivery Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ২. গ্রাহকের জন্য ডেলিভারি বার্তা
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryNoteInput}
                  onChange={(e) => setDeliveryNoteInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringNidOrder(null)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>অর্ডার সফল করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOM DIGITAL SERVICE BUILDER MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  {serviceModalMode === 'create'
                    ? 'নতুন ডিজিটাল সেবা তৈরি করুন'
                    : 'ডিজিটাল সেবা এডিট ও ফিল্ড কনফিগার করুন'}
                </h4>
                <p className="text-xs text-slate-500">
                  সেবাটি কাস্টমারদের জন্য চালু বা বন্ধ রাখতে পারবেন
                </p>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              
              {/* Title & Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সেবার নাম (Title) *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    placeholder="উদাঃ টিন সার্টিফিকেট"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ফি / চার্জ (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={serviceForm.fee}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, fee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none font-mono-nums font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">সংক্ষিপ্ত বিবরণ (গ্রাহক দেখবে)</label>
                <input
                  type="text"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="উদাঃ অনলাইন ভেরিফাইড কপি, ৫-১০ মিনিটে ডেলিভারি"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="nid">এনআইডি সেবা</option>
                    <option value="certificate">সার্টিফিকেট সেবা</option>
                    <option value="gov">সরকারি ডিজিটাল সেবা</option>
                    <option value="other">অন্যান্য সেবা</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">স্ট্যাটাস (কাস্টমারদের জন্য)</label>
                  <select
                    value={serviceForm.active ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, active: e.target.value === 'active' })
                    }
                    className={`w-full p-2.5 rounded-xl border outline-none font-bold ${
                      serviceForm.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
                    }`}
                  >
                    <option value="active">চালু রাখুন (Active)</option>
                    <option value="inactive">বন্ধ রাখুন (Off)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Required Fields Builder */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      অর্ডারের জন্য কি কি তথ্য লাগবে? (Required Fields)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      কাস্টমার অর্ডার করার সময় এই ফর্ম পূরণ করতে হবে
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ফিল্ড যোগ করুন</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {serviceForm.fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <span className="font-bold text-slate-400 text-xs w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        value={field.label}
                        onChange={(e) => handleFieldPropChange(idx, 'label', e.target.value)}
                        placeholder="ফিল্ডের নাম (উদাঃ NID নাম্বার)"
                        className="flex-1 p-1.5 rounded border border-slate-200 text-xs font-medium"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldPropChange(idx, 'type', e.target.value)}
                        className="p-1.5 rounded border border-slate-200 text-xs"
                      >
                        <option value="text">টেক্সট</option>
                        <option value="number">নাম্বার</option>
                        <option value="date">তারিখ (Date)</option>
                        <option value="tel">মোবাইল (Tel)</option>
                      </select>
                      {serviceForm.fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveField(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="ফিল্ড মুছুন"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {serviceModalMode === 'create' ? 'সেবা প্রকাশ করুন' : 'পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BALANCE ADJUST MODAL */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <h4 className="font-bold text-base text-slate-900 mb-1">ব্যালেন্স সমন্বয়</h4>
            <p className="text-xs text-slate-500 mb-4">{adjustingUser.name} ({adjustingUser.phone})</p>
            <form onSubmit={handleApplyUserAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ধরণ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-1.5 px-3 rounded-xl border text-center font-bold ${
                      adjustType === 'add'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    + ব্যালেন্স যোগ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-1.5 px-3 rounded-xl border text-center font-bold ${
                      adjustType === 'deduct'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    - ব্যালেন্স কর্তন
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold font-mono-nums"
                  placeholder="১০০"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">কারণ / নোট</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 border rounded-xl text-slate-800"
                  placeholder="উদাঃ অফার বোনাস বা ক্যাশ পেমেন্ট"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white rounded-xl font-bold transition-colors ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {adjustType === 'add' ? 'যোগ করুন' : 'কর্তন করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
