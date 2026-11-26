import { NotificationSettings } from '../types/telecom';

export interface ExternalAlertPayload {
  type: 'recharge' | 'drive_offer' | 'nid_order' | 'add_money';
  title: string;
  message: string;
  amount?: number;
  customerName: string;
  customerPhone: string;
  targetRefId?: string;
}

export function generateSecretNtfyTopic(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `bd-telecom-alert-${suffix}`;
}

function getSafePortalUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const origin = window.location.origin;
  if (origin.startsWith('http://') || origin.startsWith('https://')) {
    return origin;
  }
  return undefined;
}

function formatBanglaTypeLabel(type: ExternalAlertPayload['type']): string {
  switch (type) {
    case 'nid_order':
      return 'NID / ডিজিটাল সেবা অর্ডার';
    case 'drive_offer':
      return 'ড্রাইভ অফার অর্ডার';
    case 'recharge':
      return 'মোবাইল রিচার্জ';
    case 'add_money':
      return 'অ্যাড মানি রিকোয়েস্ট';
    default:
      return 'নতুন অর্ডার';
  }
}

export async function sendNtfyNotification({
  topic,
  title,
  message,
  clickUrl,
}: {
  topic: string;
  title: string;
  message: string;
  clickUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanTopic = topic.trim().replace(/^https?:\/\/ntfy\.sh\//i, '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanTopic) {
    return { ok: false, error: 'সঠিক ntfy টপিক নাম দিন।' };
  }

  try {
    const res = await fetch('https://ntfy.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: cleanTopic,
        title,
        message,
        priority: 5,
        tags: ['rotating_light', 'moneybag'],
        ...(clickUrl ? { click: clickUrl } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, error: errText || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'ntfy সার্ভারে পাঠানো যায়নি।' };
  }
}

export async function sendTelegramNotification({
  botToken,
  chatId,
  text,
}: {
  botToken: string;
  chatId: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();
  if (!cleanToken || !cleanChatId) {
    return { ok: false, error: 'Bot Token এবং Chat ID উভয়ই দিন।' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(cleanToken)}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.description || `টেলিগ্রাম এরর (HTTP ${res.status})`,
      };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'টেলিগ্রাম এপিআই সংযোগ ব্যর্থ।' };
  }
}

export async function sendExternalAdminAlerts(
  config: NotificationSettings,
  payload: ExternalAlertPayload
): Promise<void> {
  const portalUrl = getSafePortalUrl();
  const typeLabel = formatBanglaTypeLabel(payload.type);
  const amountLine = typeof payload.amount === 'number' ? `পরিমাণ: ৳${payload.amount}\n` : '';
  const timeStr = new Date().toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const richBody = [
    `ধরন: ${typeLabel}`,
    `গ্রাহক: ${payload.customerName} (${payload.customerPhone})`,
    amountLine ? amountLine.trimEnd() : null,
    `বিস্তারিত: ${payload.message}`,
    `সময়: ${timeStr}`,
    portalUrl ? `এডমিন প্যানেল: ${portalUrl}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const tasks: Promise<unknown>[] = [];

  if (config.ntfyEnabled && config.ntfyTopic?.trim()) {
    tasks.push(
      sendNtfyNotification({
        topic: config.ntfyTopic,
        title: `🔔 ${payload.title}`,
        message: richBody,
        clickUrl: portalUrl,
      })
    );
  }

  if (config.telegramEnabled && config.telegramBotToken?.trim() && config.telegramChatId?.trim()) {
    tasks.push(
      sendTelegramNotification({
        botToken: config.telegramBotToken,
        chatId: config.telegramChatId,
        text: `🔔 ${payload.title}\n\n${richBody}`,
      })
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}

export async function testNtfyAlert(topic: string): Promise<{ ok: boolean; error?: string }> {
  return sendNtfyNotification({
    topic,
    title: '🔔 টেস্ট অর্ডার অ্যালার্ট (টেলিকম সেবা)',
    message: 'অভিনন্দন! এখন থেকে ওয়েবসাইটে নতুন কোনো অর্ডার এলে ঠিক এভাবেই আপনার ফোনে সাথে সাথে নোটিফিকেশন আসবে।',
    clickUrl: getSafePortalUrl(),
  });
}

export async function testTelegramAlert(
  botToken: string,
  chatId: string
): Promise<{ ok: boolean; error?: string }> {
  const portalUrl = getSafePortalUrl();
  return sendTelegramNotification({
    botToken,
    chatId,
    text: `🔔 টেস্ট অর্ডার অ্যালার্ট (টেলিকম সেবা)\n\nঅভিনন্দন! আপনার টেলিগ্রাম অ্যালার্ট সফলভাবে যুক্ত হয়েছে। নতুন অর্ডার এলে সাথে সাথেই এখানে মেসেজ পাবেন।${portalUrl ? `\n\nপোর্টাল: ${portalUrl}` : ''}`,
  });
}
