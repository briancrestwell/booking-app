/**
 * mock-bridge.ts
 *
 * Lightweight localStorage-based IPC channel between the two Next.js
 * browser tabs (web app on :3000, admin app on :3002).
 *
 * Because both apps run on DIFFERENT origins in dev, the standard
 * `window.storage` event does NOT fire cross-origin. Instead we use a
 * shared BroadcastChannel (same-browser, cross-origin support since
 * Chrome 54 / Safari 15.4 / Firefox 38) with a localStorage fallback.
 *
 * Message shape:
 *   { type: 'ORDER_NEW' | 'ORDER_STATUS' | 'PAYMENT_COMPLETED' | 'MENU_UPDATED'
 *           | 'TABLE_STATUS' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'
 *     payload: unknown
 *     ts: number   (timestamp — avoids processing old messages on re-mount)
 *   }
 *
 * Usage:
 *   // emit (any app):
 *   MockBridge.emit('ORDER_NEW', { ...orderPayload });
 *
 *   // subscribe (any app):
 *   const off = MockBridge.on('ORDER_NEW', (payload) => { ... });
 *   // call off() to unsubscribe
 */

export type BridgeEvent =
  | 'ORDER_NEW'
  | 'ORDER_STATUS'
  | 'PAYMENT_COMPLETED'
  | 'MENU_UPDATED'
  | 'TABLE_STATUS'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED';

interface BridgeMessage {
  type:    BridgeEvent;
  payload: unknown;
  ts:      number;
}

type BridgeHandler = (payload: unknown) => void;

const CHANNEL_NAME = 'mock-bridge-v1';
const LS_KEY       = 'mock-bridge-last';

// ── Singleton channel ─────────────────────────────────────────────────────────
let _channel: BroadcastChannel | null = null;
const _handlers = new Map<BridgeEvent, Set<BridgeHandler>>();

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!_channel) {
    try {
      _channel = new BroadcastChannel(CHANNEL_NAME);
      _channel.onmessage = (ev) => _dispatch(ev.data as BridgeMessage);
    } catch {
      // BroadcastChannel not available — fall back to localStorage polling
    }
  }
  return _channel;
}

function _dispatch(msg: BridgeMessage) {
  if (!msg?.type) return;
  _handlers.get(msg.type)?.forEach((fn) => fn(msg.payload));
}

// ── Public API ────────────────────────────────────────────────────────────────
export const MockBridge = {
  /**
   * Emit an event to all subscribers in ALL tabs (cross-origin via BroadcastChannel).
   * Also fires within the current tab for in-process subscribers.
   */
  emit(type: BridgeEvent, payload: unknown) {
    const msg: BridgeMessage = { type, payload, ts: Date.now() };
    // 1. Local in-process dispatch
    _dispatch(msg);
    // 2. Cross-tab / cross-origin via BroadcastChannel
    getChannel()?.postMessage(msg);
    // 3. localStorage fallback for browsers without BroadcastChannel
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(msg));
    } catch { /* ignore quota errors */ }
  },

  /**
   * Subscribe to an event type. Returns an unsubscribe function.
   */
  on(type: BridgeEvent, handler: BridgeHandler): () => void {
    // Ensure channel is initialised so onmessage is wired
    getChannel();
    if (!_handlers.has(type)) _handlers.set(type, new Set());
    _handlers.get(type)!.add(handler);
    return () => _handlers.get(type)?.delete(handler);
  },
};
