import { Operator } from '../types/telecom';

export interface OperatorInfo {
  id: Operator;
  name: string;
  nameBn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  prefixes: string[];
}

export const OPERATORS: Record<Operator, OperatorInfo> = {
  GP: {
    id: 'GP',
    name: 'Grameenphone',
    nameBn: 'গ্রামীণফোন',
    color: '#008ad7',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-500',
    textColor: 'text-sky-700',
    prefixes: ['017', '013'],
  },
  Robi: {
    id: 'Robi',
    name: 'Robi',
    nameBn: 'রবি',
    color: '#ed1c24',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    textColor: 'text-red-700',
    prefixes: ['018'],
  },
  Banglalink: {
    id: 'Banglalink',
    name: 'Banglalink',
    nameBn: 'বাংলালিংক',
    color: '#f37021',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-700',
    prefixes: ['019', '014'],
  },
  Airtel: {
    id: 'Airtel',
    name: 'Airtel',
    nameBn: 'এয়ারটেল',
    color: '#e40000',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-500',
    textColor: 'text-rose-700',
    prefixes: ['016'],
  },
  Teletalk: {
    id: 'Teletalk',
    name: 'Teletalk',
    nameBn: 'টেলিটক',
    color: '#0b8241',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-700',
    prefixes: ['015'],
  },
  Skitto: {
    id: 'Skitto',
    name: 'Skitto',
    nameBn: 'স্কিট্টো',
    color: '#00c389',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-500',
    textColor: 'text-teal-700',
    prefixes: ['017', '013'],
  },
};

/**
 * Detect operator based on Bangladeshi phone number prefix
 */
export function detectOperatorFromPhone(phone: string): Operator | null {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 3) return null;
  const prefix3 = clean.substring(0, 3);

  if (prefix3 === '017' || prefix3 === '013') return 'GP';
  if (prefix3 === '018') return 'Robi';
  if (prefix3 === '019' || prefix3 === '014') return 'Banglalink';
  if (prefix3 === '016') return 'Airtel';
  if (prefix3 === '015') return 'Teletalk';

  return null;
}

/**
 * Validate standard 11-digit Bangladeshi mobile number
 */
export function isValidBdPhone(phone: string): boolean {
  const clean = phone.replace(/[^0-9]/g, '');
  return /^01[3-9]\d{8}$/.test(clean);
}

/**
 * Format currency to Bangladeshi Taka (৳)
 */
export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date to standard localized string
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Generate random realistic TrxID
 */
export function generateTrxId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'TRX';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
