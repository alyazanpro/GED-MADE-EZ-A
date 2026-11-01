import { LRUCache } from "lru-cache";

interface CacheOptions {
  max?: number;
  ttl?: number; // Time to live in milliseconds
  updateAgeOnGet?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  private caches: Map<string, LRUCache<string, CacheEntry<unknown>>> = new Map();
  private defaultOptions: CacheOptions = {
    max: 1000,
    ttl: 300000, // 5 minutes
    updateAgeOnGet: true
  };

  getCache<T>(name: string, options?: CacheOptions): LRUCache<string, CacheEntry<T>> {
    if (!this.caches.has(name)) {
      const max = options?.max ?? this.defaultOptions.max ?? 1000;
      const ttl = options?.ttl ?? this.defaultOptions.ttl ?? 300000;
      const cache = new LRUCache<string, CacheEntry<T>>({
        max,
        ttl,
        updateAgeOnGet: options?.updateAgeOnGet ?? this.defaultOptions.updateAgeOnGet,
        ttlAutopurge: true
      });
      this.caches.set(name, cache as LRUCache<string, CacheEntry<unknown>>);
    }
    return this.caches.get(name) as LRUCache<string, CacheEntry<T>>;
  }

  async get<T>(
    cacheName: string,
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cache = this.getCache<T>(cacheName, options);
    const entry = cache.get(key);

    if (entry) {
      return entry.data as T;
    }

    const data = await fetcher();
    cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  set<T>(cacheName: string, key: string, data: T, options?: CacheOptions): void {
    const cache = this.getCache<T>(cacheName, options);
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  delete(cacheName: string, key: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.delete(key);
    }
  }

  clear(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.clear();
    }
  }

  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
  }

  getStats(cacheName: string) {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      return null;
    }

    return {
      size: cache.size,
      maxSize: cache.max,
      calculatedSize: cache.calculatedSize
    };
  }

  getAllStats() {
    const stats: Record<string, { size: number; maxSize: number; calculatedSize: number }> = {};
    this.caches.forEach((cache, name) => {
      stats[name] = {
        size: cache.size,
        maxSize: cache.max,
        calculatedSize: cache.calculatedSize
      };
    });
    return stats;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Convenience functions for common caching scenarios
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  return cacheManager.get("default", key, fetcher, options);
}

export function setCached<T>(key: string, data: T, options?: CacheOptions): void {
  cacheManager.set("default", key, data, options);
}

export function deleteCached(key: string): void {
  cacheManager.delete("default", key);
}

export function clearCache(): void {
  cacheManager.clear("default");
}

// Specific cache configurations
export const cacheConfig = {
  // User data cache (5 minutes)
  user: {
    max: 500,
    ttl: 300000
  },
  // Class data cache (10 minutes)
  class: {
    max: 200,
    ttl: 600000
  },
  // Curriculum data cache (1 hour)
  curriculum: {
    max: 100,
    ttl: 3600000
  },
  // Session cache (15 minutes)
  session: {
    max: 1000,
    ttl: 900000
  }
} as const;

// Specific cache functions
export async function getCachedUser<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return cacheManager.get("user", key, fetcher, cacheConfig.user);
}

export async function getCachedClass<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return cacheManager.get("class", key, fetcher, cacheConfig.class);
}

export async function getCachedCurriculum<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return cacheManager.get("curriculum", key, fetcher, cacheConfig.curriculum);
}

export async function getCachedSession<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return cacheManager.get("session", key, fetcher, cacheConfig.session);
}
