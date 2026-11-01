import { logger } from "./logger";

interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number = 1000;
  private slowOperationThreshold: number = 1000; // 1 second

  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    let result: T;

    try {
      result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration, success, metadata);
      
      // Log performance data
      logger.info(`Operation completed: ${operation}`, {
        duration,
        success,
        metadata
      });

      // Warn about slow operations
      if (duration > this.slowOperationThreshold) {
        logger.warn(`Slow operation detected: ${operation}`, {
          duration,
          threshold: this.slowOperationThreshold,
          metadata
        });
      }
    }
  }

  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = Date.now();
    let success = true;
    let result: T;

    try {
      result = fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration, success, metadata);
      
      logger.info(`Operation completed: ${operation}`, {
        duration,
        success,
        metadata
      });

      if (duration > this.slowOperationThreshold) {
        logger.warn(`Slow operation detected: ${operation}`, {
          duration,
          threshold: this.slowOperationThreshold,
          metadata
        });
      }
    }
  }

  private recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) {
      return 0;
    }

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  getSuccessRate(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) {
      return 0;
    }

    const successful = operationMetrics.filter(m => m.success).length;
    return (successful / operationMetrics.length) * 100;
  }

  getSlowOperations(threshold?: number): PerformanceMetrics[] {
    const slowThreshold = threshold || this.slowOperationThreshold;
    return this.metrics.filter(m => m.duration > slowThreshold);
  }

  getPercentile(operation: string, percentile: number): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) {
      return 0;
    }

    const sorted = [...operationMetrics].sort((a, b) => a.duration - b.duration);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index]?.duration || 0;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getSummary(): Record<string, any> {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    const summary: Record<string, any> = {};

    for (const operation of operations) {
      summary[operation] = {
        averageDuration: this.getAverageDuration(operation),
        successRate: this.getSuccessRate(operation),
        p50: this.getPercentile(operation, 50),
        p95: this.getPercentile(operation, 95),
        p99: this.getPercentile(operation, 99),
        totalCalls: this.getMetrics(operation).length
      };
    }

    return summary;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience function to measure async operations
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.measure(operation, fn, metadata);
}

// Convenience function to measure sync operations
export function measurePerformanceSync<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  return performanceMonitor.measureSync(operation, fn, metadata);
}

// Decorator for class methods (TypeScript)
export function MeasurePerformance(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const opName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(opName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
