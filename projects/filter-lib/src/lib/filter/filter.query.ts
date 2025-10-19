// projects/filter-lib/src/lib/filter/filter.query.ts
/**
 * Utilities for safely parsing and stringify values for query params.
 * - safeParse: attempts JSON.parse, falls back to primitive conversion.
 * - safeStringify: stringifies objects/arrays; returns null if not serializable.
 */

export function safeParse(raw: any): any {
  if (raw === null || raw === undefined) return null;

  // If it's already an object (e.g., Angular Router might already parse arrays), return as-is
  if (typeof raw === 'object') return raw;

  if (typeof raw === 'string') {
    const s = raw.trim();
    // Try parse JSON (objects & arrays, numbers, booleans)
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    }
    // Try parse numbers and booleans
    if (s === 'true') return true;
    if (s === 'false') return false;
    const n = Number(s);
    if (!Number.isNaN(n) && s !== '') return n;
    // Otherwise return raw string
    return s;
  }

  // fallback
  return raw;
}

export function safeStringify(v: any): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}
