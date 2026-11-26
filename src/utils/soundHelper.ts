/**
 * Web Audio API synthesizer + Mobile Vibration + Service Worker OS Notification helper
 */
let audioCtx: AudioContext | null = null;
let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg)
      .catch((err) => {
        console.warn('Service Worker registration skipped:', err);
        return null;
      });
  }
  return swRegistrationPromise;
}

export function triggerNotificationVibration(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate([220, 100, 220, 100, 320]);
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
}

/**
 * Plays a clear, crisp 3-note WhatsApp/order alert chime + vibrates phone.
 */
export function playNotificationSound(): void {
  triggerNotificationVibration();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const notes = [
      { freq: 659.25, start: 0, dur: 0.22, gain: 0.25 }, // E5
      { freq: 880.0, start: 0.14, dur: 0.25, gain: 0.28 }, // A5
      { freq: 1174.66, start: 0.28, dur: 0.55, gain: 0.3 }, // D6
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      gain.gain.setValueAtTime(note.gain, now + note.start);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    }
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
}

/**
 * Request desktop/mobile browser notification permissions and register SW
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    await registerNotificationServiceWorker();
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await sendBrowserNotification(
        'টেলিকম সেবা - অ্যালার্ট চালু হয়েছে!',
        'নতুন কোনো অর্ডার বা অ্যাড মানি রিকোয়েস্ট এলেই এখানে নোটিফিকেশন পাবেন।',
        'telecom-test-permission'
      );
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return false;
  }
}

/**
 * Triggers a real browser/Android OS notification via Service Worker (required on Android Chrome)
 * with graceful fallback to window.Notification.
 */
export async function sendBrowserNotification(
  title: string,
  body: string,
  tag?: string
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notifTag = tag || `telecom-order-${Date.now()}`;

  try {
    const reg = await registerNotificationServiceWorker();
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, {
        body,
        tag: notifTag,
        requireInteraction: true,
        data: { url: '/' },
      });
      return;
    }
  } catch (e) {
    console.warn('SW showNotification failed, falling back:', e);
  }

  try {
    new Notification(title, {
      body,
      tag: notifTag,
      silent: false,
    });
  } catch (e) {
    console.warn('Failed to send browser notification:', e);
  }
}
