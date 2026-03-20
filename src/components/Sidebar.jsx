import React, { useState } from 'react';
import {
  ShieldAlert, Scissors, Merge, Music, Combine, Subtitles,
  Terminal, Zap, Sun, Moon, Layers, ChevronDown,
  Film, Archive, Package, Trash2, Eye, LayoutGrid, FileText, Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const categories = [
  {
    id: 'cut',
    label: 'Cut & Trim',
    icon: Scissors,
    tools: [
      { id: 'cutter',    name: 'Video Cutter',        icon: Scissors,   color: 'violet', description: 'Lossless A→B trim + preview' },
      { id: 'batch',     name: 'Batch Cutter',         icon: LayoutGrid, color: 'purple', description: 'Multi-segment export as ZIP' },
      { id: 'copyright', name: 'Copyright Remover',    icon: ShieldAlert,color: 'rose',   description: 'Micro-cut hash disruptor' },
    ],
  },
  {
    id: 'merge',
    label: 'Merge & Combine',
    icon: Merge,
    tools: [
      { id: 'merger',    name: 'Video Merger',         icon: Merge,      color: 'blue',   description: 'Concat same-codec clips' },
      { id: 'av-merger', name: 'Video & Audio Muxer',  icon: Combine,    color: 'teal',   description: 'Replace or add audio tracks' },
      { id: 'sub-embed', name: 'Subtitle Embedder',    icon: FileText,   color: 'sky',    description: 'Embed soft subs into MKV' },
    ],
  },
  {
    id: 'extract',
    label: 'Extract',
    icon: Package,
    tools: [
      { id: 'audio-extract', name: 'Audio Extractor',  icon: Music,      color: 'amber',  description: 'Rip raw audio, auto codec detect' },
      { id: 'subtitle',      name: 'Subtitle Extractor',icon: Subtitles,  color: 'indigo', description: 'Export embedded SRT / VTT' },
      { id: 'thumbnail',     name: 'Thumbnail Extractor',icon: Eye,       color: 'lime',   description: 'Extract frames as PNG / ZIP' },
      { id: 'remove-audio',  name: 'Remove Audio Track', icon: Trash2,   color: 'orange', description: 'Strip audio, keep video' },
    ],
  },
  {
    id: 'convert',
    label: 'Convert & Utility',
    icon: Archive,
    tools: [
      { id: 'remux',    name: 'Container Remuxer',     icon: Film,       color: 'cyan',   description: 'MKV ↔ MP4 ↔ MOV lossless' },
      { id: 'metadata', name: 'Metadata Stripper',     icon: Layers,     color: 'slate',  description: 'Wipe embedded tags + GPS' },
      { id: 'inspect',  name: 'Stream Inspector',      icon: Info,       color: 'green',  description: 'Probe streams, codecs, chapters' },
    ],
  },
];

// Map color name → tailwind-compatible inline style tokens
const colorMap = {
  violet: { dot:'#8b5cf6', bg:'rgba(139,92,246,0.10)', border:'rgba(139,92,246,0.28)', icon:'rgba(139,92,246,0.18)' },
  purple: { dot:'#a855f7', bg:'rgba(168,85,247,0.10)', border:'rgba(168,85,247,0.28)', icon:'rgba(168,85,247,0.18)' },
  rose:   { dot:'#f43f5e', bg:'rgba(244,63,94,0.10)',  border:'rgba(244,63,94,0.28)',  icon:'rgba(244,63,94,0.18)'  },
  blue:   { dot:'#3b82f6', bg:'rgba(59,130,246,0.10)', border:'rgba(59,130,246,0.28)', icon:'rgba(59,130,246,0.18)' },
  teal:   { dot:'#14b8a6', bg:'rgba(20,184,166,0.10)', border:'rgba(20,184,166,0.28)', icon:'rgba(20,184,166,0.18)' },
  sky:    { dot:'#0ea5e9', bg:'rgba(14,165,233,0.10)', border:'rgba(14,165,233,0.28)', icon:'rgba(14,165,233,0.18)' },
  amber:  { dot:'#f59e0b', bg:'rgba(245,158,11,0.10)', border:'rgba(245,158,11,0.28)', icon:'rgba(245,158,11,0.18)' },
  indigo: { dot:'#6366f1', bg:'rgba(99,102,241,0.10)', border:'rgba(99,102,241,0.28)', icon:'rgba(99,102,241,0.18)' },
  lime:   { dot:'#84cc16', bg:'rgba(132,204,22,0.10)', border:'rgba(132,204,22,0.28)', icon:'rgba(132,204,22,0.18)' },
  orange: { dot:'#f97316', bg:'rgba(249,115,22,0.10)', border:'rgba(249,115,22,0.28)', icon:'rgba(249,115,22,0.18)' },
  cyan:   { dot:'#06b6d4', bg:'rgba(6,182,212,0.10)',  border:'rgba(6,182,212,0.28)',  icon:'rgba(6,182,212,0.18)'  },
  slate:  { dot:'#94a3b8', bg:'rgba(148,163,184,0.10)',border:'rgba(148,163,184,0.26)',icon:'rgba(148,163,184,0.15)' },
  green:  { dot:'#22c55e', bg:'rgba(34,197,94,0.10)',  border:'rgba(34,197,94,0.28)',  icon:'rgba(34,197,94,0.18)'  },
};

// Find tool and category by id
export const findTool = (id) => {
  for (const cat of categories) {
    const t = cat.tools.find(t => t.id === id);
    if (t) return t;
  }
  return null;
};

export default function Sidebar({ activeTab, setActiveTab, toggleConsole, consoleOpen }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  // Start all categories open
  const [openCats, setOpenCats] = useState({ cut: true, merge: true, extract: true, convert: true });
  const toggleCat = (id) => setOpenCats(s => ({ ...s, [id]: !s[id] }));

  return (
    <aside className="w-72 h-screen flex flex-col flex-shrink-0 relative overflow-hidden transition-colors duration-300"
      style={{ background:'var(--bg-sidebar)', borderRight:'1px solid var(--border-base)' }}>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background:'linear-gradient(90deg, transparent, var(--border-accent), transparent)' }} />

      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center"
            style={{ boxShadow:'0 0 16px rgba(225,29,72,0.35)' }}>
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="font-heading text-[17px] font-bold leading-none tracking-tight" style={{ color:'var(--text-primary)' }}>VideoTool</h1>
            <p className="text-[10px] font-body font-semibold text-indigo-500 uppercase tracking-widest mt-0.5">13 Lossless Tools</p>
          </div>
        </div>
        {/* Theme toggle */}
        <button onClick={toggle} title={isDark ? 'Day Mode' : 'Dark Mode'}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
          style={{ background:'var(--bg-btn-ghost)', border:'1px solid var(--border-card)', color:'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-btn-ghost-h)'; e.currentTarget.style.color='var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-btn-ghost)'; e.currentTarget.style.color='var(--text-muted)'; }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="mx-5 h-px flex-shrink-0" style={{ background:'var(--divider)' }} />

      {/* Categorized nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-hide">
        {categories.map((cat) => {
          const CatIcon = cat.icon;
          const isOpen = openCats[cat.id];
          const hasActive = cat.tools.some(t => t.id === activeTab);
          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl mb-1 transition-all duration-150 cursor-pointer"
                style={{ background: hasActive && !isOpen ? 'var(--nav-active-bg)' : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--nav-hover-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = hasActive && !isOpen ? 'var(--nav-active-bg)' : 'transparent'}
              >
                <CatIcon size={14} style={{ color:'var(--text-faint)' }} />
                <span className="flex-1 text-left text-[11px] font-body font-bold uppercase tracking-widest" style={{ color:'var(--text-faint)' }}>
                  {cat.label}
                </span>
                <ChevronDown size={12} style={{ color:'var(--text-faint)', transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)', transition:'transform 0.2s' }} />
              </button>

              {/* Tools */}
              {isOpen && (
                <div className="space-y-0.5 mb-2">
                  {cat.tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTab === tool.id;
                    const c = colorMap[tool.color];
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTab(tool.id)}
                        className="w-full flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-xl transition-all duration-150 ease-out text-left cursor-pointer"
                        style={{
                          background: isActive ? c.bg : 'transparent',
                          border: `1px solid ${isActive ? c.border : 'transparent'}`,
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='var(--nav-hover-bg)'; }}}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; }}}
                      >
                        <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-all"
                          style={{ background: isActive ? c.icon : 'var(--bg-btn-ghost)', color: isActive ? c.dot : 'var(--text-muted)' }}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-heading font-semibold leading-tight"
                            style={{ color: isActive ? c.dot : 'var(--text-primary)' }}>{tool.name}</div>
                          <div className="text-[10px] font-body truncate mt-0.5" style={{ color:'var(--text-muted)' }}>{tool.description}</div>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:c.dot, boxShadow:`0 0 6px ${c.dot}` }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mx-5 h-px flex-shrink-0" style={{ background:'var(--divider)' }} />

      {/* Console toggle */}
      <div className="p-3 flex-shrink-0">
        <button onClick={toggleConsole}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 cursor-pointer"
          style={{ background:consoleOpen?'rgba(99,102,241,0.10)':'transparent', border:`1px solid ${consoleOpen?'rgba(99,102,241,0.28)':'transparent'}`, color:consoleOpen?'#818cf8':'var(--text-secondary)' }}
          onMouseEnter={e => { if (!consoleOpen) e.currentTarget.style.background='var(--nav-hover-bg)'; }}
          onMouseLeave={e => { if (!consoleOpen) e.currentTarget.style.background='transparent'; }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:consoleOpen?'rgba(99,102,241,0.18)':'var(--bg-btn-ghost)' }}>
            <Terminal size={15} />
          </div>
          <span className="text-sm font-heading font-semibold" style={{ color:consoleOpen?'#818cf8':'var(--text-primary)' }}>FFmpeg Console</span>
          <div className="ml-auto w-2 h-2 rounded-full" style={{ background:consoleOpen?'#818cf8':'var(--text-faint)', boxShadow:consoleOpen?'0 0 8px rgba(129,140,248,0.9)':'none' }} />
        </button>
      </div>
      <p className="text-center text-[10px] pb-4 font-body" style={{ color:'var(--text-faint)' }}>ffmpeg.wasm v0.12 · 100% local</p>
    </aside>
  );
}
