import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import VideoPreview from '../components/VideoPreview';
import { useFFmpeg } from '../context/FFmpegContext';
import { downloadBlob } from '../utils/download';
import { fetchFile } from '@ffmpeg/util';
import { Scissors, Info, CheckCircle } from 'lucide-react';

const fmt = (s) => {
  if (!s && s!==0) return '00:00:00.000';
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${sec.toFixed(3).padStart(6,'0')}`;
};

export default function VideoCutter() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const actualEnd = endTime ?? duration;

  const handleFileSelect = (f) => {
    setFile(f); setOutputBlob(null); setStartTime(0); setEndTime(null);
  };

  const handleCut = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP = ({ progress }) => setProgress(progress); ffmpeg.on('progress', onP);
    try {
      const inp = `inp_${file.name.replace(/\s+/g,'_')}`;
      const out = `cut_${inp}`;
      await ffmpeg.writeFile(inp, await fetchFile(file));
      await ffmpeg.exec(['-ss', startTime.toString(), '-i', inp, '-to', (actualEnd - startTime).toString(), '-c', 'copy', out]);
      const data = await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer], { type: file.type||'video/mp4' }));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile(out);
    } catch(e){ console.error(e); }
    finally { setProcessing(false); ffmpeg.off('progress', onP); }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{ background:'var(--info-bg-violet)', border:'1px solid var(--info-border-violet)' }}>
        <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
        <p style={{ color:'var(--text-secondary)' }}>
          <span className="font-semibold text-indigo-500">Keyframe snapping:</span> Use the preview slider below to set in/out points. Cuts snap to the nearest keyframe for instant stream-copy.
        </p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={handleFileSelect} title="Upload Video to Trim" description="Drag a video to see the A/B preview slider" />
      ) : (
        <div className="space-y-4">
          {/* Video preview with A/B slider */}
          <VideoPreview
            file={file}
            onDurationChange={(d) => { setDuration(d); setEndTime(d); }}
            showABSlider
            startTime={startTime}
            endTime={endTime ?? duration}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
          />

          {/* Manual time inputs */}
          <div className="grid grid-cols-2 gap-4">
            {[['In Point', fmt(startTime), (v)=>setStartTime(parseFloat(v)||0)],
              ['Out Point', fmt(actualEnd), (v)=>setEndTime(parseFloat(v)||duration)]].map(([label,val,setter])=>(
              <div key={label}>
                <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>{label}</label>
                <input type="text" defaultValue={val} key={val}
                  onBlur={e => setter(e.target.value)}
                  className="w-full font-mono text-sm rounded-xl px-4 py-3 outline-none transition-all"
                  style={{ background:'var(--bg-input)', border:'1px solid var(--border-input)', color:'var(--text-primary)' }}
                  onFocus={e=>e.target.style.borderColor='rgba(139,92,246,0.6)'}
                  onBlur2={e=>e.target.style.borderColor='var(--border-input)'}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-body"
            style={{ background:'var(--bg-pill)', border:'1px solid var(--border-card)' }}>
            <span style={{ color:'var(--text-muted)' }}>Selection duration</span>
            <span className="font-mono font-bold text-violet-500">{fmt(actualEnd - startTime)}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={()=>{setFile(null);setOutputBlob(null);}} className="px-4 py-3 rounded-xl text-sm font-heading font-semibold cursor-pointer transition-all flex-shrink-0"
              style={{ background:'var(--bg-btn-ghost)', border:'1px solid var(--border-card)', color:'var(--text-secondary)' }}>Change File</button>
            <button disabled={processing} onClick={handleCut}
              className="flex-1 py-3 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer transition-all disabled:opacity-40"
              style={{ background:'linear-gradient(135deg,#6366F1,#4F46E5)', boxShadow:'0 0 20px rgba(99,102,241,0.35)' }}>
              {processing ? 'Cutting...' : 'Cut Video Losslessly'}
            </button>
          </div>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Seeking & copying stream..." />}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <div className="text-center"><h3 className="font-heading font-semibold text-emerald-500 text-lg">Done instantly!</h3>
            <p className="text-sm mt-1 font-body" style={{ color:'var(--text-muted)' }}>Zero quality loss — stream copied</p></div>
          <button onClick={() => downloadBlob(outputBlob, `cut_${file.name}`)}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>Download Result</button>
        </div>
      )}
    </div>
  );
}
