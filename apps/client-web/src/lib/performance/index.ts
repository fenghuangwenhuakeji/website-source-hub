/**
 * Performance Optimization Module
 * 性能优化模块 - 提供性能监控、缓存、防抖节流等功能
 */

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  lastUpdate: number;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

class PerformanceManager {
  private static instance: PerformanceManager;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private rafCallbacks: Map<string, number> = new Map();

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  measureRender(componentName: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const end = performance.now();
    const existing = this.metrics.get(componentName);
    this.metrics.set(componentName, {
      renderTime: end - start,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      componentCount: (existing?.componentCount || 0) + 1,
      lastUpdate: Date.now(),
    });
  }

  async measureAsync<T>(componentName: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const existing = this.metrics.get(componentName);
    this.metrics.set(componentName, {
      renderTime: end - start,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      componentCount: (existing?.componentCount || 0) + 1,
      lastUpdate: Date.now(),
    });
    return result;
  }

  getMetrics(componentName?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (componentName) {
      return this.metrics.get(componentName) || { renderTime: 0, memoryUsage: 0, componentCount: 0, lastUpdate: 0 };
    }
    return this.metrics;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  scheduleRaf(id: string, callback: FrameRequestCallback): void {
    if (this.rafCallbacks.has(id)) {
      cancelAnimationFrame(this.rafCallbacks.get(id)!);
    }
    this.rafCallbacks.set(id, requestAnimationFrame(callback));
  }

  cancelRaf(id: string): void {
    if (this.rafCallbacks.has(id)) {
      cancelAnimationFrame(this.rafCallbacks.get(id)!);
      this.rafCallbacks.delete(id);
    }
  }

  observePerformance(entryTypes: string[], callback: (entry: PerformanceEntry) => void): () => void {
    const id = `observer-${Date.now()}-${Math.random()}`;
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ entryTypes });
      this.observers.set(id, observer);
      return () => {
        observer.disconnect();
        this.observers.delete(id);
      };
    } catch {
      return () => {};
    }
  }
}

class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttl?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    });
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; totalHits: number; avgAge: number } {
    let totalHits = 0;
    let totalAge = 0;
    const now = Date.now();
    
    this.cache.forEach((entry) => {
      totalHits += entry.hits;
      totalAge += now - entry.timestamp;
    });
    
    return {
      size: this.cache.size,
      totalHits,
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
    };
  }
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T> | undefined;
  let lastCallTime = 0;

  const { leading = false, trailing = true, maxWait } = options;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;

  function invokeFunc(): void {
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  }

  function startTimer(): void {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (trailing) invokeFunc();
      timeoutId = null;
    }, wait);
  }

  function startMaxTimer(): void {
    if (maxTimeoutId) clearTimeout(maxTimeoutId);
    maxTimeoutId = setTimeout(() => {
      invokeFunc();
      maxTimeoutId = null;
    }, maxWait!);
  }

  return function (this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    const shouldCallLeading = leading && !timeoutId;
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = now;

    if (shouldCallLeading) {
      invokeFunc();
    }

    startTimer();

    if (maxWait && !maxTimeoutId) {
      startMaxTimer();
    }
  };
}

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: ThrottleOptions = {}
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  const { leading = true, trailing = true } = options;

  return function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      if (leading) {
        func.apply(this, args);
      } else {
        lastArgs = args;
        lastThis = this;
      }
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastArgs) {
          func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else {
      lastArgs = args;
      lastThis = this;
    }
  };
}

function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

function batchUpdates<T>(items: T[], batchSize: number, processor: (batch: T[]) => Promise<void>): Promise<void> {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        await processor(batch);
      } catch (error) {
        reject(error);
        return;
      }
    }
    resolve();
  });
}

function createVirtualList<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 3
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
} {
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  
  return {
    visibleItems: items,
    startIndex: 0,
    endIndex: Math.min(items.length, visibleCount + overscan * 2),
    offsetY: 0,
    totalHeight,
  };
}

function lazyLoad<T>(importFn: () => Promise<{ default: T }>): () => Promise<T> {
  let cached: T | null = null;
  
  return async (): Promise<T> => {
    if (cached) return cached;
    
    const module = await importFn();
    cached = module.default;
    return cached;
  };
}

const globalCache = new LRUCache<string, any>(500, 10 * 60 * 1000);
const performanceManager = PerformanceManager.getInstance();

export {
  PerformanceManager,
  LRUCache,
  debounce,
  throttle,
  memoize,
  batchUpdates,
  createVirtualList,
  lazyLoad,
  globalCache,
  performanceManager,
};

export default {
  PerformanceManager,
  LRUCache,
  debounce,
  throttle,
  memoize,
  batchUpdates,
  createVirtualList,
  lazyLoad,
  globalCache,
  performanceManager,
};
