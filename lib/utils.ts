import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, addMinutes } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, "hh:mm a");
}

export function getEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const end = addMinutes(date, durationMinutes);
  return format(end, "HH:mm");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, d MMMM yyyy");
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy");
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function minutesToHM(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function statusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "CANCELLED":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    default:
      return "text-violet-400 bg-violet-400/10 border-violet-400/20";
  }
}
