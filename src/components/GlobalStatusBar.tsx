'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Exchange { name: string; country: string; open: boolean; }
interface CountryRisk { code: string; risk_score: number; risk_level: string; tags: string[]; }

export default function GlobalStatusBar() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [risks, setRisks] = useState<CountryRisk[]>([]);
  const [cyber, setCyber] = useState<any>(null);
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, cyberRes] = await Promise.allSettled([
          fetch('/api/country-risk'),
          fetch('/api/cyber-threats'),
        ]);
        if (riskRes.status === 'fulfilled' && riskRes.value.ok) {
          const d = await riskRes.value.json();
          setExchanges(d.exchanges || []);
          setRisks(d.countries || []);
          setOpenCount(d.open_exchanges || 0);
        }
        if (cyberRes.status === 'fulfilled' && cyberRes.value.ok) {
          setCyber(await cyberRes.value.json());
        }
      } catch {}
    };
    fetchData();
    const iv = setInterval(fetchData, 300000);
    return () => clearInterval(iv);
  }, []);

  const topRisks = risks.slice(0, 6);
  const cveCount = cyber?.stats?.active_cves || 0;

  const riskColor = (level: string) =>
    level === 'CRITICAL' ? '#FF3D3D' : level === 'HIGH' ? '#FF9500' : level === 'ELEVATED' ? '#FFD700' : '#00E676';

  const countryFlag = (code: string) => {
    try {
      return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
    } catch { return code; }
  };

  if (exchanges.length === 0 && risks.length === 0) return null;

  const tickerContent = (
    <>
      {exchanges.map(ex => (
        <span key={ex.name} className="inline-flex items-center gap-0.5 mx-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ex.open ? 'bg-[var(--alert-green)]' : 'bg-[var(--text-muted)]/30'}`} />
          <span className={`${ex.open ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]/40'}`}>{ex.name}</span>
        </span>
      ))}
      <span className="text-[var(--border-primary)] mx-1">│</span>
      {topRisks.map(r => (
        <span key={r.code} className="inline-flex items-center gap-0.5 mx-1.5">
          <span className="text-[8px]">{countryFlag(r.code)}</span>
          <span style={{ color: riskColor(r.risk_level) }} className="font-bold">{r.risk_score}</span>
        </span>
      ))}
      <span className="text-[var(--border-primary)] mx-1">│</span>
      <span className="inline-flex items-center gap-1 mx-2">
        <span className="text-[#E040FB]">CYBER</span>
        <span className="text-[var(--text-primary)]">{cveCount} CVEs</span>
      </span>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 4, duration: 0.8 }}
      className="hidden md:block absolute top-[42px] left-0 right-0 z-[198] pointer-events-none"
    >
      <div className="h-[18px] overflow-hidden bg-[var(--bg-panel)]/50 border-y border-[var(--border-secondary)]/50 flex items-center text-[6px] font-mono tracking-wider">
        {/* Static label */}
        <div className="flex-shrink-0 px-2 h-full flex items-center gap-1 border-r border-[var(--border-secondary)]/50 bg-[var(--bg-panel)]">
          <span className="text-[var(--text-muted)]">MKT</span>
          <span className="text-[var(--gold-primary)] font-bold">{openCount}/{exchanges.length}</span>
        </div>

        {/* CSS-animated ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center animate-ticker whitespace-nowrap">
            {tickerContent}
            {tickerContent}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
