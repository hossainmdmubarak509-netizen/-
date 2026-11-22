import React, { useState, useEffect } from 'react';
import {
  INITIAL_USERS,
  INITIAL_OFFERS,
  INITIAL_ADD_MONEY_REQUESTS,
  INITIAL_RECHARGE_REQUESTS,
  INITIAL_NID_ORDERS,
  INITIAL_DIGITAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS,
} from './data/initialData';
import {
  User,
  DriveOffer,
  AddMoneyRequest,
  RechargeRequest,
  NidOrderRequest,
  DigitalServiceItem,
  AppSettings,
  Operator,
  SimType,
  PaymentMethod,
  AdminNotification,
  NotificationSettings,
  UploadedFileAttachment,
} from './types/telecom';
import { generateTrxId, formatTaka } from './utils/telecomUtils';
import { playNotificationSound, sendBrowserNotification } from './utils/soundHelper';
import { saveFileBlob, getAllFileBlobs } from './utils/fileStorage';
import { Navbar } from './components/Navbar';
import { NoticeBanner } from './components/NoticeBanner';
import { AuthSection } from './components/AuthSection';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ReceiptModal } from './components/ReceiptModal';
import { NotificationModal } from './components/NotificationModal';
import { SideMenuDrawer } from './components/SideMenuDrawer';
import { CustomerNoticeModal } from './components/CustomerNoticeModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'bd_telecom_portal_';

export default function App() {
  // Load state from localStorage with guaranteed Admin (01844868379) and Demo Customer (01624488010)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      let merged = [...parsed];
      // Guarantee Admin user
      const adminIdx = merged.findIndex((u) => u.phone === '01844868379');
      if (adminIdx >= 0) {
        merged[adminIdx] = { ...merged[adminIdx], role: 'admin', password: 'mnb229Am' };
      } else {
        merged.unshift(INITIAL_USERS[0]);
      }
      // Guarantee Demo Customer user
      const demoIdx = merged.findIndex((u) => u.phone === '01624488010');
      if (demoIdx >= 0) {
        merged[demoIdx] = { ...merged[demoIdx], password: 'mnb229Am' };
      } else {
        merged.splice(1, 0, INITIAL_USERS[1]);
      }
      return merged;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Direct login page requirement: if not logged in, must be null
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedId = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user_id`);
    if (savedId) {
      const found = users.find((u) => u.id === savedId);
      if (found) return found;
    }
    // Directly go to login page by default
    return null;
  });

  const [offers, setOffers] = useState<DriveOffer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}offers`);
    return saved ? JSON.parse(saved) : INITIAL_OFFERS;
  });

  const [addMoneyRequests, setAddMoneyRequests] = useState<AddMoneyRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}add_money`);
    return saved ? JSON.parse(saved) : INITIAL_ADD_MONEY_REQUESTS;
  });

  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}recharges`);
    return saved ? JSON.parse(saved) : INITIAL_RECHARGE_REQUESTS;
  });

  const [nidOrders, setNidOrders] = useState<NidOrderRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}nid_orders`);
    return saved ? JSON.parse(saved) : INITIAL_NID_ORDERS;
  });

  const [digitalServices, setDigitalServices] = useState<DigitalServiceItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}digital_services`);
    return saved ? JSON.parse(saved) : INITIAL_DIGITAL_SERVICES;
  });

  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
    if (!saved) return INITIAL_SETTINGS;
    try {
      return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // UI state: if restored user is verified admin, open admin panel automatically; otherwise user view
  const [currentView, setCurrentView] = useState<'user' | 'admin'>(() =>
    currentUser?.role === 'admin' && currentUser?.phone === '01844868379' ? 'admin' : 'user'
  );
  const [activeTab, setActiveTab] = useState<'recharge' | 'offers' | 'nid-services' | 'add-money' | 'history'>('recharge');
  const [selectedNidServiceId, setSelectedNidServiceId] = useState<string | undefined>(undefined);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<RechargeRequest | AddMoneyRequest | NidOrderRequest | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [dismissedPopupNoticeKey, setDismissedPopupNoticeKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Hydrate any large uploaded file blobs stored in IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    getAllFileBlobs().then((blobs) => {
      if (!mounted || Object.keys(blobs).length === 0) return;
      setNidOrders((prev) =>
        prev.map((order) => {
          const deliveryBlob = blobs[`delivery_${order.id}`];
          const updatedCustomerFiles = order.customerFiles?.map((cf) => ({
            ...cf,
            dataUrl: cf.dataUrl || blobs[`customer_${cf.id}`] || '',
          }));
          return {
            ...order,
            pdfDataUrl: order.pdfDataUrl || deliveryBlob,
            customerFiles: updatedCustomerFiles,
          };
        })
      );
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(users));
    } catch {
      // Ignore storage quota issues
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user_id`, currentUser.id);
      } else {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user_id`);
      }
    } catch {
      // Ignore storage quota issues
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}offers`, JSON.stringify(offers));
    } catch {
      // Ignore storage quota issues
    }
  }, [offers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}add_money`, JSON.stringify(addMoneyRequests));
    } catch {
      // Ignore storage quota issues
    }
  }, [addMoneyRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}recharges`, JSON.stringify(rechargeRequests));
    } catch {
      // Ignore storage quota issues
    }
  }, [rechargeRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}nid_orders`, JSON.stringify(nidOrders));
    } catch {
      // If file base64 exceeds localStorage ~5MB quota, offload binary payloads to IndexedDB
      nidOrders.forEach((order) => {
        if (order.pdfDataUrl) {
          saveFileBlob(`delivery_${order.id}`, order.pdfDataUrl);
        }
        order.customerFiles?.forEach((cf) => {
          if (cf.dataUrl) {
            saveFileBlob(`customer_${cf.id}`, cf.dataUrl);
          }
        });
      });
      try {
        const lightweightOrders = nidOrders.map((order) => ({
          ...order,
          pdfDataUrl: order.pdfDataUrl && order.pdfDataUrl.length > 50000 ? '' : order.pdfDataUrl,
          customerFiles: order.customerFiles?.map((cf) => ({
            ...cf,
            dataUrl: cf.dataUrl.length > 50000 ? '' : cf.dataUrl,
          })),
        }));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}nid_orders`, JSON.stringify(lightweightOrders));
      } catch {
        // Ignore if storage is completely full
      }
    }
  }, [nidOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}digital_services`, JSON.stringify(digitalServices));
    } catch {
      // Ignore storage quota issues
    }
  }, [digitalServices]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
    } catch {
      // Ignore storage quota issues
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
    } catch {
      // Ignore storage quota issues
    }
  }, [settings]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Auth handlers
  const handleLogin = (user: User, openAdmin: boolean = false) => {
    if (!users.some((u) => u.id === user.id)) {
      setUsers((prev) => [user, ...prev]);
    }
    setCurrentUser(user);
    if (openAdmin || user.role === 'admin' || user.phone === '01844868379') {
      setCurrentView('admin');
      showToast(`এডমিন প্যানেলে স্বাগতম, ${user.name}!`);
    } else {
      setCurrentView('user');
      showToast(`স্বাগতম, ${user.name}!`);
    }
  };

  const handleLogout = () => {
    setIsSideMenuOpen(false);
    setSelectedNidServiceId(undefined);
    setDismissedPopupNoticeKey(null);
    setCurrentUser(null);
    setCurrentView('user');
    showToast('সফলভাবে লগআউট হয়েছে।', 'info');
  };

  // Secure View Toggle: Only verified logged-in admin can switch views
  const handleToggleView = (view: 'user' | 'admin') => {
    if (view === 'admin' && currentUser && currentUser.phone === '01844868379' && currentUser.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('user');
    }
  };

  // Central Admin Notification Dispatcher with Sound & Browser Push
  const triggerAdminNotification = ({
    type,
    title,
    message,
    amount,
    customerName,
    customerPhone,
    targetRefId,
  }: {
    type: 'recharge' | 'drive_offer' | 'nid_order' | 'add_money';
    title: string;
    message: string;
    amount?: number;
    customerName: string;
    customerPhone: string;
    targetRefId?: string;
  }) => {
    const notifConfig = settings.notifications;

    // Filter check based on admin toggles
    if (type === 'recharge' && !notifConfig.notifyOnRecharge) return;
    if (type === 'drive_offer' && !notifConfig.notifyOnDriveOffer) return;
    if (type === 'nid_order' && !notifConfig.notifyOnNidOrder) return;
    if (type === 'add_money' && !notifConfig.notifyOnAddMoney) return;

    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      amount,
      customerName,
      customerPhone,
      targetRefId,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Play synthesized Web Audio chime alert
    if (notifConfig.soundEnabled) {
      playNotificationSound();
    }

    // Trigger browser system notification
    if (notifConfig.browserNotificationsEnabled) {
      sendBrowserNotification(title, message);
    }
  };

  // Recharge Submission
  const handleRechargeSubmit = ({
    operator,
    targetPhone,
    simType,
    amount,
  }: {
    operator: Operator;
    targetPhone: string;
    simType: SimType;
    amount: number;
  }) => {
    if (!currentUser) return;

    if (currentUser.balance < amount) {
      showToast('অপর্যাপ্ত ব্যালেন্স! ওয়ালেটে টাকা যোগ করুন।', 'error');
      return;
    }

    const updatedBalance = currentUser.balance - amount;
    const updatedUser = { ...currentUser, balance: updatedBalance };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    const newReq: RechargeRequest = {
      id: `rc-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      type: 'recharge',
      operator,
      targetPhone,
      simType,
      amount,
      status: 'pending',
      timestamp: new Date().toISOString(),
      trxId: generateTrxId(),
    };

    setRechargeRequests((prev) => [newReq, ...prev]);
    showToast(`${formatTaka(amount)} রিচার্জ রিকোয়েস্ট জমা হয়েছে!`, 'success');
    setSelectedReceipt(newReq);

    // Notify Admin with Sound & Push
    triggerAdminNotification({
      type: 'recharge',
      title: 'নতুন মোবাইল রিচার্জ রিকোয়েস্ট!',
      message: `${currentUser.name} (${currentUser.phone}) - ${operator} (${simType}) নাম্বারে ৳${amount} রিচার্জ চেয়েছেন।`,
      amount,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      targetRefId: newReq.id,
    });
  };

  // Drive Offer Purchase
  const handleBuyOffer = (
    offer: DriveOffer,
    targetPhone: string,
    simType: SimType,
    customerNote?: string
  ) => {
    if (!currentUser) return;

    if (currentUser.balance < offer.offerPrice) {
      showToast('অফারটি কেনার জন্য ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!', 'error');
      return;
    }

    const updatedBalance = currentUser.balance - offer.offerPrice;
    const updatedUser = { ...currentUser, balance: updatedBalance };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    const newReq: RechargeRequest = {
      id: `dr-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      type: 'drive_offer',
      operator: offer.operator,
      targetPhone,
      simType,
      amount: offer.offerPrice,
      offerId: offer.id,
      offerTitle: offer.title,
      offerCategory: offer.category,
      customerNote: customerNote || undefined,
      status: 'pending',
      timestamp: new Date().toISOString(),
      trxId: generateTrxId(),
    };

    setRechargeRequests((prev) => [newReq, ...prev]);
    showToast('অফার অর্ডার সফল হয়েছে! এডমিন ম্যানুয়ালি ভেরিফাই করে চালু করে দেবেন।', 'success');
    setSelectedReceipt(newReq);

    // Notify Admin with Sound & Push
    triggerAdminNotification({
      type: 'drive_offer',
      title: 'নতুন ড্রাইভ অফার অর্ডার!',
      message: `${currentUser.name} (${currentUser.phone}) - ${offer.title} (${formatTaka(offer.offerPrice)}) অর্ডার করেছেন।`,
      amount: offer.offerPrice,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      targetRefId: newReq.id,
    });
  };

  // Digital & NID Services Order Submission
  const handleOrderNidService = (data: {
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
  }) => {
    if (!currentUser) return;

    if (currentUser.balance < data.fee) {
      showToast('অর্ডার করার জন্য ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!', 'error');
      return;
    }

    const updatedBalance = currentUser.balance - data.fee;
    const updatedUser = { ...currentUser, balance: updatedBalance };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    const newOrder: NidOrderRequest = {
      id: `nid-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      serviceId: data.serviceId,
      serviceType: (data.serviceId as any) || 'nid_pdf',
      serviceTitle: data.serviceTitle,
      fee: data.fee,
      formData: data.formData,
      name: data.name,
      nidNumber: data.nidNumber,
      dateOfBirth: data.dateOfBirth,
      upazila: data.upazila,
      district: data.district,
      customerFiles: data.customerFiles,
      status: 'pending',
      timestamp: new Date().toISOString(),
      trxId: generateTrxId(),
    };

    data.customerFiles?.forEach((cf) => {
      if (cf.dataUrl) {
        saveFileBlob(`customer_${cf.id}`, cf.dataUrl);
      }
    });

    setNidOrders((prev) => [newOrder, ...prev]);
    showToast(`${data.serviceTitle} সফলভাবে সাবমিট হয়েছে! ফি: ${formatTaka(data.fee)}`, 'success');
    setSelectedReceipt(newOrder);

    // Notify Admin with Sound & Push
    triggerAdminNotification({
      type: 'nid_order',
      title: `নতুন ${data.serviceTitle} অর্ডার!`,
      message: `${currentUser.name} (${currentUser.phone}) - ${data.serviceTitle} সাবমিট করেছেন${data.customerFiles?.length ? ` (${data.customerFiles.length} টি ফাইলসহ)` : ''}।`,
      amount: data.fee,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      targetRefId: newOrder.id,
    });
  };

  // Admin Complete NID / Digital Service Order with File / PDF Upload
  const handleCompleteNidOrder = (
    orderId: string,
    deliveryNote?: string,
    fileUrl?: string,
    pdfDataUrl?: string,
    pdfFileName?: string,
    pdfFileSize?: string
  ) => {
    if (pdfDataUrl) {
      saveFileBlob(`delivery_${orderId}`, pdfDataUrl);
    }
    setNidOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'completed',
              completedAt: new Date().toISOString(),
              deliveryNote: deliveryNote || 'আপনার সার্ভিস ফাইল প্রস্তুত।',
              deliveryFileUrl: fileUrl,
              pdfDataUrl: pdfDataUrl,
              pdfFileName: pdfFileName,
              pdfFileSize: pdfFileSize,
            }
          : o
      )
    );
    showToast('অর্ডার সফল ও ফাইল ডেলিভারি সম্পন্ন হয়েছে!', 'success');
  };

  // Admin Reject & Refund NID Order
  const handleRejectNidOrder = (orderId: string, refund: boolean) => {
    const order = nidOrders.find((o) => o.id === orderId);
    if (!order) return;

    setNidOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'rejected' } : o))
    );

    if (refund) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === order.userId) {
            const newBal = u.balance + order.fee;
            if (currentUser?.id === u.id) {
              setCurrentUser({ ...u, balance: newBal });
            }
            return { ...u, balance: newBal };
          }
          return u;
        })
      );
      showToast(`অর্ডার বাতিল ও ৳${order.fee} গ্রাহকের ওয়ালেটে ফেরত দেওয়া হয়েছে।`, 'info');
    } else {
      showToast('অর্ডার বাতিল করা হয়েছে।', 'info');
    }
  };

  // Add Money Submission
  const handleAddMoneySubmit = ({
    method,
    senderNumber,
    amount,
    trxId,
  }: {
    method: PaymentMethod;
    senderNumber: string;
    amount: number;
    trxId: string;
  }) => {
    if (!currentUser) return;

    const newReq: AddMoneyRequest = {
      id: `am-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      method,
      senderNumber,
      amount,
      trxId,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    setAddMoneyRequests((prev) => [newReq, ...prev]);
    showToast('অ্যাড মানি রিকোয়েস্ট সফল হয়েছে! এডমিন ভেরিফাই করে টাকা যোগ করবেন।', 'success');
    setSelectedReceipt(newReq);

    // Notify Admin with Sound & Push
    triggerAdminNotification({
      type: 'add_money',
      title: 'নতুন অ্যাড মানি রিকোয়েস্ট!',
      message: `${currentUser.name} (${currentUser.phone}) - ${method} দিয়ে ৳${amount} যোগ করার রিকোয়েস্ট পাঠিয়েছেন (TrxID: ${trxId})।`,
      amount,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      targetRefId: newReq.id,
    });
  };

  // Admin Actions: Approve Add Money
  const handleApproveAddMoney = (requestId: string) => {
    const req = addMoneyRequests.find((r) => r.id === requestId);
    if (!req) return;

    setAddMoneyRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === req.userId) {
          const newBal = u.balance + req.amount;
          if (currentUser?.id === u.id) {
            setCurrentUser({ ...u, balance: newBal });
          }
          return { ...u, balance: newBal };
        }
        return u;
      })
    );

    showToast(`৳${req.amount} ব্যালেন্স সফলভাবে যোগ করা হয়েছে!`, 'success');
  };

  // Admin Actions: Reject Add Money
  const handleRejectAddMoney = (requestId: string) => {
    setAddMoneyRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
    showToast('অ্যাড মানি রিকোয়েস্ট বাতিল করা হয়েছে।', 'info');
  };

  // Admin Actions: Complete Recharge
  const handleCompleteRecharge = (requestId: string) => {
    setRechargeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'completed' } : r))
    );
    showToast('রিচার্জ সফল হিসেবে চিহ্নিত হয়েছে!', 'success');
  };

  // Admin Actions: Reject & Refund Recharge
  const handleRejectRecharge = (requestId: string, refund: boolean) => {
    const req = rechargeRequests.find((r) => r.id === requestId);
    if (!req) return;

    setRechargeRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );

    if (refund) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === req.userId) {
            const newBal = u.balance + req.amount;
            if (currentUser?.id === u.id) {
              setCurrentUser({ ...u, balance: newBal });
            }
            return { ...u, balance: newBal };
          }
          return u;
        })
      );
      showToast(`রিচার্জ বাতিল ও ৳${req.amount} গ্রাহকের ওয়ালেটে ফেরত দেওয়া হয়েছে।`, 'info');
    } else {
      showToast('রিচার্জ বাতিল করা হয়েছে।', 'info');
    }
  };

  // Admin Actions: Add Offer
  const handleAddOffer = (newOfferData: Omit<DriveOffer, 'id'>) => {
    const offer: DriveOffer = {
      ...newOfferData,
      id: `off-${Date.now()}`,
    };
    setOffers((prev) => [offer, ...prev]);
    showToast('নতুন ড্রাইভ অফার সফলভাবে যুক্ত হয়েছে!');
  };

  // Admin Actions: Update Offer
  const handleUpdateOffer = (offerId: string, updated: Partial<DriveOffer>) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, ...updated } : o))
    );
    showToast('অফার আপডেট হয়েছে!');
  };

  // Admin Actions: Delete Offer
  const handleDeleteOffer = (offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    showToast('অফার মুছে ফেলা হয়েছে।', 'info');
  };

  // Admin Actions: Digital Services Management
  const handleAddDigitalService = (serviceData: Omit<DigitalServiceItem, 'id'>) => {
    const newService: DigitalServiceItem = {
      ...serviceData,
      id: `srv-${Date.now()}`,
    };
    setDigitalServices((prev) => [...prev, newService]);
    showToast(`নতুন সেবা "${newService.title}" সফলভাবে যোগ করা হয়েছে!`);
  };

  const handleUpdateDigitalService = (serviceId: string, updated: Partial<DigitalServiceItem>) => {
    setDigitalServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updated } : s))
    );
    showToast('ডিজিটাল সেবা সফলভাবে আপডেট হয়েছে!');
  };

  const handleDeleteDigitalService = (serviceId: string) => {
    setDigitalServices((prev) => prev.filter((s) => s.id !== serviceId));
    showToast('ডিজিটাল সেবা মুছে ফেলা হয়েছে।', 'info');
  };

  // Admin Actions: Manual Balance Adjustment
  const handleAdjustUserBalance = (userId: string, deltaAmount: number, reason: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newBal = Math.max(0, u.balance + deltaAmount);
          if (currentUser?.id === u.id) {
            setCurrentUser({ ...u, balance: newBal });
          }
          return { ...u, balance: newBal };
        }
        return u;
      })
    );

    showToast(`গ্রাহক ব্যালেন্স ${deltaAmount >= 0 ? '+' : ''}${formatTaka(deltaAmount)} সমন্বয় করা হয়েছে!`);
  };

  // Admin Actions: Update Settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('সিস্টেম সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Notification Management Actions
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('সব নোটিফিকেশন পড়া হয়েছে হিসেবে চিহ্নিত করা হয়েছে।');
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    showToast('সকল নোটিফিকেশন মুছে ফেলা হয়েছে।', 'info');
  };

  const handleUpdateNotificationSettings = (newNotifSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...newNotifSettings,
      },
    }));
    showToast('নোটিফিকেশন অপশন আপডেট হয়েছে!');
  };

  // Reset to initial demo data
  const handleResetDemoData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setOffers(INITIAL_OFFERS);
    setAddMoneyRequests(INITIAL_ADD_MONEY_REQUESTS);
    setRechargeRequests(INITIAL_RECHARGE_REQUESTS);
    setNidOrders(INITIAL_NID_ORDERS);
    setDigitalServices(INITIAL_DIGITAL_SERVICES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    showToast('ডেমো ডেটা সফলভাবে রিস্টোর করা হয়েছে!');
  };

  // Filter requests for currently logged-in user
  const currentUserRecharges = currentUser
    ? rechargeRequests.filter((r) => r.userId === currentUser.id)
    : [];
  const currentUserAddMoney = currentUser
    ? addMoneyRequests.filter((a) => a.userId === currentUser.id)
    : [];
  const currentUserNidOrders = currentUser
    ? nidOrders.filter((o) => o.userId === currentUser.id)
    : [];

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen text-slate-800 selection:bg-indigo-500 selection:text-white">
        <AuthSection onLogin={handleLogin} availableUsers={users} />

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 bg-slate-900 text-white border-slate-800">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Global Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        unreadNotificationsCount={unreadNotificationsCount}
        onToggleView={handleToggleView}
        onOpenAddMoney={() => {
          setCurrentView('user');
          setActiveTab('add-money');
        }}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onOpenSideMenu={() => setIsSideMenuOpen(true)}
      />

      {/* 2. Announcement Notice Banner */}
      <NoticeBanner noticeText={settings.noticeText} enabled={settings.noticeEnabled} />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentUser.role === 'admin' && currentUser.phone === '01844868379' && currentView === 'admin' ? (
          <AdminPanel
            users={users}
            offers={offers}
            addMoneyRequests={addMoneyRequests}
            rechargeRequests={rechargeRequests}
            nidOrders={nidOrders}
            digitalServices={digitalServices}
            notifications={notifications}
            settings={settings}
            onApproveAddMoney={handleApproveAddMoney}
            onRejectAddMoney={handleRejectAddMoney}
            onCompleteRecharge={handleCompleteRecharge}
            onRejectRecharge={handleRejectRecharge}
            onCompleteNidOrder={handleCompleteNidOrder}
            onRejectNidOrder={handleRejectNidOrder}
            onAddDigitalService={handleAddDigitalService}
            onUpdateDigitalService={handleUpdateDigitalService}
            onDeleteDigitalService={handleDeleteDigitalService}
            onAddOffer={handleAddOffer}
            onUpdateOffer={handleUpdateOffer}
            onDeleteOffer={handleDeleteOffer}
            onAdjustUserBalance={handleAdjustUserBalance}
            onUpdateSettings={handleUpdateSettings}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onDeleteNotification={handleDeleteNotification}
            onClearAllNotifications={handleClearAllNotifications}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            onResetDemoData={handleResetDemoData}
            onBackToUserView={() => setCurrentView('user')}
            onLogout={handleLogout}
          />
        ) : (
          <UserDashboard
            currentUser={currentUser}
            offers={offers}
            userRecharges={currentUserRecharges}
            userAddMoney={currentUserAddMoney}
            userNidOrders={currentUserNidOrders}
            digitalServices={digitalServices}
            settings={settings}
            activeTab={activeTab}
            selectedNidServiceId={selectedNidServiceId}
            onSelectNidService={(id) => setSelectedNidServiceId(id)}
            onTabChange={(tab) => setActiveTab(tab)}
            onRechargeSubmit={handleRechargeSubmit}
            onBuyOffer={handleBuyOffer}
            onOrderNidService={handleOrderNidService}
            onAddMoneySubmit={handleAddMoneySubmit}
            onViewReceipt={(item) => setSelectedReceipt(item)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Left Side Three-Dot Menu Drawer */}
      {currentView === 'user' && (
        <SideMenuDrawer
          isOpen={isSideMenuOpen}
          onClose={() => setIsSideMenuOpen(false)}
          currentUser={currentUser}
          activeTab={activeTab}
          selectedServiceId={selectedNidServiceId}
          digitalServices={digitalServices}
          whatsappNumber={settings.whatsappNumber || '+8801844868379'}
          onSelectTab={(tab) => {
            setCurrentView('user');
            setSelectedNidServiceId(undefined);
            setActiveTab(tab);
          }}
          onSelectDigitalService={(serviceId) => {
            setCurrentView('user');
            setSelectedNidServiceId(serviceId);
            setActiveTab('nid-services');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 4. Digital Voucher / Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* 5. Admin Notification Drawer Modal (Admin Only) */}
      {currentUser.role === 'admin' && currentUser.phone === '01844868379' && (
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          notifications={notifications}
          settings={settings.notifications}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onMarkAsRead={handleMarkNotificationAsRead}
          onDeleteNotification={handleDeleteNotification}
          onClearAll={handleClearAllNotifications}
          onToggleSound={(soundEnabled) => handleUpdateNotificationSettings({ soundEnabled })}
          onNavigateToOrder={() => {
            handleToggleView('admin');
          }}
        />
      )}

      {/* Customer Entrance Notice Popup (Shown once per website entry / new notice) */}
      {(() => {
        const isCustomer = !(currentUser.role === 'admin' && currentUser.phone === '01844868379');
        const activePopupNoticeId = settings.popupNoticeId || 'notice-default';
        const activePopupNoticeMessage = settings.popupNoticeText ?? settings.noticeText ?? '';
        const activePopupNoticeTitle = settings.popupNoticeTitle || 'গুরুত্বপূর্ণ নোটিশ ও আপডেট';
        const currentPopupKey = `${currentUser.id}_${activePopupNoticeId}`;
        const shouldShow =
          isCustomer &&
          currentView === 'user' &&
          settings.popupNoticeEnabled !== false &&
          Boolean(activePopupNoticeMessage.trim()) &&
          dismissedPopupNoticeKey !== currentPopupKey;

        return (
          <CustomerNoticeModal
            isOpen={shouldShow}
            title={activePopupNoticeTitle}
            message={activePopupNoticeMessage}
            sentAt={settings.popupNoticeSentAt}
            onClose={() => setDismissedPopupNoticeKey(currentPopupKey)}
          />
        );
      })()}

      {/* 6. Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold transition-all animate-in slide-in-from-bottom-5 duration-200 bg-slate-900 text-white border-slate-800">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-5 px-4 border-t border-slate-800 text-xs text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} টেলিকম ও ডিজিটাল সেবা পোর্টাল BD. সর্বস্বত্ব সংরক্ষিত।</p>
          <span>সকাল ৮টা - রাত ১১টা</span>
        </div>
      </footer>

    </div>
  );
}
