import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBalance(balance: string, decimals: number = 18): string {
  const value = BigInt(balance) / BigInt(10 ** decimals);
  return value.toString();
}

export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function formatHash(hash: string, chars: number = 8): string {
  if (!hash) return '';
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
