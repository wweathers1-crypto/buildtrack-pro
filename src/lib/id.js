/**
 * Generates an id, preferring the Web Crypto API where it's available
 * (all real browsers) and falling back where it isn't (CRA's default
 * Jest/jsdom test environment does not define `crypto`).
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
