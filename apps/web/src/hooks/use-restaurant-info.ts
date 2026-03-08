'use client';
import { useState, useEffect, useRef } from 'react';

export interface RestaurantInfo {
  name:         string;
  subtitle:     string;
  description:  string;
  phone:        string;
  address:      string;
  logoUrl:      string;
  coverUrl:     string;
  heroGradient: string;
  brandColor:   string;
  hours: {
    day:    string;
    open:   string;
    close:  string;
    closed: boolean;
  }[];
}

const DEFAULTS: RestaurantInfo = {
  name:         'BÁNH TRÁNG NHÍM',
  subtitle:     'Chùa Láng — Hà Nội',
  description:  'Thiên đường bánh tráng đặc trưng Hà Nội',
  phone:        '0912 345 678',
  address:      '123 Chùa Láng, Đống Đa, Hà Nội',
  logoUrl:      '',
  coverUrl:     '',
  heroGradient: 'from-amber-900 via-amber-700 to-amber-500',
  brandColor:   '#1B6FEB',
  hours: [
    { day: 'Thứ 2',    open: '10:00', close: '22:00', closed: false },
    { day: 'Thứ 3',    open: '10:00', close: '22:00', closed: false },
    { day: 'Thứ 4',    open: '10:00', close: '22:00', closed: false },
    { day: 'Thứ 5',    open: '10:00', close: '22:00', closed: false },
    { day: 'Thứ 6',    open: '10:00', close: '23:00', closed: false },
    { day: 'Thứ 7',    open: '09:00', close: '23:00', closed: false },
    { day: 'Chủ nhật', open: '09:00', close: '22:00', closed: false },
  ],
};

const STORAGE_KEY = 'restaurant-info';
const POLL_MS     = 3_000; // fallback poll interval for cross-origin dev environments

function readFromStorage(): RestaurantInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist wraps state under "state" key
    const state  = parsed?.state ?? parsed;
    if (!state?.info) return null;
    return { ...DEFAULTS, ...state.info } as RestaurantInfo;
  } catch {
    return null;
  }
}

/**
 * useRestaurantInfo
 *
 * Reads restaurant branding/info written by apps/admin via Zustand persist
 * (localStorage key "restaurant-info"). Keeps the web app in sync through
 * two mechanisms:
 *
 * 1. `storage` event  — fires instantly when admin and web share the same
 *    origin (production, same Nginx domain). Zero-latency.
 *
 * 2. Polling every 3 s — fallback for cross-origin dev environments
 *    (admin on :3002, web on :3000) where `storage` events do NOT fire
 *    across origins. The poll checks for a changed serialized value and
 *    only calls setState when the content actually differs.
 */
export function useRestaurantInfo(): RestaurantInfo {
  const [info, setInfo]   = useState<RestaurantInfo>(DEFAULTS);
  const lastRawRef        = useRef<string | null>(null);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw || raw === lastRawRef.current) return; // no change
        lastRawRef.current = raw;
        const next = readFromStorage();
        if (next) setInfo(next);
      } catch { /* ignore */ }
    }

    // Initial load
    load();

    // Mechanism 1: same-origin storage event (production / same-port dev)
    window.addEventListener('storage', load);

    // Mechanism 2: cross-origin polling fallback (dev: admin:3002 → web:3000)
    const pollId = setInterval(load, POLL_MS);

    return () => {
      window.removeEventListener('storage', load);
      clearInterval(pollId);
    };
  }, []);

  return info;
}
