/**
 * Enhanced error handling and debugging utilities
 */

import type { PostgrestError } from "@supabase/supabase-js";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public cause?: unknown,
    public field?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400, true, undefined, field);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, "AUTHZ_ERROR", 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, "RATE_LIMIT", 429);
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public cause?: PostgrestError) {
    super(message, "DATABASE_ERROR", 500, true, cause);
    this.name = "DatabaseError";
  }
}

/**
 * Enhanced error handler for Supabase errors
 */
export function handleSupabaseError(error: PostgrestError | null, fallback = "Operation failed"): never {
  if (!error) {
    throw new AppError(fallback, "UNKNOWN_ERROR");
  }

  // Map common Postgrest error codes to application errors
  const errorMap: Record<string, () => AppError> = {
    "23505": () => new ValidationError("Duplicate entry", "unique"),
    "23503": () => new ValidationError("Referenced entity not found", "foreign_key"),
    "23502": () => new ValidationError("Required field missing", "not_null"),
    "PGRST116": () => new NotFoundError("Resource"),
    "42501": () => new AuthorizationError("Row level security denied"),
  };

  const errorFactory = errorMap[error.code];
  if (errorFactory) {
    throw errorFactory();
  }

  throw new DatabaseError(error.message, error);
}

/**
 * Error response formatter for API responses
 */
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    const response: {
      error: {
        message: string;
        code: string;
        statusCode: number;
        field?: string;
      };
    } = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
    };
    
    if (error.field) {
      response.error.field = error.field;
    }
    
    return response;
  }

  if (error instanceof Error) {
    return {
      error: {
        message: error.message,
        code: "INTERNAL_ERROR",
        statusCode: 500,
      },
    };
  }

  return {
    error: {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      statusCode: 500,
    },
  };
}

/**
 * Logging utility for debugging
 */
export class Logger {
  private static isDevelopment = process.env.NODE_ENV === "development";

  static debug(message: string, meta?: unknown) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, meta || "");
    }
  }

  static info(message: string, meta?: unknown) {
    console.info(`[INFO] ${message}`, meta || "");
  }

  static warn(message: string, meta?: unknown) {
    console.warn(`[WARN] ${message}`, meta || "");
  }

  static error(message: string, error?: unknown) {
    console.error(`[ERROR] ${message}`, error || "");
  }

  static logApiCall(method: string, path: string, duration: number) {
    if (this.isDevelopment) {
      console.info(`[API] ${method} ${path} - ${duration}ms`);
    }
  }
}

/**
 * Performance monitoring wrapper
 */
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return fn().then((result) => {
    Logger.debug(`${operation} completed successfully`);
    return result;
  }).catch((error) => {
    Logger.error(`${operation} failed`, error);
    throw error;
  });
}

/**
 * Safe async handler wrapper
 */
export function asyncHandler<T>(
  fn: () => Promise<T>
): Promise<T> {
  return fn().catch((error) => {
    Logger.error("Async operation failed", error);
    throw error instanceof AppError ? error : new AppError(
      "An unexpected error occurred",
      "INTERNAL_ERROR"
    );
  });
}