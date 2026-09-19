import type { PostgrestError } from "@supabase/supabase-js";

export class DataError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DataError";
  }
}

export function throwIfError(error: PostgrestError | null, fallback = "query_failed"): void {
  if (!error) return;
  throw new DataError(error.message, error.code || fallback, error);
}

export function requireRow<T>(data: T | null, error: PostgrestError | null, missing = "not_found"): T {
  throwIfError(error);
  if (data == null) throw new DataError("not found", missing);
  return data;
}
