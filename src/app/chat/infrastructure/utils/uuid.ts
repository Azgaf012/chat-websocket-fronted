/**
 * UUID v4 generator. Prefers `crypto.randomUUID` (available in modern browsers)
 * and falls back to a manual implementation otherwise.
 */
export function uuidv4(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  // Fallback (RFC4122 v4 via Math.random — adequate for client-side correlation only).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
