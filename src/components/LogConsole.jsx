import React, { useState, useEffect, useRef } from 'react';
import { useFFmpeg } from '../context/FFmpegContext';
import { Terminal, X, Trash2 } from 'lucide-react';

export default function LogConsole({ isOpen, onClose }) {
  const { messages } = useFFmpeg();
  const [logs, setLogs] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const c = messages.current;
      setLogs(c.length > 12000 ? c.slice(-12000) : c);
    }, 200);
    return () => clearInterval(interval);
  }, [messages, isOpen]);

  useEffect(() => {
    if (endRef.current && isOpen) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="h-60 flex flex-col animate-slide-up"
      style={{ background: 'var(--console-bg)', borderTop: '1px solid rgba(99,102,241,0.2)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--console-header)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(129,140,248,0.8)' }} />
          <Terminal size={14} className="text-indigo-400" />
          <span className="text-xs font-heading font-semibold text-indigo-300 uppercase tracking-widest">FFmpeg Live Output</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { messages.current = ''; setLogs(''); }}
            className="flex items-center gap-1.5 text-[11px] font-body px-2 py-1 rounded cursor-pointer transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            <Trash2 size={12} /> Clear
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer transition-all"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            <X size={14} />
          </button>
        </div>
      </div>
      {/* Logs — always dark bg regardless of theme, real terminals are dark */}
      <div className="flex-1 overflow-y-auto px-5 py-3 scrollbar-hide">
        {logs ? (
          <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all" style={{ color: 'var(--log-color)' }}>{logs}</pre>
        ) : (
          <p className="text-xs font-body italic mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Awaiting FFmpeg output — run a tool to see live logs.
          </p>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
