/**
 * OSIRIS Data Cache Hook
 * 
 * React hook for consuming cached data with automatic sync
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { dataCache, CacheProvider, CacheEntry } from './dataCache';

export interface UseCacheOptions {
  transform?: (d: any) => any;
  enabled?: boolean;
  autoRefresh?: boolean;
}

export function useCache<T = any>(key: string, options: UseCacheOptions = {}) {
  const { transform, enabled = true, autoRefresh = true } = options;
  const [data, setData] = useState<T | null>(() => {
    const cached = dataCache.get<T>(key);
    return cached ? (transform ? transform(cached.data) : cached.data) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFresh, setIsFresh] = useState(() => dataCache.isFresh(key));
  
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await dataCache.fetch<T>(key, {
        transform,
        onUpdate: (newData) => {
          if (mountedRef.current) {
            setData(newData);
            setIsFresh(true);
          }
        },
      });

      if (mountedRef.current && result) {
        setData(result);
        setIsFresh(true);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, enabled, transform]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately if no cached data OR if stale
    const cached = dataCache.get(key);
    if (!cached || !dataCache.isFresh(key)) {
      refresh();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [key, enabled, refresh]);

  // Auto-refresh based on provider TTL
  useEffect(() => {
    if (!autoRefresh || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const providers = dataCache.getProviders();
    const provider = providers.find(p => p.key === key);
    if (!provider) return;

    // Refresh based on provider's refresh interval
    intervalRef.current = setInterval(() => {
      if (dataCache.canFetch(key)) {
        refresh();
      } else {
        // Mark as stale if we can't refresh
        setIsFresh(dataCache.isFresh(key));
      }
    }, Math.min(provider.refreshInterval, 60000)); // Check at least every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [key, enabled, autoRefresh, refresh]);

  // Stale state checker
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setIsFresh(dataCache.isFresh(key));
    }, 5000);

    return () => clearInterval(interval);
  }, [key, enabled]);

  return {
    data,
    loading,
    error,
    isFresh,
    isStale: !isFresh && data !== null,
    refresh,
    lastUpdated: dataCache.get(key)?.timestamp || null,
  };
}

// Hook for managing provider configuration
export function useProviderConfig() {
  const [providers, setProviders] = useState<CacheProvider[]>(dataCache.getProviders());

  const updateProvider = useCallback((key: string, updates: Partial<CacheProvider>) => {
    dataCache.updateProvider(key, updates);
    setProviders(dataCache.getProviders());
  }, []);

  const setEnabled = useCallback((key: string, enabled: boolean) => {
    dataCache.setProviderEnabled(key, enabled);
    setProviders(dataCache.getProviders());
  }, []);

  const getStats = useCallback(() => dataCache.getStats(), []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      dataCache.clear(key);
    } else {
      dataCache.clearAll();
    }
    setProviders(dataCache.getProviders());
  }, []);

  return {
    providers,
    updateProvider,
    setEnabled,
    getStats,
    clearCache,
  };
}

// Hook for bulk data loading
export function useCacheMulti(keys: string[], options: UseCacheOptions = {}) {
  const results = keys.map(key => useCache(key, options));
  
  const data = Object.fromEntries(
    keys.map((key, i) => [key, results[i].data])
  ) as Record<string, any>;

  const loading = results.some(r => r.loading);
  const error = results.find(r => r.error)?.error || null;
  const allFresh = results.every(r => r.isFresh);

  const refreshAll = useCallback(async () => {
    await Promise.all(results.map(r => r.refresh()));
  }, [results]);

  return {
    data,
    loading,
    error,
    allFresh,
    refreshAll,
    results,
  };
}
