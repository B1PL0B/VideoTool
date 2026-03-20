import React, { useState } from 'react';
import Sidebar from './Sidebar';
import LogConsole from './LogConsole';
import { useFFmpeg } from '../context/FFmpegContext';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function Layout({ children, activeTab, setActiveTab }) {
  const [consoleOpen, setConsoleOpen] = useState(false);
  const { loaded, loading, error } = useFFmpeg();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)', transition: 'background 0.3s ease' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        consoleOpen={consoleOpen}
        toggleConsole={() => setConsoleOpen(!consoleOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px z-10"
          style={{ background: 'linear-gradient(90deg, transparent, var(--border-accent, rgba(99,102,241,0.3)), transparent)' }} />

        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {loading && !loaded ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-6 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center"
                style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
                <Loader2 size={32} className="text-white animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Initializing Core Engine</h2>
                <p className="text-sm font-body max-w-sm" style={{ color: 'var(--text-muted)' }}>Loading ffmpeg.wasm with SharedArrayBuffer multi-threading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-5 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)' }}>
                <AlertTriangle size={28} className="text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-rose-400 mb-1">Engine Failed to Load</h2>
                <p className="text-sm font-body max-w-md" style={{ color: 'var(--text-muted)' }}>{error}</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto h-full animate-fade-in">
              {children}
            </div>
          )}
        </main>

        <LogConsole isOpen={consoleOpen} onClose={() => setConsoleOpen(false)} />
      </div>
    </div>
  );
}
