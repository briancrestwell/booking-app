'use client';
/**
 * useAuditLog
 *
 * Convenience hook that binds the current authenticated user as the actor,
 * so callers only need to provide category/action/label/target fields.
 *
 * Usage:
 *   const { log } = useAuditLog();
 *   log({ category: 'TABLE', action: 'STATUS_CHANGED', label: 'Bàn 3 → OCCUPIED',
 *         targetId: 'table-003', targetType: 'Table', outcome: 'SUCCESS' });
 */
import { useCallback } from 'react';
import { useAuditLogStore, type AuditInput } from '@/store/audit-log.store';
import { useAuthStore } from '@/store/auth.store';

type LogInput = Omit<AuditInput, 'actorId' | 'actorName' | 'actorRole'>;
export type { LogInput };

export function useAuditLog() {
  const logRaw  = useAuditLogStore((s) => s.log);
  const user    = useAuthStore((s) => s.user);

  const log = useCallback(
    (input: LogInput) => {
      logRaw({
        ...input,
        actorId:   user?.id   ?? 'anonymous',
        actorName: user?.name ?? 'Không rõ',
        actorRole: user?.role ?? 'STAFF',
      });
    },
    [logRaw, user],
  );

  return { log };
}
