'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, MapPin, ExternalLink, AlertTriangle,
  Newspaper, Clock, Radio,
} from 'lucide-react';

interface LiveAlertsProps {
  data: any;
  onLocate: (lat: number, lng: number) => void;
  onWatchFeed?: (url: string, name: string) => void;
}

const RISK_COLORS: Record<string, string> = {
  HIGH: '#FF3D3D',
  CRITICAL: '#FF1744',
  ELEVATED: '#FF9500',
  MODERATE: '#FFD700',
  LOW: '#00E676',
};

export default function LiveAlerts({ data, onLocate, onWatchFeed }: LiveAlertsProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'news' | 'quakes' | 'feeds'>('all');

  // Built-in live feeds — verified video IDs (synced with /api/live-news)
  const BUILTIN_FEEDS = [
    // ── North America ──
    { name: 'NBC News NOW', city: 'New York', country: 'US', lat: 40.759, lng: -73.980, url: 'https://www.youtube.com/embed/JnCHHW_YBp8?autoplay=1&mute=1', category: 'mainstream', region: 'americas' },
    { name: 'CBS News 24/7', city: 'New York', country: 'US', lat: 40.764, lng: -73.973, url: 'https://www.youtube.com/embed/4b71rT9fU-k?autoplay=1&mute=1', category: 'mainstream', region: 'americas' },
    { name: 'ABC News Live', city: 'New York', country: 'US', lat: 40.763, lng: -73.979, url: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1&mute=1', category: 'mainstream', region: 'americas' },
    { name: 'Bloomberg TV', city: 'New York', country: 'US', lat: 40.756, lng: -73.988, url: 'https://www.youtube.com/embed/dp8PhLsUcFE?autoplay=1&mute=1', category: 'finance', region: 'americas' },
    { name: 'C-SPAN', city: 'Washington DC', country: 'US', lat: 38.897, lng: -77.036, url: 'https://www.youtube.com/embed/VRhIkGxhIMY?autoplay=1&mute=1', category: 'government', region: 'americas' },
    { name: 'CBC News', city: 'Toronto', country: 'CA', lat: 43.644, lng: -79.387, url: 'https://www.youtube.com/embed/65sR4KKWG8Y?autoplay=1&mute=1', category: 'mainstream', region: 'americas' },
    // ── Europe ──
    { name: 'Sky News', city: 'London', country: 'GB', lat: 51.500, lng: -0.118, url: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1', category: 'mainstream', region: 'europe' },
    { name: 'France 24 EN', city: 'Paris', country: 'FR', lat: 48.830, lng: 2.280, url: 'https://www.youtube.com/embed/h3MuIUNCCzI?autoplay=1&mute=1', category: 'mainstream', region: 'europe' },
    { name: 'DW News', city: 'Berlin', country: 'DE', lat: 52.508, lng: 13.376, url: 'https://www.youtube.com/embed/GE_SfNVNyqk?autoplay=1&mute=1', category: 'mainstream', region: 'europe' },
    { name: 'Euronews', city: 'Lyon', country: 'FR', lat: 45.764, lng: 4.836, url: 'https://www.youtube.com/embed/pykpO5kQJ98?autoplay=1&mute=1', category: 'mainstream', region: 'europe' },
    { name: 'TRT World', city: 'Istanbul', country: 'TR', lat: 41.008, lng: 28.978, url: 'https://www.youtube.com/embed/CV5Fooi1XGQ?autoplay=1&mute=1', category: 'mainstream', region: 'europe' },
    { name: 'UKRINFORM', city: 'Kyiv', country: 'UA', lat: 50.450, lng: 30.523, url: 'https://www.youtube.com/embed/jNZM_H6q1rY?autoplay=1&mute=1', category: 'conflict', region: 'europe' },
    // ── Middle East ──
    { name: 'Al Jazeera EN', city: 'Doha', country: 'QA', lat: 25.286, lng: 51.534, url: 'https://www.youtube.com/embed/F-POY4Q0KSI?autoplay=1&mute=1', category: 'mainstream', region: 'middleeast' },
    { name: 'i24NEWS EN', city: 'Tel Aviv', country: 'IL', lat: 32.085, lng: 34.781, url: 'https://www.youtube.com/embed/LH4MzFoXYOw?autoplay=1&mute=1', category: 'mainstream', region: 'middleeast' },
    // ── Asia Pacific ──
    { name: 'NHK World', city: 'Tokyo', country: 'JP', lat: 35.690, lng: 139.692, url: 'https://www.youtube.com/embed/f0lYkdA-Kx0?autoplay=1&mute=1', category: 'mainstream', region: 'asia' },
    { name: 'CNA 24/7', city: 'Singapore', country: 'SG', lat: 1.290, lng: 103.852, url: 'https://www.youtube.com/embed/XWq5kBlakcQ?autoplay=1&mute=1', category: 'mainstream', region: 'asia' },
    { name: 'WION', city: 'New Delhi', country: 'IN', lat: 28.614, lng: 77.209, url: 'https://www.youtube.com/embed/U1RYpeWGUas?autoplay=1&mute=1', category: 'mainstream', region: 'asia' },
    { name: 'Arirang', city: 'Seoul', country: 'KR', lat: 37.566, lng: 126.978, url: 'https://www.youtube.com/embed/JCM4dDPmrnA?autoplay=1&mute=1', category: 'mainstream', region: 'asia' },
    { name: 'ABC AU', city: 'Sydney', country: 'AU', lat: -33.868, lng: 151.209, url: 'https://www.youtube.com/embed/W1ilCy6XrmI?autoplay=1&mute=1', category: 'mainstream', region: 'asia' },
    // ── Africa ──
    { name: 'Africanews', city: 'Pointe-Noire', country: 'CG', lat: -4.778, lng: 11.865, url: 'https://www.youtube.com/embed/NJwVzo7mBgc?autoplay=1&mute=1', category: 'mainstream', region: 'africa' },
    { name: 'SABC News', city: 'Johannesburg', country: 'ZA', lat: -26.204, lng: 28.047, url: 'https://www.youtube.com/embed/NwN04K8JXOI?autoplay=1&mute=1', category: 'mainstream', region: 'africa' },
    // ── Latin America ──
    { name: 'teleSUR EN', city: 'Caracas', country: 'VE', lat: 10.491, lng: -66.902, url: 'https://www.youtube.com/embed/4G7RgMuUkfQ?autoplay=1&mute=1', category: 'mainstream', region: 'americas' },
  ];

  // Build unified alert feed
  const alerts: any[] = [];

  // News articles with locations (from /api/news)
  if (data.articles) {
    data.articles.slice(0, 10).forEach((a: any) => {
      if (a.lat && a.lng) {
        alerts.push({
          type: 'news', title: a.title, source: a.source,
          lat: a.lat, lng: a.lng, time: a.published,
          severity: a.risk_label || 'MODERATE', url: a.url,
        });
      }
    });
  }

  // Earthquakes
  if (data.earthquakes) {
    data.earthquakes.slice(0, 5).forEach((eq: any) => {
      alerts.push({
        type: 'quake', title: `M${eq.magnitude} - ${eq.place}`, source: 'USGS',
        lat: eq.lat, lng: eq.lng, time: eq.time,
        severity: eq.magnitude >= 6 ? 'CRITICAL' : eq.magnitude >= 4.5 ? 'HIGH' : 'MODERATE',
      });
    });
  }

  // Built-in live feeds (always present)
  BUILTIN_FEEDS.forEach(f => {
    alerts.push({
      type: 'feed', title: f.name,
      source: `${f.city}, ${f.country}`,
      lat: f.lat, lng: f.lng,
      feedUrl: f.url, severity: 'LOW', category: f.category,
    });
  });

  const filtered = filter === 'all' ? alerts :
    filter === 'news' ? alerts.filter(a => a.type === 'news') :
    filter === 'quakes' ? alerts.filter(a => a.type === 'quake') :
    alerts.filter(a => a.type === 'feed');

  const getIcon = (type: string) => {
    switch (type) {
      case 'news': return Newspaper;
      case 'quake': return AlertTriangle;
      case 'feed': return Radio;
      default: return Newspaper;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="glass-panel flex flex-col overflow-hidden pointer-events-auto"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-2 hover:bg-[var(--hover-accent)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#FF4081]" />
          <span className="hud-text text-[10px] text-[var(--text-primary)]">LIVE ALERTS</span>
          <span className="text-[8px] font-mono text-[var(--text-muted)]">{alerts.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF4081] animate-osiris-pulse" />
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-2 pb-2"
          >
            {/* Filters */}
            <div className="flex gap-1 mb-2">
              {(['all', 'news', 'quakes', 'feeds'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded text-[9px] font-mono tracking-wider transition-all ${filter === f ? 'bg-[var(--hover-accent)] text-[var(--text-primary)] border border-[var(--border-primary)]' : 'text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]'}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Alert List */}
            <div className="space-y-0.5 max-h-[180px] overflow-y-auto styled-scrollbar">
              {filtered.map((alert, i) => {
                const Icon = getIcon(alert.type);
                const sevColor = RISK_COLORS[alert.severity] || '#FFD700';
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onLocate(alert.lat, alert.lng);
                      if (alert.feedUrl && onWatchFeed) {
                        onWatchFeed(alert.feedUrl, alert.title);
                      }
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[var(--hover-accent)] transition-all border border-transparent hover:border-[var(--border-primary)] group"
                  >
                    <div className="flex items-start gap-2">
                      {/* Severity indicator */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sevColor, boxShadow: `0 0 6px ${sevColor}60` }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="w-3 h-3 flex-shrink-0" style={{ color: sevColor }} />
                          <span className="text-[10px] font-mono text-[var(--text-primary)] truncate leading-tight">{alert.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-[var(--text-muted)]">{alert.source}</span>
                          {alert.time && (
                            <span className="text-[8px] font-mono text-[var(--text-muted)] flex items-center gap-0.5">
                              <Clock className="w-2 h-2" />
                              {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fly-to icon */}
                      <MapPin className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-4 text-[10px] font-mono text-[var(--text-muted)]">
                  No alerts for this filter
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
