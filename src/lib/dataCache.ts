/**
 * OSIRIS Data Cache Engine
 * 
 * Provides local caching with:
 * - localStorage persistence for offline support
 * - Per-provider refresh frequency configuration
 * - TTL-based cache invalidation
 * - Stale-while-revalidate pattern
 * - Automatic cache cleanup
 */

export interface CacheProvider {
  key: string;
  name: string;
  url: string;
  ttl: number; // Time to live in milliseconds
  refreshInterval: number; // Minimum time between fetches in ms
  enabled: boolean;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  etag?: string;
  provider: string;
}

// Default provider configurations
export const DEFAULT_PROVIDERS: CacheProvider[] = [
  { key: 'flights', name: 'Flight Radar', url: '/api/flights', ttl: 45000, refreshInterval: 30000, enabled: true, priority: 'critical' },
  { key: 'satellites', name: 'Satellites', url: '/api/satellites', ttl: 300000, refreshInterval: 300000, enabled: true, priority: 'high' },
  { key: 'cctv', name: 'CCTV Cameras', url: '/api/cctv?region=all', ttl: 600000, refreshInterval: 600000, enabled: false, priority: 'normal' },
  { key: 'earthquakes', name: 'Earthquakes', url: '/api/earthquakes', ttl: 900000, refreshInterval: 900000, enabled: true, priority: 'normal' },
  { key: 'news', name: 'News Feed', url: '/api/news', ttl: 1800000, refreshInterval: 1800000, enabled: true, priority: 'normal' },
  { key: 'markets', name: 'Markets', url: '/api/markets', ttl: 900000, refreshInterval: 900000, enabled: true, priority: 'high' },
  { key: 'fires', name: 'Active Fires', url: '/api/fires', ttl: 600000, refreshInterval: 600000, enabled: false, priority: 'low' },
  { key: 'maritime', name: 'Maritime', url: '/api/maritime', ttl: 600000, refreshInterval: 600000, enabled: false, priority: 'low' },
  { key: 'space_weather', name: 'Space Weather', url: '/api/space-weather', ttl: 1800000, refreshInterval: 1800000, enabled: false, priority: 'low' },
  { key: 'weather_events', name: 'Severe Weather', url: '/api/weather-events', ttl: 600000, refreshInterval: 600000, enabled: false, priority: 'low' },
  { key: 'infrastructure', name: 'Nuclear Facilities', url: '/api/infrastructure', ttl: Infinity, refreshInterval: Infinity, enabled: false, priority: 'low' },
  { key: 'gdelt', name: 'Global Incidents', url: '/api/gdelt', ttl: 900000, refreshInterval: 900000, enabled: false, priority: 'low' },
  { key: 'war_alerts', name: 'War Alerts', url: '/api/war-alerts', ttl: 300000, refreshInterval: 300000, enabled: false, priority: 'critical' },
];

const CACHE_KEY = 'osiris_data_cache_v1';
const PROVIDER_CONFIG_KEY = 'osiris_provider_config_v1';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit

class DataCacheEngine {
  private memory: Map<string, CacheEntry> = new Map();
  private lastFetch: Map<string, number> = new Map();
  private activeFetches: Map<string, Promise<any>> = new Map();
  private providers: Map<string, CacheProvider> = new Map();

  constructor() {
    this.loadProviderConfig();
    this.loadFromStorage();
    // Cleanup old entries periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000); // Every minute
    }
  }

  // Get provider configuration (merge defaults with user config)
  getProviders(): CacheProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Update provider configuration
  updateProvider(key: string, updates: Partial<CacheProvider>): void {
    const existing = this.providers.get(key);
    if (existing) {
      this.providers.set(key, { ...existing, ...updates });
      this.saveProviderConfig();
    }
  }

  // Enable/disable a provider
  setProviderEnabled(key: string, enabled: boolean): void {
    this.updateProvider(key, { enabled });
  }

  // Get cached data (may be stale)
  get<T = any>(key: string): CacheEntry<T> | null {
    // First check memory
    const memoryEntry = this.memory.get(key);
    if (memoryEntry) return memoryEntry;

    // Then check localStorage (if not loaded yet)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${CACHE_KEY}_${key}`);
        if (stored) {
          const entry = JSON.parse(stored) as CacheEntry<T>;
          this.memory.set(key, entry);
          return entry;
        }
      } catch {
        // localStorage access failed or invalid JSON
      }
    }
    return null;
  }

  // Check if data is fresh (not expired)
  isFresh(key: string): boolean {
    const entry = this.memory.get(key);
    if (!entry) return false;
    const provider = this.providers.get(key);
    if (!provider) return false;
    return Date.now() - entry.timestamp < provider.ttl;
  }

  // Check if we can fetch (respecting rate limits)
  canFetch(key: string): boolean {
    const provider = this.providers.get(key);
    if (!provider?.enabled) return false;
    
    const lastFetchTime = this.lastFetch.get(key) || 0;
    return Date.now() - lastFetchTime >= provider.refreshInterval;
  }

  // Fetch with caching (stale-while-revalidate pattern)
  async fetch<T = any>(
    key: string,
    options: {
      force?: boolean;
      transform?: (d: any) => T;
      onUpdate?: (d: T) => void;
    } = {}
  ): Promise<T | null> {
    const { force = false, transform, onUpdate } = options;
    const provider = this.providers.get(key);
    if (!provider) return null;

    // Return cached data immediately if available and fresh
    const cached = this.get<T>(key);
    if (!force && cached && this.isFresh(key)) {
      // Background refresh if stale but not critical
      if (!this.isFresh(key) && this.canFetch(key) && !this.activeFetches.has(key)) {
        this.backgroundFetch(key, transform, onUpdate);
      }
      return transform ? transform(cached.data) : cached.data;
    }

    // Check rate limiting
    if (!force && !this.canFetch(key)) {
      // Return stale data if available
      if (cached) {
        return transform ? transform(cached.data) : cached.data;
      }
      return null;
    }

    // Coalesce concurrent requests
    if (this.activeFetches.has(key)) {
      const data = await this.activeFetches.get(key);
      return transform ? transform(data) : data;
    }

    // Start new fetch
    const fetchPromise = this.performFetch<T>(key, provider.url, transform);
    this.activeFetches.set(key, fetchPromise);

    try {
      const data = await fetchPromise;
      if (onUpdate && data) onUpdate(data);
      return data;
    } finally {
      this.activeFetches.delete(key);
    }
  }

  private async performFetch<T>(
    key: string,
    url: string,
    transform?: (d: any) => T
  ): Promise<T | null> {
    try {
      const cached = this.get(key);
      const headers: Record<string, string> = {};
      
      if (cached?.etag) {
        headers['If-None-Match'] = cached.etag;
      }

      const res = await fetch(url, { 
        headers,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      // Return cached data if not modified
      if (res.status === 304 && cached) {
        this.lastFetch.set(key, Date.now());
        return transform ? transform(cached.data) : cached.data;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        etag: res.headers.get('etag') || undefined,
        provider: key,
      };

      this.set(key, entry);
      return transform ? transform(data) : data;
    } catch (error) {
      console.warn(`[OSIRIS] Failed to fetch ${key}:`, error);
      // Return cached data on error (offline mode)
      const cached = this.get<T>(key);
      if (cached) {
        return transform ? transform(cached.data) : cached.data;
      }
      return null;
    }
  }

  // Background fetch (sWR pattern)
  private async backgroundFetch<T>(
    key: string,
    transform?: (d: any) => T,
    onUpdate?: (d: T) => void
  ): Promise<void> {
    try {
      const data = await this.performFetch<T>(key, this.providers.get(key)!.url, transform);
      if (data && onUpdate) {
        onUpdate(data);
      }
    } catch (error) {
      // Silent fail for background fetches
    }
  }

  // Store data
  private set(key: string, entry: CacheEntry): void {
    this.memory.set(key, entry);
    this.lastFetch.set(key, Date.now());
    this.saveToStorage(key, entry);
  }

  // Preload critical data
  async preload(): Promise<void> {
    const critical = this.getProviders().filter(p => p.priority === 'critical' && p.enabled);
    await Promise.all(
      critical.map(p => this.fetch(p.key).catch(() => null))
    );
  }

  // Get cache statistics
  getStats(): { totalEntries: number; memorySize: number; providers: Record<string, { age: number; size: number }> } {
    const stats: Record<string, { age: number; size: number }> = {};
    let totalSize = 0;

    this.memory.forEach((entry, key) => {
      const size = JSON.stringify(entry).length;
      totalSize += size;
      stats[key] = { age: Date.now() - entry.timestamp, size };
    });

    return {
      totalEntries: this.memory.size,
      memorySize: totalSize,
      providers: stats,
    };
  }

  // Clear specific provider cache
  clear(key: string): void {
    this.memory.delete(key);
    this.lastFetch.delete(key);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${CACHE_KEY}_${key}`);
      } catch {
        // localStorage may be unavailable
      }
    }
  }

  // Clear all caches
  clearAll(): void {
    this.memory.clear();
    this.lastFetch.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage)
          .filter(k => k.startsWith(CACHE_KEY))
          .forEach(k => localStorage.removeItem(k));
      } catch {
        // localStorage may be unavailable
      }
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    let freed = 0;

    this.memory.forEach((entry, key) => {
      const provider = this.providers.get(key);
      if (!provider) return;

      // Remove if expired
      if (now - entry.timestamp > provider.ttl * 2) {
        this.memory.delete(key);
        freed += JSON.stringify(entry).length;
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(`${CACHE_KEY}_${key}`);
          } catch {}
        }
      }
    });

    if (freed > 0) {
      console.log(`[OSIRIS] Cache cleanup freed ${Math.round(freed / 1024)}KB`);
    }
  }

  // Persistence helpers
  private loadProviderConfig(): void {
    DEFAULT_PROVIDERS.forEach(p => this.providers.set(p.key, { ...p }));

    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(PROVIDER_CONFIG_KEY);
      if (saved) {
        const configs = JSON.parse(saved) as CacheProvider[];
        configs.forEach(saved => {
          const existing = this.providers.get(saved.key);
          if (existing) {
            this.providers.set(saved.key, { ...existing, ...saved });
          }
        });
      }
    } catch {
      // Use defaults if loading fails
    }
  }

  private saveProviderConfig(): void {
    if (typeof window === 'undefined') return;

    try {
      const configs = Array.from(this.providers.values());
      localStorage.setItem(PROVIDER_CONFIG_KEY, JSON.stringify(configs));
    } catch {
      // localStorage may be full or unavailable
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Load recent critical data on startup
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY));
      
      for (const key of keys.slice(0, 10)) { // Limit to 10 on startup
        try {
          const entry = JSON.parse(localStorage.getItem(key)!) as CacheEntry;
          const providerKey = key.replace(`${CACHE_KEY}_`, '');
          
          // Only restore if not expired
          const provider = this.providers.get(providerKey);
          if (provider && Date.now() - entry.timestamp < provider.ttl * 2) {
            this.memory.set(providerKey, entry);
          }
        } catch {
          // Skip corrupted entries
        }
      }
    } catch {
      // localStorage may be unavailable
    }
  }

  private saveToStorage(key: string, entry: CacheEntry): void {
    if (typeof window === 'undefined') return;

    try {
      const provider = this.providers.get(key);
      if (!provider || provider.priority === 'low') return; // Skip low priority

      const serialized = JSON.stringify(entry);
      if (serialized.length > 100 * 1024) return; // Skip entries > 100KB

      localStorage.setItem(`${CACHE_KEY}_${key}`, serialized);
    } catch {
      // localStorage may be full or unavailable
      this.cleanup();
    }
  }
}

// Singleton export
export const dataCache = new DataCacheEngine();
