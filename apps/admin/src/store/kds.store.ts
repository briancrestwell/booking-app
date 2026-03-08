import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KitchenOrderStatus, KitchenStation } from '@/mock/seed';

export type KdsFilterView = 'ALL' | KitchenOrderStatus | KitchenStation;

interface KdsStore {
  // ── Filters ──────────────────────────────────────────────────────────────
  statusFilter:  KitchenOrderStatus | 'ALL';
  stationFilter: KitchenStation | 'ALL';
  setStatusFilter:  (f: KitchenOrderStatus | 'ALL') => void;
  setStationFilter: (f: KitchenStation | 'ALL')     => void;

  // ── New-order highlight tracking ─────────────────────────────────────────
  flashingIds:  Set<string>;
  markFlashing: (id: string) => void;
  clearFlash:   (id: string) => void;

  // ── Notification prefs (all persisted to localStorage) ───────────────────
  soundEnabled:   boolean;
  vibrateEnabled: boolean;
  bannerEnabled:  boolean;  // controls whether toast banners are shown app-wide
  notifyOrderNew:     boolean; // fire notification on new order events
  notifyOrderReady:   boolean; // fire notification on ready-to-serve events
  notifyCheckout:     boolean; // fire notification on checkout request events
  notifySystemAlert:  boolean; // fire notification on system/audit alert events

  toggleSound:            () => void;
  toggleVibrate:          () => void;
  toggleBanner:           () => void;
  toggleNotifyOrderNew:   () => void;
  toggleNotifyOrderReady: () => void;
  toggleNotifyCheckout:   () => void;
  toggleNotifySystemAlert:() => void;
}

export const useKdsStore = create<KdsStore>()(
  persist(
    (set) => ({
      statusFilter:  'ALL',
      stationFilter: 'ALL',
      setStatusFilter:  (f) => set({ statusFilter: f }),
      setStationFilter: (f) => set({ stationFilter: f }),

      flashingIds:  new Set<string>(),
      markFlashing: (id) =>
        set((s) => ({ flashingIds: new Set([...s.flashingIds, id]) })),
      clearFlash: (id) =>
        set((s) => {
          const next = new Set(s.flashingIds);
          next.delete(id);
          return { flashingIds: next };
        }),

      // Default: everything ON
      soundEnabled:       true,
      vibrateEnabled:     true,
      bannerEnabled:      true,
      notifyOrderNew:     true,
      notifyOrderReady:   true,
      notifyCheckout:     true,
      notifySystemAlert:  true,

      toggleSound:              () => set((s) => ({ soundEnabled:        !s.soundEnabled })),
      toggleVibrate:            () => set((s) => ({ vibrateEnabled:      !s.vibrateEnabled })),
      toggleBanner:             () => set((s) => ({ bannerEnabled:       !s.bannerEnabled })),
      toggleNotifyOrderNew:     () => set((s) => ({ notifyOrderNew:      !s.notifyOrderNew })),
      toggleNotifyOrderReady:   () => set((s) => ({ notifyOrderReady:    !s.notifyOrderReady })),
      toggleNotifyCheckout:     () => set((s) => ({ notifyCheckout:      !s.notifyCheckout })),
      toggleNotifySystemAlert:  () => set((s) => ({ notifySystemAlert:   !s.notifySystemAlert })),
    }),
    {
      name: 'kds-prefs',
      // Don't persist runtime-only Sets (not serialisable by default)
      partialize: (s) => ({
        soundEnabled:       s.soundEnabled,
        vibrateEnabled:     s.vibrateEnabled,
        bannerEnabled:      s.bannerEnabled,
        notifyOrderNew:     s.notifyOrderNew,
        notifyOrderReady:   s.notifyOrderReady,
        notifyCheckout:     s.notifyCheckout,
        notifySystemAlert:  s.notifySystemAlert,
        statusFilter:       s.statusFilter,
        stationFilter:      s.stationFilter,
      }),
    },
  ),
);
