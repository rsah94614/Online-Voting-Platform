"use client";
// components/dashboard/CountdownTimer.tsx
import { useCountdown } from "@/hooks/useCountdown";

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  variant?: "live" | "upcoming";
}

export default function CountdownTimer({ targetDate, label, variant = "live" }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired, formatted } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></span>
        {variant === "live" ? "Voting ended" : "Started"}
      </div>
    );
  }

  const isLive = variant === "live";
  const color = isLive ? "text-emerald-400" : "text-amber-400";
  const dotColor = isLive ? "bg-emerald-400" : "bg-amber-400";
  const bgColor = isLive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20";

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse inline-block`}></span>
      {label && <span className={`text-xs font-mono ${color}`}>{label}</span>}
      <div className="flex items-center gap-1">
        {days > 0 && (
          <span className={`text-xs font-mono font-bold ${color}`}>{days}<span className="text-slate-500">d</span></span>
        )}
        <span className={`text-xs font-mono font-bold ${color}`}>{String(hours).padStart(2, "0")}<span className="text-slate-500">h</span></span>
        <span className={`text-xs font-mono font-bold ${color}`}>{String(minutes).padStart(2, "0")}<span className="text-slate-500">m</span></span>
        <span className={`text-xs font-mono font-bold ${color}`}>{String(seconds).padStart(2, "0")}<span className="text-slate-500">s</span></span>
      </div>
    </div>
  );
}
