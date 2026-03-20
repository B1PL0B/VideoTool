import React, { useState } from 'react';
import Layout from './components/Layout';
import { tools } from './components/Sidebar';
import CopyrightRemover from './tools/CopyrightRemover';
import VideoCutter from './tools/VideoCutter';
import VideoMerger from './tools/VideoMerger';
import AudioExtractor from './tools/AudioExtractor';
import AudioMerger from './tools/AudioMerger';
import SubtitleExtractor from './tools/SubtitleExtractor';

export default function App() {
  const [activeTab, setActiveTab] = useState(tools[0].id);
  const activeTool = tools.find(t => t.id === activeTab);

  const renderTool = () => {
    switch (activeTab) {
      case 'copyright':    return <CopyrightRemover />;
      case 'cutter':       return <VideoCutter />;
      case 'merger':       return <VideoMerger />;
      case 'audio-extract':return <AudioExtractor />;
      case 'av-merger':    return <AudioMerger />;
      case 'subtitle':     return <SubtitleExtractor />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex flex-col gap-7 w-full py-2">
        {/* Page header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-rose-500 to-indigo-500" />
            <p className="text-xs font-body font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Lossless Processing — No Re-encoding
            </p>
          </div>
          <h2 className="text-3xl font-heading font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {activeTool?.name}
          </h2>
          <p className="mt-1.5 text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            {activeTool?.description}
          </p>
        </div>

        {/* Tool card */}
        <div key={activeTab} className="animate-slide-up glass-card p-7">
          {renderTool()}
        </div>

        <p className="text-center text-xs font-body" style={{ color: 'var(--text-faint)' }}>
          All processing is 100% local · Zero data leaves your browser
        </p>
      </div>
    </Layout>
  );
}
