import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Music, CheckCircle } from 'lucide-react';

export default function AudioExtractor() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [detectedExt, setDetectedExt] = useState('.m4a');
  const { ffmpeg } = useFFmpeg();

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    let codec = 'aac';
    const Intercept = ({ message }) => {
      if (message.includes('Audio: ')) {
        if (message.includes('mp3')) codec='mp3';
        else if (message.includes('opus')) codec='opus';
        else if (message.includes('vorbis')) codec='ogg';
        else if (message.includes('flac')) codec='flac';
      }
    };
    ffmpeg.on('log', Intercept);
    const onP = ({ progress }) => setProgress(progress);
    ffmpeg.on('progress', onP);
    try {
      const inp=`inp_${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
      await ffmpeg.writeFile(inp, await fetchFile(file));
      await ffmpeg.exec(['-i', inp]);
      const ext = codec==='mp3'?'mp3':codec==='opus'?'opus':codec==='ogg'?'ogg':codec==='flac'?'flac':'m4a';
      setDetectedExt(`.${ext}`);
      const out=`extract.${ext}`;
      await ffmpeg.exec(['-i',inp,'-vn','-acodec','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:ext==='m4a'?'audio/mp4':`audio/${ext}`}));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile(out);
    } catch(e){ console.error(e); } finally { setProcessing(false); ffmpeg.off('log',Intercept); ffmpeg.off('progress',onP); }
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <FileUploader onFileSelect={setFile} icon="video" title="Upload Video to Extract Audio" description="We'll detect the codec automatically" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background:'var(--bg-pill)', border:'1px solid var(--border-card)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Music size={15} className="text-amber-500 flex-shrink-0" />
              <span className="text-sm font-body truncate" style={{ color:'var(--text-primary)' }}>{file.name}</span>
            </div>
            <button onClick={()=>setFile(null)} className="text-xs font-body ml-4 flex-shrink-0 transition-colors cursor-pointer"
              style={{ color:'var(--text-faint)' }} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>
          <div className="px-4 py-3 rounded-xl text-sm font-body flex items-center gap-2"
            style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.15)', color:'var(--text-secondary)' }}>
            <Music size={14} className="text-amber-500" />
            <span>Auto-detects codec → outputs <span className="text-amber-500 font-medium">.m4a / .mp3 / .opus / .flac</span></span>
          </div>
          <button disabled={processing} onClick={handleExtract}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{ background:'linear-gradient(135deg, #D97706, #B45309)', boxShadow:'0 0 20px rgba(245,158,11,0.22)' }}>
            {processing ? 'Extracting...' : 'Extract Audio Track'}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Demuxing audio stream..." />}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-8 rounded-2xl animate-slide-up"
          style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5} />
          <div className="text-center">
            <h3 className="font-heading font-semibold text-emerald-500 text-lg">Extraction Complete</h3>
            <p className="text-sm font-body mt-1" style={{ color:'var(--text-muted)' }}>Format detected: <span className="text-amber-500">{detectedExt}</span></p>
          </div>
          <a href={URL.createObjectURL(outputBlob)} download={`audio_${file.name.split('.')[0]}${detectedExt}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>Download Audio</a>
        </div>
      )}
    </div>
  );
}
