// hooks/useCountdown.ts
"use client";
import { useState, useEffect } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(targetDate: string | null): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculate(targetDate));

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      setTimeLeft(calculate(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calculate(targetDate: string | null): CountdownResult {
  const expired: CountdownResult = { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: "Expired" };
  if (!targetDate) return expired;

  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return expired;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  let formatted = "";
  if (days > 0) formatted += `${days}d `;
  if (hours > 0 || days > 0) formatted += `${hours}h `;
  formatted += `${minutes}m ${seconds}s`;

  return { days, hours, minutes, seconds, isExpired: false, formatted: formatted.trim() };
}
