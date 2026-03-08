/**
 * audit-log.store.ts
 *
 * Client-side audit trail persisted to localStorage.
 * Captures every significant staff action with timestamp, actor, target, and
 * outcome. Max 500 entries — oldest entries are dropped when the limit is hit.
 *
 * Design notes:
 *  - Intentionally client-side only (mock mode). In production you would
 *    POST each entry to a backend /audit endpoint and store in PostgreSQL.
 *  - Each entry is immutable once written. No update/delete API exposed.
 *  - The store is consumed by /audit page and can be exported as CSV.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── Action categories ─────────────────────────────────────────────────────────
export type AuditCategory =
  | 'AUTH'
  | 'TABLE'
  | 'ORDER'
  | 'PAYMENT'
  | 'MENU'
  | 'RESTAURANT'
  | 'KDS'
  | 'SYSTEM';

export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export interface AuditEntry {
  id:         string;            // nanoid-style unique ID
  timestamp:  string;            // ISO 8601
  category:   AuditCategory;
  action:     string;            // e.g. "TABLE_STATUS_CHANGED"
  label:      string;            // human-readable, e.g. "Bàn 3 → OCCUPIED"
  outcome:    AuditOutcome;
  actorId:    string;            // user id
  actorName:  string;            // display name
  actorRole:  string;
  targetId?:  string;            // e.g. tableId, orderId, menuItemId
  targetType?:string;            // e.g. "Table", "Order", "MenuItem"
  meta?:      Record<string, unknown>; // extra structured data
}

// ── Input shape (caller only provides meaningful fields) ─────────────────────
export type AuditInput = Omit<AuditEntry, 'id' | 'timestamp'>;

const MAX_ENTRIES = 500;

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Store ─────────────────────────────────────────────────────────────────────
interface AuditLogStore {
  entries: AuditEntry[];
  /** Write a new audit entry */
  log: (input: AuditInput) => void;
  /** Clear all entries (admin only) */
  clear: () => void;
}

export const useAuditLogStore = create<AuditLogStore>()(
  persist(
    (set) => ({
      entries: [],

      log: (input) =>
        set((state) => {
          const entry: AuditEntry = {
            ...input,
            id:        makeId(),
            timestamp: new Date().toISOString(),
          };
          // Prepend so newest is first; trim to MAX_ENTRIES
          const updated = [entry, ...state.entries];
          return { entries: updated.length > MAX_ENTRIES ? updated.slice(0, MAX_ENTRIES) : updated };
        }),

      clear: () => set({ entries: [] }),
    }),
    {
      name:    'admin-audit-log',
      storage: createJSONStorage(() => localStorage),
      // Limit storage footprint: persist only last 200 entries across sessions
      partialize: (state) => ({ entries: state.entries.slice(0, 200) }),
    },
  ),
);
