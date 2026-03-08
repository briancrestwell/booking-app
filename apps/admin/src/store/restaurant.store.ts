/**
 * restaurant.store.ts
 * Zustand store (persisted to localStorage) for restaurant branding info.
 * Key "restaurant-info" is shared: admin writes, web reads.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMockMode } from '@booking/shared';

export interface OpeningHour {
  day:   string;  // e.g. "Thứ 2"
  open:  string;  // e.g. "08:00"
  close: string;  // e.g. "22:00"
  closed: boolean;
}

export interface RestaurantInfo {
  name:         string;
  subtitle:     string;   // address / slogan below hero
  description:  string;
  phone:        string;
  address:      string;
  logoUrl:      string;
  coverUrl:     string;   // hero background image URL (leave empty = gradient)
  heroGradient: string;   // tailwind gradient classes when no coverUrl
  brandColor:   string;   // hex for primary accent
  hours:        OpeningHour[];
}

interface RestaurantStore {
  info: RestaurantInfo;
  update: (partial: Partial<RestaurantInfo>) => void;
  updateHour: (index: number, hour: Partial<OpeningHour>) => void;
  reset: () => void;
}

const DEFAULT_HOURS: OpeningHour[] = [
  { day: 'Thứ 2',    open: '10:00', close: '22:00', closed: false },
  { day: 'Thứ 3',    open: '10:00', close: '22:00', closed: false },
  { day: 'Thứ 4',    open: '10:00', close: '22:00', closed: false },
  { day: 'Thứ 5',    open: '10:00', close: '22:00', closed: false },
  { day: 'Thứ 6',    open: '10:00', close: '23:00', closed: false },
  { day: 'Thứ 7',    open: '09:00', close: '23:00', closed: false },
  { day: 'Chủ nhật', open: '09:00', close: '22:00', closed: false },
];

// Used only in Demo/Mock mode as sample data
export const MOCK_RESTAURANT: RestaurantInfo = {
  name:         'BÁNH TRÁNG NHÍM',
  subtitle:     'Chùa Láng — Hà Nội',
  description:  'Thiên đường bánh tráng đặc trưng Hà Nội',
  phone:        '0912 345 678',
  address:      '123 Chùa Láng, Đống Đa, Hà Nội',
  logoUrl:      '',
  coverUrl:     '',
  heroGradient: 'from-amber-900 via-amber-700 to-amber-500',
  brandColor:   '#1B6FEB',
  hours:        DEFAULT_HOURS,
};

// Blank slate for first-time Live mode setup
export const EMPTY_RESTAURANT: RestaurantInfo = {
  name:         '',
  subtitle:     '',
  description:  '',
  phone:        '',
  address:      '',
  logoUrl:      '',
  coverUrl:     '',
  heroGradient: 'from-slate-800 via-slate-700 to-slate-600',
  brandColor:   '#1B6FEB',
  hours:        DEFAULT_HOURS,
};

// Keep DEFAULT_RESTAURANT as alias so other files importing it still work
export const DEFAULT_RESTAURANT = MOCK_RESTAURANT;

export const useRestaurantStore = create<RestaurantStore>()(
  persist(
    (set) => ({
      info: getMockMode() ? MOCK_RESTAURANT : EMPTY_RESTAURANT,
      update: (partial) =>
        set((s) => ({ info: { ...s.info, ...partial } })),
      updateHour: (index, hour) =>
        set((s) => {
          const hours = s.info.hours.map((h, i) =>
            i === index ? { ...h, ...hour } : h,
          );
          return { info: { ...s.info, hours } };
        }),
      reset: () => set({ info: getMockMode() ? MOCK_RESTAURANT : EMPTY_RESTAURANT }),
    }),
    {
      name: 'restaurant-info', // same key used by web app
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // If switching from Mock → Live: clear mock restaurant name
        if (!getMockMode() && state.info.name === MOCK_RESTAURANT.name) {
          state.info = EMPTY_RESTAURANT;
        }
      },
    },
  ),
);
