import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Scissors, Info, CheckCircle } from 'lucide-react';

export default function VideoCutter() {
  const [file, setFile] = useState(null);
  const [start, setStart] = useState('00:00:00.000');
  const [end, setEnd] = useState('00:00:10.000');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const handleCut = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP = ({ progress }) => setProgress(progress);
    ffmpeg.on('progress', onP);
    try {
      const inp = `inp_${file.name.replace(/\s+/g,'_')}`;
      const out = `cut_${inp}`;
      await ffmpeg.writeFile(inp, await fetchFile(file));
      await ffmpeg.exec(['-ss', start, '-i', inp, '-to', end, '-c', 'copy', out]);
      const data = await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer], { type: file.type || 'video/mp4' }));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile(out);
    } catch(e){ console.error(e); } finally { setProcessing(false); ffmpeg.off('progress', onP); }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{ background: 'var(--info-bg-violet)', border: '1px solid var(--info-border-violet)' }}>
        <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
        <p style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold text-indigo-500">Keyframe snapping:</span> Cuts align to the nearest keyframe for stream-copy speed. Offset is usually under 2 seconds.
        </p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={setFile} title="Upload Video to Trim" description="Select any video format" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-pill)', border: '1px solid var(--border-card)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Scissors size={15} className="text-violet-500 flex-shrink-0" />
              <span className="font-body text-sm truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
            </div>
            <button onClick={() => setFile(null)} className="text-xs font-body ml-4 flex-shrink-0 transition-colors cursor-pointer"
              style={{ color: 'var(--text-faint)' }} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[['Start Time', start, setStart], ['End Time', end, setEnd]].map(([label, val, setter]) => (
              <div key={label}>
                <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
                <input type="text" value={val} onChange={e=>setter(e.target.value)} placeholder="HH:MM:SS.mmm"
                  className="w-full font-mono text-sm rounded-xl px-4 py-3 outline-none transition-all"
                  style={{ background:'var(--bg-input)', border:'1px solid var(--border-input)', color:'var(--text-primary)' }}
                  onFocus={e=>e.target.style.borderColor='rgba(139,92,246,0.6)'} onBlur={e=>e.target.style.borderColor='var(--border-input)'} />
              </div>
            ))}
          </div>

          <button disabled={processing} onClick={handleCut}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer transition-all duration-150 disabled:opacity-40"
            style={{ background:'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow:'0 0 20px rgba(99,102,241,0.35)' }}>
            {processing ? 'Cutting...' : 'Cut Video Losslessly'}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Seeking & copying stream..." />}

      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-8 rounded-2xl animate-slide-up"
          style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5} />
          <div className="text-center">
            <h3 className="font-heading font-semibold text-emerald-500 text-lg">Done instantly!</h3>
            <p className="text-sm font-body mt-1" style={{ color:'var(--text-muted)' }}>Zero quality loss — stream copied</p>
          </div>
          <a href={URL.createObjectURL(outputBlob)} download={`cut_${file.name}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all duration-150 hover:scale-105 text-emerald-600"
            style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>
            Download Result
          </a>
        </div>
      )}
    </div>
  );
}
