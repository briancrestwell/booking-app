'use client';
/**
 * useAuditedMutation
 *
 * Thin wrapper around useMutation that automatically writes an audit entry
 * after each mutation settles. Keeps audit logic out of business hooks.
 *
 * Usage:
 *   const mut = useAuditedMutation({
 *     mutationFn: (id) => api.deleteItem(id),
 *     audit: (vars, data, error) => ({
 *       category: 'MENU', action: 'ITEM_DELETED',
 *       label: `Xóa món ${vars.name}`,
 *       targetId: vars.id, targetType: 'MenuItem',
 *       outcome: error ? 'FAILURE' : 'SUCCESS',
 *     }),
 *   });
 */
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useAuditLog, type LogInput } from './use-audit-log';

// Re-export for convenience
export type { LogInput };

type AuditFactory<TData, TError, TVariables> = (
  variables: TVariables,
  data:      TData | undefined,
  error:     TError | null,
) => LogInput;

interface AuditedMutationOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  audit: AuditFactory<TData, TError, TVariables>;
}

export function useAuditedMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>({
  audit,
  onSuccess,
  onError,
  onSettled,
  ...options
}: AuditedMutationOptions<TData, TError, TVariables, TContext>) {
  const { log } = useAuditLog();

  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    onSuccess: (data, variables, ctx) => {
      log({ ...audit(variables, data, null), outcome: 'SUCCESS' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onSuccess as any)?.(data, variables, ctx);
    },
    onError: (error, variables, ctx) => {
      log({ ...audit(variables, undefined, error), outcome: 'FAILURE' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (onError as any)?.(error, variables, ctx);
    },
    onSettled,
  });
}
