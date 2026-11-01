import { LRUCache } from "lru-cache";
import { RateLimitError } from "./api-error-handler";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

// Rate limit storage
const rateLimitStore = new LRUCache<string, { count: number; resetTime: number }>({
  max: 1000,
  ttl: 60000 // 1 minute TTL
});

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async check(key: string): Promise<void> {
    const now = Date.now();
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      throw new RateLimitError(
        `Too many requests. Try again in ${resetIn} seconds.`
      );
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);
  }

  async checkByIP(ip: string): Promise<void> {
    return this.check(`ip:${ip}`);
  }

  async checkByUser(userId: string): Promise<void> {
    return this.check(`user:${userId}`);
  }

  async checkByEmail(email: string): Promise<void> {
    return this.check(`email:${email.toLowerCase()}`);
  }

  async checkByEndpoint(endpoint: string, identifier: string): Promise<void> {
    return this.check(`${endpoint}:${identifier}`);
  }

  reset(key: string): void {
    rateLimitStore.delete(key);
  }

  getRemaining(key: string): number {
    const entry = rateLimitStore.get(key);
    if (!entry) return this.config.maxRequests;
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  getResetTime(key: string): number | null {
    const entry = rateLimitStore.get(key);
    return entry ? entry.resetTime : null;
  }
}

// Pre-configured rate limiters for different use cases
export const authRateLimiter = new RateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5 // 5 auth attempts per 15 minutes
});

export const generalRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60 // 60 requests per minute
});

export const strictRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10 // 10 requests per minute
});

export const writeOperationRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 20 // 20 write operations per minute
});

// Middleware function for Next.js API routes
export function withRateLimit(
  rateLimiter: RateLimiter,
  getKey: (request: Request) => string
) {
  return async (request: Request) => {
    const key = getKey(request);
    await rateLimiter.check(key);
  };
}

// Utility to get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}
