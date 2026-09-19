/**
 * Caching and optimization utilities
 */

import { unstable_cache } from 'next/cache';

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  DEFAULT_TTL: 60 * 5, // 5 minutes
  SHORT_TTL: 60, // 1 minute
  LONG_TTL: 60 * 60, // 1 hour
  VERY_LONG_TTL: 60 * 60 * 24, // 1 day
} as const;

/**
 * Create a cached function with configurable TTL
 */
export function createCachedFunction<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyParts: string[],
  ttl: number = CACHE_CONFIG.DEFAULT_TTL
): T {
  return unstable_cache(fn, keyParts, {
    revalidate: ttl,
    tags: keyParts,
  }) as T;
}

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  CATALOG: {
    CITIES: (locale: string) => ['catalog', 'cities', locale],
    CATEGORIES: (locale: string) => ['catalog', 'categories', locale],
    SKILLS: (locale: string) => ['catalog', 'skills', locale],
    FACETS: (locale: string) => ['catalog', 'facets', locale],
  },
  JOBS: {
    SEARCH: (params: string) => ['jobs', 'search', params],
    DETAIL: (slug: string, locale: string) => ['jobs', 'detail', slug, locale],
    LIST_ORG: (orgId: string, locale: string) => ['jobs', 'org', orgId, locale],
  },
  USER: {
    PROFILE: (userId: string) => ['user', 'profile', userId],
    ROLES: (userId: string) => ['user', 'roles', userId],
  },
} as const;

/**
 * Invalidate cache by tags
 */
export async function invalidateCache(tags: string[]): Promise<void> {
  // Cache invalidation is handled by Next.js revalidation
  // This is a placeholder for future cache management
  return Promise.resolve();
}

/**
 * Simple in-memory cache for runtime data
 */
class RuntimeCache<T> {
  private cache = new Map<string, { data: T; expires: number }>();
  private ttl: number;

  constructor(ttl: number = CACHE_CONFIG.SHORT_TTL) {
    this.ttl = ttl;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl * 1000,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instances
export const shortCache = new RuntimeCache(CACHE_CONFIG.SHORT_TTL);
export const mediumCache = new RuntimeCache(CACHE_CONFIG.DEFAULT_TTL);
export const longCache = new RuntimeCache(CACHE_CONFIG.LONG_TTL);

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    shortCache.cleanup();
    mediumCache.cleanup();
    longCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Response caching headers
 */
export function getCacheHeaders(ttl: number = CACHE_CONFIG.DEFAULT_TTL): HeadersInit {
  return {
    'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
    'CDN-Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
  };
}

/**
 * Static page revalidation times
 */
export const REVALIDATION_TIMES = {
  HOMEPAGE: 60 * 5, // 5 minutes
  JOBS_LIST: 60, // 1 minute
  JOB_DETAIL: 60 * 5, // 5 minutes
  CATALOG: 60 * 60, // 1 hour
  USER_PROFILE: 60 * 2, // 2 minutes
} as const;