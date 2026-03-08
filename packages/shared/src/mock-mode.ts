/**
 * mock-mode.ts — Runtime mock-mode toggle.
 *
 * There is NO module-level IS_MOCK constant here.
 * The source of truth is always localStorage, read fresh on every call.
 *
 * Priority order:
 *   1. localStorage key "mock_mode_override" === 'false'  → LIVE  (user explicitly turned off)
 *   2. localStorage key "mock_mode_override" === 'true'   → MOCK  (user explicitly turned on)
 *   3. No localStorage key                                → read NEXT_PUBLIC_MOCK_MODE env var
 *
 * This means localStorage ALWAYS beats the build-time env var.
 */

const LS_KEY = 'mock_mode_override';

/** Read current mock mode — always fresh from localStorage. */
export function getMockMode(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  }
  const override = localStorage.getItem(LS_KEY);
  if (override === 'true')  return true;
  if (override === 'false') return false;
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

/**
 * Toggle mock mode and do a hard reload.
 * Always writes an explicit value so user intent overrides the build-time env var.
 */
export function setMockMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, String(enabled));
  window.location.assign(window.location.href);
}

/**
 * IS_MOCK — evaluated once when the module is first imported (client-side).
 * Reads localStorage directly so it respects user overrides set before page load.
 *
 * NOTE: This is intentionally NOT a `const` computed at bundle time.
 * Importing this value gives the state at the time the module was first loaded
 * (i.e., after the page reload triggered by setMockMode).
 */
export const IS_MOCK: boolean = getMockMode();
