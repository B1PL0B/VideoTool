import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function SubtitleExtractor() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [outExt, setOutExt] = useState('srt');
  const { ffmpeg } = useFFmpeg();

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null); setErrorMsg('');
    let subCodec=null;
    const Intercept = ({ message }) => { if (message.includes('Subtitle:')) subCodec=message; };
    ffmpeg.on('log', Intercept);
    const onP = ({ progress }) => setProgress(progress); ffmpeg.on('progress', onP);
    try {
      const inp=`inp_${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
      await ffmpeg.writeFile(inp, await fetchFile(file));
      await ffmpeg.exec(['-i', inp]);
      if (!subCodec) { setErrorMsg('No subtitle streams detected in this file.'); await ffmpeg.deleteFile(inp); return; }
      const ext=subCodec.includes('webvtt')?'vtt':'srt'; setOutExt(ext);
      const out=`sub.${ext}`;
      await ffmpeg.exec(['-i',inp,'-map','0:s:0','-c','copy',out]);
      try {
        const data=await ffmpeg.readFile(out);
        setOutputBlob(new Blob([data.buffer],{type:ext==='vtt'?'text/vtt':'text/plain'}));
        await ffmpeg.deleteFile(out);
      } catch { setErrorMsg('Could not read subtitles — may be bitmap-based (PGS/DVD) format.'); }
      await ffmpeg.deleteFile(inp);
    } catch(e){ console.error(e); setErrorMsg('An unexpected error occurred.'); }
    finally { setProcessing(false); ffmpeg.off('log',Intercept); ffmpeg.off('progress',onP); }
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <FileUploader onFileSelect={setFile} icon="video" title="Upload MKV / MP4 with Subtitles" description="We'll probe for embedded soft-subtitle streams" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background:'var(--bg-pill)', border:'1px solid var(--border-card)' }}>
            <span className="text-sm font-body truncate" style={{ color:'var(--text-primary)' }}>{file.name}</span>
            <button onClick={()=>{setFile(null);setErrorMsg('');setOutputBlob(null);}} className="text-xs font-body ml-4 flex-shrink-0 transition-colors cursor-pointer"
              style={{ color:'var(--text-faint)' }} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>
          <div className="px-4 py-3 rounded-xl text-xs font-body" style={{ background:'var(--bg-pill)', border:'1px solid var(--border-card)', color:'var(--text-muted)' }}>
            Detects: <span className="text-sky-500">subrip (SRT), WebVTT, ASS/SSA</span> — bitmap formats (PGS, DVD) cannot be text-extracted.
          </div>
          <button disabled={processing} onClick={handleExtract}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{ background:'linear-gradient(135deg, #0284C7, #0369A1)', boxShadow:'0 0 20px rgba(14,165,233,0.22)' }}>
            {processing ? 'Scanning streams...' : 'Scan & Extract Subtitles'}
          </button>
          {errorMsg && (
            <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
              style={{ background:'var(--warn-bg)', border:'1px solid var(--warn-border)' }}>
              <AlertCircle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
              <p style={{ color:'var(--text-secondary)' }}>{errorMsg}</p>
            </div>
          )}
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Scanning container for subtitle tracks..." />}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-8 rounded-2xl animate-slide-up"
          style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5} />
          <div className="text-center">
            <h3 className="font-heading font-semibold text-emerald-500 text-lg">Subtitles Extracted!</h3>
            <p className="text-sm font-body mt-1" style={{ color:'var(--text-muted)' }}>Format: <span className="text-sky-500">.{outExt}</span></p>
          </div>
          <a href={URL.createObjectURL(outputBlob)} download={`subtitle_${file.name.split('.')[0]}.${outExt}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>Download .{outExt} File</a>
        </div>
      )}
    </div>
  );
}
