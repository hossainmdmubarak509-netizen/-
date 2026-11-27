import React, { useEffect, useState } from 'react';
import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';

interface LiveClockWidgetProps {
  variant?: 'admin' | 'customer';
}

export const LiveClockWidget: React.FC<LiveClockWidgetProps> = ({
  variant = 'customer',
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const rawHours = now.getHours();
  const minutesNum = now.getMinutes();
  const secondsNum = now.getSeconds();

  const period = rawHours >= 12 ? 'PM' : 'AM';
  const hours12 = String(rawHours % 12 || 12).padStart(2, '0');
  const minutes = String(minutesNum).padStart(2, '0');
  const seconds = String(secondsNum).padStart(2, '0');

  // Smooth analog hand angles
  const secondAngle = secondsNum * 6;
  const minuteAngle = minutesNum * 6 + secondsNum * 0.1;
  const hourAngle = ((rawHours % 12) * 30) + minutesNum * 0.5;

  // Time-of-day greeting in Bengali
  const getTimeGreeting = (h: number) => {
    if (h >= 5 && h < 12) return { text: 'শুভ সকাল', Icon: Sunrise, color: 'text-amber-500' };
    if (h >= 12 && h < 16) return { text: 'শুভ দুপুর', Icon: Sun, color: 'text-amber-500' };
    if (h >= 16 && h < 19) return { text: 'শুভ বিকাল', Icon: Sunset, color: 'text-orange-500' };
    return { text: 'শুভ সন্ধ্যা / রাত', Icon: Moon, color: 'text-indigo-400' };
  };

  const greeting = getTimeGreeting(rawHours);
  const GreetingIcon = greeting.Icon;

  const weekdayBn = new Intl.DateTimeFormat('bn-BD', { weekday: 'long' }).format(now);
  const dateBn = new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const isAdmin = variant === 'admin';

  return (
    <div
      aria-label="রিয়েল টাইম ঘড়ি ও তারিখ"
      className={
        isAdmin
          ? 'mt-4 relative overflow-hidden rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/10 px-4 py-3 shadow-lg'
          : 'relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 px-4 py-3 shadow-sm'
      }
    >
      {/* Subtle decorative glow */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 w-36 h-36 rounded-full blur-2xl ${
          isAdmin ? 'bg-indigo-500/15' : 'bg-indigo-500/10'
        }`}
      />
      <div
        className={`pointer-events-none absolute -left-10 -bottom-10 w-32 h-32 rounded-full blur-2xl ${
          isAdmin ? 'bg-amber-500/10' : 'bg-emerald-500/10'
        }`}
      />

      <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Left: Live Analog SVG Dial + Greeting & Bengali Date */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Crisp SVG Analog Clock */}
          <div
            className={`relative w-12 h-12 rounded-full shrink-0 flex items-center justify-center shadow-inner ${
              isAdmin
                ? 'bg-slate-900 ring-1 ring-white/15'
                : 'bg-slate-900 ring-2 ring-indigo-100 shadow-sm'
            }`}
          >
            <svg viewBox="0 0 100 100" className="w-11 h-11">
              {/* Outer subtle dial ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
              />
              {/* 12 Hour Markers */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                const isMajor = i % 3 === 0;
                return (
                  <line
                    key={i}
                    x1="50"
                    y1={isMajor ? '9' : '11'}
                    x2="50"
                    y2={isMajor ? '16' : '15'}
                    stroke={isMajor ? '#fbbf24' : 'rgba(255,255,255,0.45)'}
                    strokeWidth={isMajor ? '2.6' : '1.5'}
                    strokeLinecap="round"
                    transform={`rotate(${angle} 50 50)`}
                  />
                );
              })}

              {/* Hour Hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="27"
                stroke="#ffffff"
                strokeWidth="3.6"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} 50 50)`}
              />

              {/* Minute Hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="18"
                stroke="#cbd5e1"
                strokeWidth="2.4"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle} 50 50)`}
              />

              {/* Second Hand */}
              <line
                x1="50"
                y1="58"
                x2="50"
                y2="15"
                stroke="#34d399"
                strokeWidth="1.6"
                strokeLinecap="round"
                transform={`rotate(${secondAngle} 50 50)`}
              />

              {/* Center Pin */}
              <circle cx="50" cy="50" r="3.4" fill="#fbbf24" />
              <circle cx="50" cy="50" r="1.4" fill="#0f172a" />
            </svg>
          </div>

          {/* Date & Greeting Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <GreetingIcon className={`w-3.5 h-3.5 shrink-0 ${greeting.color}`} />
              <span className={isAdmin ? 'text-slate-300' : 'text-slate-600'}>
                {greeting.text}
              </span>
              <span className={isAdmin ? 'text-slate-600' : 'text-slate-300'}>•</span>
              <span className={isAdmin ? 'text-emerald-400 font-bold' : 'text-indigo-600 font-bold'}>
                {weekdayBn}
              </span>
            </div>
            <p
              className={`text-xs sm:text-sm font-bold tracking-tight truncate mt-0.5 ${
                isAdmin ? 'text-white' : 'text-slate-900'
              }`}
            >
              {dateBn}
            </p>
          </div>
        </div>

        {/* Right: Segmented Modern Digital Time Readout */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <div
            className={`px-2.5 py-1.5 rounded-xl font-mono-nums text-base sm:text-lg font-extrabold tracking-tight shadow-2xs ${
              isAdmin
                ? 'bg-slate-800/90 text-white border border-white/10'
                : 'bg-slate-900 text-white'
            }`}
          >
            {hours12}
          </div>

          <span
            className={`font-mono-nums font-black text-base sm:text-lg leading-none animate-pulse ${
              isAdmin ? 'text-amber-400' : 'text-indigo-600'
            }`}
          >
            :
          </span>

          <div
            className={`px-2.5 py-1.5 rounded-xl font-mono-nums text-base sm:text-lg font-extrabold tracking-tight shadow-2xs ${
              isAdmin
                ? 'bg-slate-800/90 text-white border border-white/10'
                : 'bg-slate-900 text-white'
            }`}
          >
            {minutes}
          </div>

          <span
            className={`font-mono-nums font-black text-base sm:text-lg leading-none ${
              isAdmin ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            :
          </span>

          <div
            className={`px-2 py-1.5 rounded-xl font-mono-nums text-sm sm:text-base font-extrabold tracking-tight ${
              isAdmin
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {seconds}
          </div>

          <span
            className={`ml-0.5 px-2 py-1 rounded-lg font-mono-nums text-[10px] sm:text-[11px] font-extrabold tracking-wider ${
              isAdmin
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {period}
          </span>
        </div>
      </div>
    </div>
  );
};
