// packages/shared entry point — ALL consumers import from '@booking/shared'

// Zod schemas (also usable as React Hook Form resolvers in apps/web)
export * from './schemas/booking.schema';
export * from './schemas/order.schema';
export * from './schemas/table.schema';
export * from './schemas/menu-item.schema';

// TypeScript types
export * from './types';
export * from './types/socket-payloads';

// Constants & enums
export * from './constants';

// TanStack Query key factory
export * from './query-keys';

// Mock bridge — cross-origin BroadcastChannel IPC for dev mock mode
export * from './mock-bridge';

// Runtime mock-mode toggle
export * from './mock-mode';
