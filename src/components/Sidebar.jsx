import React from 'react';
import {
  ShieldAlert, Scissors, Merge, Music, Combine, Subtitles, Terminal, Zap, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const tools = [
  { id: 'copyright',    name: 'Copyright Remover',   short: 'Remover',  icon: ShieldAlert, color: 'rose',   description: 'Disrupt hashes via micro-cuts' },
  { id: 'cutter',       name: 'Video Cutter',         short: 'Cutter',   icon: Scissors,    color: 'violet', description: 'Lossless A→B trim, keyframe-snap' },
  { id: 'merger',       name: 'Video Merger',         short: 'Merger',   icon: Merge,       color: 'blue',   description: 'Concat identical-codec clips' },
  { id: 'audio-extract',name: 'Audio Extractor',      short: 'Extract',  icon: Music,       color: 'amber',  description: 'Rip raw audio track (0% loss)' },
  { id: 'av-merger',    name: 'Video & Audio Muxer',  short: 'Muxer',    icon: Combine,     color: 'teal',   description: 'Replace or add audio tracks' },
  { id: 'subtitle',     name: 'Subtitle Extractor',   short: 'Subs',     icon: Subtitles,   color: 'sky',    description: 'Extract embedded SRT / VTT' },
];

const colorMap = {
  rose:   { active: 'text-rose-500',   activeBg: 'rgba(244,63,94,0.10)',   activeBorder: 'rgba(244,63,94,0.30)',   dot: '#f43f5e', iconActive: 'rgba(244,63,94,0.15)'  },
  violet: { active: 'text-violet-500', activeBg: 'rgba(139,92,246,0.10)',  activeBorder: 'rgba(139,92,246,0.30)', dot: '#8b5cf6', iconActive: 'rgba(139,92,246,0.15)' },
  blue:   { active: 'text-blue-500',   activeBg: 'rgba(59,130,246,0.10)',  activeBorder: 'rgba(59,130,246,0.30)', dot: '#3b82f6', iconActive: 'rgba(59,130,246,0.15)'  },
  amber:  { active: 'text-amber-500',  activeBg: 'rgba(245,158,11,0.10)',  activeBorder: 'rgba(245,158,11,0.30)', dot: '#f59e0b', iconActive: 'rgba(245,158,11,0.15)'  },
  teal:   { active: 'text-teal-500',   activeBg: 'rgba(20,184,166,0.10)',  activeBorder: 'rgba(20,184,166,0.30)', dot: '#14b8a6', iconActive: 'rgba(20,184,166,0.15)'  },
  sky:    { active: 'text-sky-500',    activeBg: 'rgba(14,165,233,0.10)',  activeBorder: 'rgba(14,165,233,0.30)', dot: '#0ea5e9', iconActive: 'rgba(14,165,233,0.15)'   },
};

export default function Sidebar({ activeTab, setActiveTab, toggleConsole, consoleOpen }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <aside
      className="w-72 h-screen flex flex-col flex-shrink-0 relative overflow-hidden transition-colors duration-300"
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-base)',
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, var(--border-accent), transparent)` }} />

      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 16px rgba(225,29,72,0.35)' }}>
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="font-heading text-[17px] font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>VideoTool</h1>
            <p className="text-[10px] font-body font-semibold text-indigo-500 uppercase tracking-widest mt-0.5">Lossless · WASM</p>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Switch to Day Mode' : 'Switch to Dark Mode'}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
          style={{
            background: 'var(--bg-btn-ghost)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-btn-ghost-h)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-btn-ghost)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: 'var(--divider)' }} />

      {/* Nav label */}
      <p className="px-5 pt-5 pb-2 text-[10px] font-body font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
        Processing Tools
      </p>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide pb-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTab === tool.id;
          const c = colorMap[tool.color];
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ease-out text-left cursor-pointer group"
              style={{
                background: isActive ? c.activeBg : 'transparent',
                border: `1px solid ${isActive ? c.activeBorder : 'transparent'}`,
                color: isActive ? c.dot : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--nav-hover-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-150"
                style={{ background: isActive ? c.iconActive : 'var(--bg-btn-ghost)' }}>
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-heading font-semibold leading-tight" style={{ color: isActive ? c.dot : 'var(--text-primary)' }}>{tool.name}</div>
                <div className="text-[11px] font-body truncate mt-0.5 transition-colors" style={{ color: 'var(--text-muted)' }}>{tool.description}</div>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot, boxShadow: `0 0 6px ${c.dot}` }} />}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: 'var(--divider)' }} />

      {/* Console toggle */}
      <div className="p-3">
        <button
          onClick={toggleConsole}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ease-out cursor-pointer"
          style={{
            background: consoleOpen ? 'rgba(99,102,241,0.10)' : 'transparent',
            border: `1px solid ${consoleOpen ? 'rgba(99,102,241,0.28)' : 'transparent'}`,
            color: consoleOpen ? '#818cf8' : 'var(--text-secondary)',
          }}
          onMouseEnter={e => { if (!consoleOpen) { e.currentTarget.style.background = 'var(--nav-hover-bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
          onMouseLeave={e => { if (!consoleOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
            style={{ background: consoleOpen ? 'rgba(99,102,241,0.18)' : 'var(--bg-btn-ghost)' }}>
            <Terminal size={17} />
          </div>
          <span className="text-sm font-heading font-semibold" style={{ color: consoleOpen ? '#818cf8' : 'var(--text-primary)' }}>FFmpeg Console</span>
          <div className="ml-auto w-2 h-2 rounded-full transition-all"
            style={{ background: consoleOpen ? '#818cf8' : 'var(--text-faint)', boxShadow: consoleOpen ? '0 0 8px rgba(129,140,248,0.9)' : 'none' }} />
        </button>
      </div>

      <p className="text-center text-[10px] pb-4 font-body" style={{ color: 'var(--text-faint)' }}>
        Powered by ffmpeg.wasm
      </p>
    </aside>
  );
}
