import React from 'react';
import { Cpu } from 'lucide-react';

export default function ProgressBar({ progress, statusText }) {
  if (progress === null || progress === undefined) return null;
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return (
    <div className="rounded-2xl p-5 animate-fade-in"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
      <div className="flex justify-between items-center mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Cpu size={15} className="text-indigo-400 flex-shrink-0 animate-pulse" />
          <span className="text-sm font-body truncate" style={{ color: 'var(--text-secondary)' }}>{statusText || 'Processing...'}</span>
        </div>
        <span className="font-heading font-bold text-sm tabular-nums text-indigo-500 px-2.5 py-1 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)' }}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-btn-ghost)' }}>
        <div
          className="h-2 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366F1, #E11D48)', boxShadow: '0 0 12px rgba(99,102,241,0.7)' }}
        >
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', animation: 'shimmer 1.2s infinite' }} />
        </div>
      </div>
    </div>
  );
}
