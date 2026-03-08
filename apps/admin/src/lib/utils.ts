import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(satang: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(satang / 100);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Decode a JWT payload without verifying the signature (client-side only).
 *  Handles both standard base64url (ASCII) and UTF-8-encoded payloads
 *  produced by TextEncoder (our mock JWT generator).
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, part] = token.split('.');
    // Restore base64 padding and swap base64url chars back to standard base64
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice((b64.length % 4) || 4);

    // Decode to binary string via atob, then re-interpret as UTF-8 bytes
    const binary = atob(padded);
    const bytes  = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json   = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Returns true if the JWT exp claim is still in the future. */
export function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}
