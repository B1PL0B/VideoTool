import React, { useState } from 'react';
import Layout from './components/Layout';
import { categories, findTool } from './components/Sidebar';

// Existing tools
import VideoCutter from './tools/VideoCutter';
import VideoMerger from './tools/VideoMerger';
import CopyrightRemover from './tools/CopyrightRemover';
import AudioExtractor from './tools/AudioExtractor';
import AudioMerger from './tools/AudioMerger';
import SubtitleExtractor from './tools/SubtitleExtractor';

// New tools
import BatchCutter from './tools/BatchCutter';
import SubtitleEmbedder from './tools/SubtitleEmbedder';
import ThumbnailExtractor from './tools/ThumbnailExtractor';
import RemoveAudio from './tools/RemoveAudio';
import ContainerRemuxer from './tools/ContainerRemuxer';
import MetadataStripper from './tools/MetadataStripper';
import StreamInspector from './tools/StreamInspector';

const toolComponents = {
  cutter:        VideoCutter,
  batch:         BatchCutter,
  copyright:     CopyrightRemover,
  merger:        VideoMerger,
  'av-merger':   AudioMerger,
  'sub-embed':   SubtitleEmbedder,
  'audio-extract': AudioExtractor,
  subtitle:      SubtitleExtractor,
  thumbnail:     ThumbnailExtractor,
  'remove-audio':RemoveAudio,
  remux:         ContainerRemuxer,
  metadata:      MetadataStripper,
  inspect:       StreamInspector,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('cutter');
  const activeTool = findTool(activeTab);
  const Tool = toolComponents[activeTab] || (() => <p style={{color:'var(--text-muted)'}}>Tool not found</p>);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex flex-col gap-6 w-full py-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-1 rounded-full bg-gradient-to-b from-rose-500 to-indigo-500" />
            <p className="text-xs font-body font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>
              Lossless Processing — No Re‑encoding
            </p>
          </div>
          <h2 className="text-2xl font-heading font-bold leading-tight" style={{ color:'var(--text-primary)' }}>
            {activeTool?.name ?? 'Tool'}
          </h2>
          <p className="mt-1 text-sm font-body" style={{ color:'var(--text-secondary)' }}>
            {activeTool?.description}
          </p>
        </div>

        <div key={activeTab} className="animate-slide-up glass-card p-6 w-full">
          <Tool />
        </div>

        <p className="text-center text-xs font-body pb-2" style={{ color:'var(--text-faint)' }}>
          All processing is 100% local · Zero data leaves your browser
        </p>
      </div>
    </Layout>
  );
}
