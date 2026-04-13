import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse price strings like "1.200.000" or "1200000" to integer đồng */
export function parseVndPrice(input: string): number {
  const digits = String(input || '').replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatVnd(amount: number): string {
  return Math.round(amount).toLocaleString('vi-VN');
}
