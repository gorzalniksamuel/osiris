'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, RefreshCw, Trash2, Settings2, Wifi, WifiOff, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProviderConfig, useCache } from '@/lib/useCache';
import { CacheProvider } from '@/lib/dataCache';

const priorityColors: Record<string, string> = {
  critical: '#FF3D3D',
  high: '#FF9500',
  normal: '#00E5FF',
  low: '#5C5A54',
};

const priorityIcons: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  normal: '🔵',
  low: '⚪',
};

function formatDuration(ms: number): string {
  if (ms === Infinity) return 'Never';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

interface ProviderRowProps {
  provider: CacheProvider;
  onToggle: () => void;
  onUpdateTTL: (ttl: number) => void;
}

function ProviderRow({ provider, onToggle, onUpdateTTL }: ProviderRowProps) {
  const { data, isFresh, isStale, lastUpdated, refresh, loading } = useCache(provider.key, { 
    enabled: provider.enabled,
    autoRefresh: provider.enabled,
  });
  
  const [showSettings, setShowSettings] = useState(false);

  const ttlOptions = [
    { value: 15000, label: '15s' },
    { value: 30000, label: '30s' },
    { value: 60000, label: '1m' },
    { value: 300000, label: '5m' },
    { value: 600000, label: '10m' },
    { value: 900000, label: '15m' },
    { value: 1800000, label: '30m' },
    { value: Infinity, label: '∞' },
  ];

  const age = lastUpdated ? Date.now() - lastUpdated : null;

  return (
    <div className="border-b border-[var(--border-secondary)] last:border-0">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--hover-accent)] transition-colors text-left"
      >
        <span className="text-xs">{priorityIcons[provider.priority]}</span>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${provider.enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
              {provider.name}
            </span>
            <span 
              className="text-[8px] px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: `${priorityColors[provider.priority]}20`,
                color: priorityColors[provider.priority],
              }}
            >
              {provider.priority}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[8px] text-[var(--text-muted)]">
            <span>
              {isFresh ? (
                <span className="text-[var(--alert-green)] flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> fresh
                </span>
              ) : isStale ? (
                <span className="text-[var(--alert-yellow)] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> stale
                </span>
              ) : data ? (
                <span className="text-[var(--alert-red)] flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" /> expired
                </span>
              ) : (
                <span className="text-[var(--text-muted)]">no data</span>
              )}
            </span>
            <span>·</span>
            <span>refresh {formatDuration(provider.refreshInterval)}</span>
            {age !== null && (
              <>
                <span>·</span>
                <span>age {formatDuration(age)}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`p-1.5 rounded transition-colors ${
            provider.enabled 
              ? 'bg-[var(--alert-green)]/20 text-[var(--alert-green)]' 
              : 'bg-[var(--text-muted)]/20 text-[var(--text-muted)]'
          }`}
        >
          {provider.enabled ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        </button>
      </button>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[var(--bg-secondary)]/30"
          >
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[var(--text-muted)]">Cache TTL</span>
                <select
                  value={provider.ttl}
                  onChange={(e) => onUpdateTTL(Number(e.target.value) || Infinity)}
                  className="text-[9px] bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded px-2 py-1"
                >
                  {ttlOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[9px] font-mono bg-[var(--hover-accent)] hover:bg-[var(--bg-primary)] rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Fetching...' : 'Refresh'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CacheManager() {
  const [isOpen, setIsOpen] = useState(false);
  const { providers, setEnabled, updateProvider, getStats, clearCache } = useProviderConfig();
  const [stats, setStats] = useState(getStats());
  
  // Refresh stats periodically
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setStats(getStats());
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isOpen, getStats]);

  const criticalProviders = providers.filter(p => p.priority === 'critical');
  const highProviders = providers.filter(p => p.priority === 'high');
  const normalProviders = providers.filter(p => p.priority === 'normal');
  const lowProviders = providers.filter(p => p.priority === 'low');

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 left-5 z-[400] w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:scale-105 transition-transform"
        title="Cache Manager"
      >
        <Database className="w-4 h-4 text-[var(--gold-primary)]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[500]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              className="fixed left-5 top-20 bottom-20 w-80 z-[500] glass-panel overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-secondary)]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--gold-primary)]" />
                  <span className="text-[11px] font-mono font-bold tracking-wider text-[var(--gold-primary)]">
                    DATA CACHE
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Stats */}
              <div className="px-4 py-2 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="glass-panel-sm p-2">
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">ENTRIES</div>
                    <div className="text-lg font-mono text-[var(--text-primary)]">{stats.totalEntries}</div>
                  </div>
                  <div className="glass-panel-sm p-2">
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">SIZE</div>
                    <div className="text-lg font-mono text-[var(--text-primary)]">{formatBytes(stats.memorySize)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[8px] text-[var(--text-muted)]">
                    {providers.filter(p => p.enabled).length}/{providers.length} providers active
                  </span>
                </div>
              </div>

              {/* Provider List */}
              <div className="flex-1 overflow-y-auto styled-scrollbar">
                {criticalProviders.length > 0 && (
                  <div className="border-b border-[var(--border-secondary)]">
                    <div className="px-3 py-1 text-[8px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 tracking-wider">
                      CRITICAL
                    </div>
                    {criticalProviders.map(p => (
                      <ProviderRow
                        key={p.key}
                        provider={p}
                        onToggle={() => setEnabled(p.key, !p.enabled)}
                        onUpdateTTL={(ttl) => updateProvider(p.key, { ttl })}
                      />
                    ))}
                  </div>
                )}
                
                {highProviders.length > 0 && (
                  <div className="border-b border-[var(--border-secondary)]">
                    <div className="px-3 py-1 text-[8px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 tracking-wider">
                      HIGH PRIORITY
                    </div>
                    {highProviders.map(p => (
                      <ProviderRow
                        key={p.key}
                        provider={p}
                        onToggle={() => setEnabled(p.key, !p.enabled)}
                        onUpdateTTL={(ttl) => updateProvider(p.key, { ttl })}
                      />
                    ))}
                  </div>
                )}
                
                {normalProviders.length > 0 && (
                  <div className="border-b border-[var(--border-secondary)]">
                    <div className="px-3 py-1 text-[8px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 tracking-wider">
                      NORMAL
                    </div>
                    {normalProviders.map(p => (
                      <ProviderRow
                        key={p.key}
                        provider={p}
                        onToggle={() => setEnabled(p.key, !p.enabled)}
                        onUpdateTTL={(ttl) => updateProvider(p.key, { ttl })}
                      />
                    ))}
                  </div>
                )}
                
                {lowProviders.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[8px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 tracking-wider">
                      LOW PRIORITY
                    </div>
                    {lowProviders.map(p => (
                      <ProviderRow
                        key={p.key}
                        provider={p}
                        onToggle={() => setEnabled(p.key, !p.enabled)}
                        onUpdateTTL={(ttl) => updateProvider(p.key, { ttl })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-3 py-2 border-t border-[var(--border-secondary)] flex gap-2">
                <button
                  onClick={() => clearCache()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[9px] font-mono text-[var(--alert-red)] bg-[var(--alert-red)]/10 hover:bg-[var(--alert-red)]/20 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
                <button
                  onClick={() => {
                    providers.forEach(p => {
                      if (!p.enabled) setEnabled(p.key, true);
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[9px] font-mono text-[var(--alert-green)] bg-[var(--alert-green)]/10 hover:bg-[var(--alert-green)]/20 rounded transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  Enable All
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
