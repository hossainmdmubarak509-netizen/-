import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore, testConnection } from './firebase';
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
import { uploadCloudFile } from './utils/cloudFileService';
import { hashPassword } from './utils/passwordHelper';
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

const SESSION_USER_ID_KEY = 'bd_telecom_portal_current_user_id';

/**
 * Prepares a User record for Firestore storage without ever persisting plaintext passwords.
 */
async function toCloudUserDoc(user: User): Promise<User> {
  const passwordHash =
    user.passwordHash || (user.password ? await hashPassword(user.password) : await hashPassword('mnb229Am'));
  return sanitizeForFirestore({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email || `${user.phone}@telecom.bd`,
    role: user.role,
    balance: Number(user.balance) || 0,
    passwordHash,
    createdAt: user.createdAt || new Date().toISOString(),
  });
}

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedId = localStorage.getItem(SESSION_USER_ID_KEY);
      if (savedId) {
        return INITIAL_USERS.find((u) => u.id === savedId) || null;
      }
    } catch {
      // Ignore storage error
    }
    return null;
  });

  const [offers, setOffers] = useState<DriveOffer[]>(INITIAL_OFFERS);
  const [addMoneyRequests, setAddMoneyRequests] = useState<AddMoneyRequest[]>(INITIAL_ADD_MONEY_REQUESTS);
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>(INITIAL_RECHARGE_REQUESTS);
  const [nidOrders, setNidOrders] = useState<NidOrderRequest[]>(INITIAL_NID_ORDERS);
  const [digitalServices, setDigitalServices] = useState<DigitalServiceItem[]>(INITIAL_DIGITAL_SERVICES);
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

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

  const seededRef = useRef(false);

  // Save only current session user ID locally so reload remembers who is signed in
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(SESSION_USER_ID_KEY, currentUser.id);
      } else {
        localStorage.removeItem(SESSION_USER_ID_KEY);
      }
    } catch {
      // Ignore localStorage quota issues
    }
  }, [currentUser]);

  // Keep currentUser always synced live with Firestore users snapshot (e.g., live wallet balance)
  useEffect(() => {
    let savedId: string | null = null;
    try {
      savedId = localStorage.getItem(SESSION_USER_ID_KEY);
    } catch {
      savedId = null;
    }

    const activeId = currentUser?.id || savedId;
    if (!activeId) return;

    const liveMatch = users.find((u) => u.id === activeId);
    if (liveMatch) {
      setCurrentUser((prev) => {
        if (
          prev &&
          prev.id === liveMatch.id &&
          prev.balance === liveMatch.balance &&
          prev.name === liveMatch.name &&
          prev.role === liveMatch.role &&
          prev.email === liveMatch.email &&
          prev.passwordHash === liveMatch.passwordHash
        ) {
          return prev;
        }
        return liveMatch;
      });
    }
  }, [users, currentUser?.id]);

  // Boot Firestore connection check, idempotent initial seeding, and live onSnapshot listeners
  useEffect(() => {
    void testConnection();

    const seedCloudDatabaseIfEmpty = async () => {
      if (seededRef.current) return;
      seededRef.current = true;

      try {
        // 1. Seed Settings doc if missing
        const settingsRef = doc(db, 'settings', 'app');
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
          await setDoc(settingsRef, sanitizeForFirestore(INITIAL_SETTINGS));
        }

        // 2. Ensure core users exist in Firestore (Admin & Demo Customer + Initial seed if empty)
        const usersSnap = await getDocs(collection(db, 'portal_users'));
        const existingUserIds = new Set(usersSnap.docs.map((d) => d.id));
        if (usersSnap.empty) {
          for (const u of INITIAL_USERS) {
            const docData = await toCloudUserDoc(u);
            await setDoc(doc(db, 'portal_users', u.id), docData);
          }
        } else {
          for (const coreUser of INITIAL_USERS.slice(0, 2)) {
            if (!existingUserIds.has(coreUser.id)) {
              const docData = await toCloudUserDoc(coreUser);
              await setDoc(doc(db, 'portal_users', coreUser.id), docData);
            }
          }
        }

        // 3. Seed Offers if empty
        const offersSnap = await getDocs(collection(db, 'offers'));
        if (offersSnap.empty) {
          for (const off of INITIAL_OFFERS) {
            await setDoc(doc(db, 'offers', off.id), sanitizeForFirestore(off));
          }
        }

        // 4. Seed Digital Services if empty
        const servicesSnap = await getDocs(collection(db, 'digital_services'));
        if (servicesSnap.empty) {
          for (const srv of INITIAL_DIGITAL_SERVICES) {
            await setDoc(doc(db, 'digital_services', srv.id), sanitizeForFirestore(srv));
          }
        }

        // 5. Seed Initial sample history/notifications only if completely fresh DB
        const addMoneySnap = await getDocs(collection(db, 'add_money_requests'));
        if (addMoneySnap.empty && usersSnap.empty) {
          for (const am of INITIAL_ADD_MONEY_REQUESTS) {
            await setDoc(doc(db, 'add_money_requests', am.id), sanitizeForFirestore(am));
          }
        }

        const rechargeSnap = await getDocs(collection(db, 'recharge_requests'));
        if (rechargeSnap.empty && usersSnap.empty) {
          for (const rc of INITIAL_RECHARGE_REQUESTS) {
            await setDoc(doc(db, 'recharge_requests', rc.id), sanitizeForFirestore(rc));
          }
        }

        const nidSnap = await getDocs(collection(db, 'nid_orders'));
        if (nidSnap.empty && usersSnap.empty) {
          for (const ord of INITIAL_NID_ORDERS) {
            await setDoc(doc(db, 'nid_orders', ord.id), sanitizeForFirestore(ord));
          }
        }

        const notifSnap = await getDocs(collection(db, 'admin_notifications'));
        if (notifSnap.empty && usersSnap.empty) {
          for (const n of INITIAL_NOTIFICATIONS) {
            await setDoc(doc(db, 'admin_notifications', n.id), sanitizeForFirestore(n));
          }
        }
      } catch (error) {
        console.error('Initial Firestore seed error:', error);
      }
    };

    void seedCloudDatabaseIfEmpty();

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'app'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<AppSettings>;
          setSettings({
            ...INITIAL_SETTINGS,
            ...data,
            paymentNumbers: {
              ...INITIAL_SETTINGS.paymentNumbers,
              ...(data.paymentNumbers || {}),
            },
            nidFees: {
              ...INITIAL_SETTINGS.nidFees,
              ...(data.nidFees || {}),
            },
            notifications: {
              ...INITIAL_SETTINGS.notifications,
              ...(data.notifications || {}),
            },
          });
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/app')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'portal_users'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as User);
        if (list.length > 0) {
          list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setUsers(list);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'portal_users')
    );

    const unsubOffers = onSnapshot(
      collection(db, 'offers'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DriveOffer);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setOffers(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'offers')
    );

    const unsubServices = onSnapshot(
      collection(db, 'digital_services'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DigitalServiceItem);
        setDigitalServices(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'digital_services')
    );

    const unsubAddMoney = onSnapshot(
      collection(db, 'add_money_requests'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as AddMoneyRequest)
          .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAddMoneyRequests(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'add_money_requests')
    );

    const unsubRecharges = onSnapshot(
      collection(db, 'recharge_requests'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as RechargeRequest)
          .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setRechargeRequests(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'recharge_requests')
    );

    const unsubNidOrders = onSnapshot(
      collection(db, 'nid_orders'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as NidOrderRequest)
          .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setNidOrders(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'nid_orders')
    );

    const unsubNotifs = onSnapshot(
      collection(db, 'admin_notifications'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as AdminNotification)
          .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setNotifications(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'admin_notifications')
    );

    return () => {
      unsubSettings();
      unsubUsers();
      unsubOffers();
      unsubServices();
      unsubAddMoney();
      unsubRecharges();
      unsubNidOrders();
      unsubNotifs();
    };
  }, []);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Auth handlers
  const handleLogin = async (user: User, openAdmin: boolean = false) => {
    const existsInCloud = users.some((u) => u.id === user.id);
    if (!existsInCloud) {
      try {
        const cloudDoc = await toCloudUserDoc(user);
        await setDoc(doc(db, 'portal_users', user.id), cloudDoc);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `portal_users/${user.id}`);
      }
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

  // Central Admin Notification Dispatcher with Sound, Browser Push & Cloud Sync
  const triggerAdminNotification = async ({
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

    if (type === 'recharge' && !notifConfig.notifyOnRecharge) return;
    if (type === 'drive_offer' && !notifConfig.notifyOnDriveOffer) return;
    if (type === 'nid_order' && !notifConfig.notifyOnNidOrder) return;
    if (type === 'add_money' && !notifConfig.notifyOnAddMoney) return;

    const newNotif: AdminNotification = sanitizeForFirestore({
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
    });

    try {
      await setDoc(doc(db, 'admin_notifications', newNotif.id), newNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `admin_notifications/${newNotif.id}`);
    }

    if (notifConfig.soundEnabled) {
      playNotificationSound();
    }
    if (notifConfig.browserNotificationsEnabled) {
      sendBrowserNotification(title, message);
    }
  };

  // Recharge Submission
  const handleRechargeSubmit = async ({
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
    const newReq: RechargeRequest = sanitizeForFirestore({
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
    });

    try {
      await updateDoc(doc(db, 'portal_users', currentUser.id), { balance: updatedBalance });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `portal_users/${currentUser.id}`);
    }

    try {
      await setDoc(doc(db, 'recharge_requests', newReq.id), newReq);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `recharge_requests/${newReq.id}`);
    }

    showToast(`${formatTaka(amount)} রিচার্জ রিকোয়েস্ট জমা হয়েছে!`, 'success');
    setSelectedReceipt(newReq);

    await triggerAdminNotification({
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
  const handleBuyOffer = async (
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
    const newReq: RechargeRequest = sanitizeForFirestore({
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
    });

    try {
      await updateDoc(doc(db, 'portal_users', currentUser.id), { balance: updatedBalance });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `portal_users/${currentUser.id}`);
    }

    try {
      await setDoc(doc(db, 'recharge_requests', newReq.id), newReq);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `recharge_requests/${newReq.id}`);
    }

    showToast('অফার অর্ডার সফল হয়েছে! এডমিন ম্যানুয়ালি ভেরিফাই করে চালু করে দেবেন।', 'success');
    setSelectedReceipt(newReq);

    await triggerAdminNotification({
      type: 'drive_offer',
      title: 'নতুন ড্রাইভ অফার অর্ডার!',
      message: `${currentUser.name} (${currentUser.phone}) - ${offer.title} (${formatTaka(offer.offerPrice)}) অর্ডার করেছেন।`,
      amount: offer.offerPrice,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      targetRefId: newReq.id,
    });
  };

  // Digital & NID Services Order Submission (with cloud chunked file attachments)
  const handleOrderNidService = async (data: {
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

    const orderId = `nid-${Date.now()}`;
    const cloudCustomerFiles: UploadedFileAttachment[] | undefined = data.customerFiles?.length
      ? []
      : undefined;

    if (data.customerFiles?.length && cloudCustomerFiles) {
      for (const cf of data.customerFiles) {
        const fid = cf.fileId || cf.id;
        if (cf.dataUrl) {
          await uploadCloudFile({
            fileId: fid,
            fileName: cf.fileName,
            fileSize: cf.fileSize,
            fileType: cf.fileType,
            dataUrl: cf.dataUrl,
          });
        }
        cloudCustomerFiles.push({
          id: cf.id,
          fileId: fid,
          fileName: cf.fileName,
          fileSize: cf.fileSize,
          fileType: cf.fileType,
        });
      }
    }

    const updatedBalance = currentUser.balance - data.fee;

    const newOrder: NidOrderRequest = sanitizeForFirestore({
      id: orderId,
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
      customerFiles: cloudCustomerFiles,
      status: 'pending',
      timestamp: new Date().toISOString(),
      trxId: generateTrxId(),
    });

    try {
      await updateDoc(doc(db, 'portal_users', currentUser.id), { balance: updatedBalance });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `portal_users/${currentUser.id}`);
    }

    try {
      await setDoc(doc(db, 'nid_orders', newOrder.id), newOrder);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `nid_orders/${newOrder.id}`);
    }

    showToast(`${data.serviceTitle} সফলভাবে সাবমিট হয়েছে! ফি: ${formatTaka(data.fee)}`, 'success');
    setSelectedReceipt({
      ...newOrder,
      customerFiles: data.customerFiles || cloudCustomerFiles,
    });

    await triggerAdminNotification({
      type: 'nid_order',
      title: `নতুন ${data.serviceTitle} অর্ডার!`,
      message: `${currentUser.name} (${currentUser.phone}) - ${data.serviceTitle} সাবমিট করেছেন${data.customerFiles?.length ? ` (${data.customerFiles.length} টি ফাইলসহ)` : ''}।`,
      amount: data.fee,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      targetRefId: newOrder.id,
    });
  };

  // Admin Complete NID / Digital Service Order with Cloud File Upload
  const handleCompleteNidOrder = async (
    orderId: string,
    deliveryNote?: string,
    fileUrl?: string,
    pdfDataUrl?: string,
    pdfFileName?: string,
    pdfFileSize?: string
  ) => {
    const existingOrder = nidOrders.find((o) => o.id === orderId);
    const pdfFileId = pdfDataUrl
      ? `delivery_${orderId}_${Date.now()}`
      : existingOrder?.pdfFileId;

    if (pdfDataUrl && pdfFileId) {
      await uploadCloudFile({
        fileId: pdfFileId,
        fileName: pdfFileName || existingOrder?.pdfFileName || 'document.pdf',
        fileSize: pdfFileSize || existingOrder?.pdfFileSize,
        dataUrl: pdfDataUrl,
      });
    }

    const updatePayload = sanitizeForFirestore({
      status: 'completed',
      completedAt: new Date().toISOString(),
      deliveryNote: deliveryNote || 'আপনার সার্ভিস ফাইল প্রস্তুত।',
      deliveryFileUrl: fileUrl || '#',
      pdfFileId,
      pdfFileName: pdfFileName || existingOrder?.pdfFileName,
      pdfFileSize: pdfFileSize || existingOrder?.pdfFileSize,
      pdfDataUrl: pdfDataUrl
        ? pdfDataUrl.length <= 50000
          ? pdfDataUrl
          : ''
        : existingOrder?.pdfDataUrl || '',
    });

    try {
      await updateDoc(doc(db, 'nid_orders', orderId), updatePayload);
      showToast('অর্ডার সফল ও ফাইল ডেলিভারি সম্পন্ন হয়েছে!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `nid_orders/${orderId}`);
    }
  };

  // Admin Reject & Refund NID Order
  const handleRejectNidOrder = async (orderId: string, refund: boolean) => {
    const order = nidOrders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      await updateDoc(doc(db, 'nid_orders', orderId), { status: 'rejected' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `nid_orders/${orderId}`);
    }

    if (refund) {
      const targetUser = users.find((u) => u.id === order.userId);
      if (targetUser) {
        try {
          await updateDoc(doc(db, 'portal_users', targetUser.id), {
            balance: targetUser.balance + order.fee,
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `portal_users/${targetUser.id}`);
        }
      }
      showToast(`অর্ডার বাতিল ও ৳${order.fee} গ্রাহকের ওয়ালেটে ফেরত দেওয়া হয়েছে।`, 'info');
    } else {
      showToast('অর্ডার বাতিল করা হয়েছে।', 'info');
    }
  };

  // Add Money Submission
  const handleAddMoneySubmit = async ({
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

    const newReq: AddMoneyRequest = sanitizeForFirestore({
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
    });

    try {
      await setDoc(doc(db, 'add_money_requests', newReq.id), newReq);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `add_money_requests/${newReq.id}`);
    }

    showToast('অ্যাড মানি রিকোয়েস্ট সফল হয়েছে! এডমিন ভেরিফাই করে টাকা যোগ করবেন।', 'success');
    setSelectedReceipt(newReq);

    await triggerAdminNotification({
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
  const handleApproveAddMoney = async (requestId: string) => {
    const req = addMoneyRequests.find((r) => r.id === requestId);
    if (!req) return;

    try {
      await updateDoc(doc(db, 'add_money_requests', requestId), { status: 'approved' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `add_money_requests/${requestId}`);
    }

    const targetUser = users.find((u) => u.id === req.userId);
    if (targetUser) {
      try {
        await updateDoc(doc(db, 'portal_users', targetUser.id), {
          balance: targetUser.balance + req.amount,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `portal_users/${targetUser.id}`);
      }
    }

    showToast(`৳${req.amount} ব্যালেন্স সফলভাবে যোগ করা হয়েছে!`, 'success');
  };

  // Admin Actions: Reject Add Money
  const handleRejectAddMoney = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'add_money_requests', requestId), { status: 'rejected' });
      showToast('অ্যাড মানি রিকোয়েস্ট বাতিল করা হয়েছে।', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `add_money_requests/${requestId}`);
    }
  };

  // Admin Actions: Complete Recharge
  const handleCompleteRecharge = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'recharge_requests', requestId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      showToast('রিচার্জ সফল হিসেবে চিহ্নিত হয়েছে!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recharge_requests/${requestId}`);
    }
  };

  // Admin Actions: Reject & Refund Recharge
  const handleRejectRecharge = async (requestId: string, refund: boolean) => {
    const req = rechargeRequests.find((r) => r.id === requestId);
    if (!req) return;

    try {
      await updateDoc(doc(db, 'recharge_requests', requestId), { status: 'rejected' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recharge_requests/${requestId}`);
    }

    if (refund) {
      const targetUser = users.find((u) => u.id === req.userId);
      if (targetUser) {
        try {
          await updateDoc(doc(db, 'portal_users', targetUser.id), {
            balance: targetUser.balance + req.amount,
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `portal_users/${targetUser.id}`);
        }
      }
      showToast(`রিচার্জ বাতিল ও ৳${req.amount} গ্রাহকের ওয়ালেটে ফেরত দেওয়া হয়েছে।`, 'info');
    } else {
      showToast('রিচার্জ বাতিল করা হয়েছে।', 'info');
    }
  };

  // Admin Actions: Add Offer
  const handleAddOffer = async (newOfferData: Omit<DriveOffer, 'id'>) => {
    const offer: DriveOffer = sanitizeForFirestore({
      ...newOfferData,
      id: `off-${Date.now()}`,
      createdAt: newOfferData.createdAt || new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, 'offers', offer.id), offer);
      showToast('নতুন ড্রাইভ অফার সফলভাবে যুক্ত হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `offers/${offer.id}`);
    }
  };

  // Admin Actions: Update Offer
  const handleUpdateOffer = async (offerId: string, updated: Partial<DriveOffer>) => {
    const clean = sanitizeForFirestore(updated);
    try {
      await updateDoc(doc(db, 'offers', offerId), clean);
      showToast('অফার আপডেট হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `offers/${offerId}`);
    }
  };

  // Admin Actions: Delete Offer
  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteDoc(doc(db, 'offers', offerId));
      showToast('অফার মুছে ফেলা হয়েছে।', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `offers/${offerId}`);
    }
  };

  // Admin Actions: Digital Services Management
  const handleAddDigitalService = async (serviceData: Omit<DigitalServiceItem, 'id'>) => {
    const newService: DigitalServiceItem = sanitizeForFirestore({
      ...serviceData,
      id: `srv-${Date.now()}`,
      createdAt: serviceData.createdAt || new Date().toISOString(),
    });
    try {
      await setDoc(doc(db, 'digital_services', newService.id), newService);
      showToast(`নতুন সেবা "${newService.title}" সফলভাবে যোগ করা হয়েছে!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `digital_services/${newService.id}`);
    }
  };

  const handleUpdateDigitalService = async (
    serviceId: string,
    updated: Partial<DigitalServiceItem>
  ) => {
    const clean = sanitizeForFirestore(updated);
    try {
      await updateDoc(doc(db, 'digital_services', serviceId), clean);
      showToast('ডিজিটাল সেবা সফলভাবে আপডেট হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `digital_services/${serviceId}`);
    }
  };

  const handleDeleteDigitalService = async (serviceId: string) => {
    try {
      await deleteDoc(doc(db, 'digital_services', serviceId));
      showToast('ডিজিটাল সেবা মুছে ফেলা হয়েছে।', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `digital_services/${serviceId}`);
    }
  };

  // Admin Actions: Manual Balance Adjustment
  const handleAdjustUserBalance = async (userId: string, deltaAmount: number, _reason: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newBal = Math.max(0, targetUser.balance + deltaAmount);

    try {
      await updateDoc(doc(db, 'portal_users', userId), { balance: newBal });
      showToast(`গ্রাহক ব্যালেন্স ${deltaAmount >= 0 ? '+' : ''}${formatTaka(deltaAmount)} সমন্বয় করা হয়েছে!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `portal_users/${userId}`);
    }
  };

  // Admin Actions: Update Settings
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged: AppSettings = sanitizeForFirestore({
      ...settings,
      ...newSettings,
      paymentNumbers: {
        ...settings.paymentNumbers,
        ...(newSettings.paymentNumbers || {}),
      },
      nidFees: {
        ...settings.nidFees,
        ...(newSettings.nidFees || {}),
      },
      notifications: {
        ...settings.notifications,
        ...(newSettings.notifications || {}),
      },
    });
    setSettings(merged);
    try {
      await setDoc(doc(db, 'settings', 'app'), merged);
      showToast('সিস্টেম সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/app');
    }
  };

  // Notification Management Actions
  const handleMarkAllNotificationsAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    try {
      await Promise.all(
        unread.map((n) => updateDoc(doc(db, 'admin_notifications', n.id), { read: true }))
      );
      showToast('সব নোটিফিকেশন পড়া হয়েছে হিসেবে চিহ্নিত করা হয়েছে।');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'admin_notifications');
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'admin_notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admin_notifications/${id}`);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admin_notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admin_notifications/${id}`);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await Promise.all(
        notifications.map((n) => deleteDoc(doc(db, 'admin_notifications', n.id)))
      );
      showToast('সকল নোটিফিকেশন মুছে ফেলা হয়েছে।', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'admin_notifications');
    }
  };

  const handleUpdateNotificationSettings = (newNotifSettings: Partial<NotificationSettings>) => {
    void handleUpdateSettings({
      notifications: {
        ...settings.notifications,
        ...newNotifSettings,
      },
    });
  };

  // Reset demo data cleanly in Firestore
  const handleResetDemoData = async () => {
    try {
      await setDoc(doc(db, 'settings', 'app'), sanitizeForFirestore(INITIAL_SETTINGS));

      for (const u of INITIAL_USERS) {
        const existingUser = users.find((ex) => ex.id === u.id);
        const cloudDoc = await toCloudUserDoc(u);
        if (existingUser) {
          await updateDoc(doc(db, 'portal_users', u.id), {
            name: cloudDoc.name,
            email: cloudDoc.email,
            balance: cloudDoc.balance,
            role: cloudDoc.role,
            passwordHash: cloudDoc.passwordHash,
          });
        } else {
          await setDoc(doc(db, 'portal_users', u.id), cloudDoc);
        }
      }

      for (const off of INITIAL_OFFERS) {
        await setDoc(doc(db, 'offers', off.id), sanitizeForFirestore(off));
      }

      for (const srv of INITIAL_DIGITAL_SERVICES) {
        await setDoc(doc(db, 'digital_services', srv.id), sanitizeForFirestore(srv));
      }

      showToast('ডেমো ডেটা সফলভাবে রিস্টোর করা হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reset_demo_data');
    }
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
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100/90 text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      
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
