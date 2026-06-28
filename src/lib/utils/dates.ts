import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCountdown(targetDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOver: boolean;
} {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isOver: false };
}
