// Retry helper for Supabase / network calls.
// Only retries on transient/network failures, not on auth/validation errors.

export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onAttempt?: (attempt: number, error: unknown) => void;
};

const NETWORK_HINTS = [
  "failed to fetch",
  "networkerror",
  "network error",
  "load failed",
  "fetch failed",
  "timeout",
  "timed out",
  "ecconn",
  "socket",
  "connection",
];

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export function isRetryableError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === "object") {
    const anyErr = err as { status?: number; code?: string | number; message?: string; name?: string };
    if (typeof anyErr.status === "number" && RETRYABLE_STATUS.has(anyErr.status)) return true;
    if (anyErr.name === "AbortError") return false;
    if (anyErr.code === "PGRST301" || anyErr.code === "PGRST302") return false; // auth
    const msg = (anyErr.message ?? "").toLowerCase();
    if (NETWORK_HINTS.some((h) => msg.includes(h))) return true;
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return false;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Runs `fn` and retries with exponential backoff on transient errors.
 * `fn` may return a Supabase-like { error } object — when present and retryable,
 * the call is retried; otherwise the result is returned as-is.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 400;
  const max = opts.maxDelayMs ?? 3000;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      const supaError = (result as { error?: unknown } | null)?.error;
      if (supaError && isRetryableError(supaError) && attempt < retries) {
        lastError = supaError;
        opts.onAttempt?.(attempt + 1, supaError);
        await sleep(Math.min(max, base * 2 ** attempt));
        continue;
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableError(error)) throw error;
      opts.onAttempt?.(attempt + 1, error);
      await sleep(Math.min(max, base * 2 ** attempt));
    }
  }
  throw lastError ?? new Error("Falha após múltiplas tentativas.");
}
