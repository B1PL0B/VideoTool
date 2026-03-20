import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Film, CheckCircle, Info, AlertCircle } from 'lucide-react';

const CONTAINERS = [
  { ext:'mp4',  label:'MP4',  mime:'video/mp4',         note:'H.264, H.265, AAC, MP3' },
  { ext:'mkv',  label:'MKV',  mime:'video/x-matroska',  note:'All codecs + subtitles' },
  { ext:'mov',  label:'MOV',  mime:'video/quicktime',   note:'Apple ProRes, H.264' },
  { ext:'webm', label:'WebM', mime:'video/webm',        note:'VP8/VP9, Opus/Vorbis only' },
  { ext:'avi',  label:'AVI',  mime:'video/x-msvideo',   note:'Legacy, no AAC support' },
  { ext:'ts',   label:'TS',   mime:'video/mp2t',        note:'H.264/H.265, AC-3, AAC' },
];

const WARNINGS = {
  webm: 'WebM only supports VP8/VP9 video and Opus/Vorbis audio. Other codecs may fail.',
  avi: 'AVI does not support AAC audio. The mux may fail if your source uses AAC.',
};

export default function ContainerRemuxer() {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState('mp4');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const srcExt = file ? file.name.split('.').pop().toLowerCase() : '';
  const targetInfo = CONTAINERS.find(c=>c.ext===target);
  const warning = WARNINGS[target];

  const handleRemux = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP=({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    try {
      const inp=`inp.${srcExt}`; const out=`remuxed.${target}`;
      await ffmpeg.writeFile(inp,await fetchFile(file));
      await ffmpeg.exec(['-i',inp,'-c','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:targetInfo.mime}));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile(out);
    } catch(e){console.error(e);}
    finally{setProcessing(false);ffmpeg.off('progress',onP);}
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'rgba(6,182,212,0.07)',border:'1px solid rgba(6,182,212,0.20)'}}>
        <Info size={16} className="text-cyan-500 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}><span className="font-semibold text-cyan-500">Lossless container swap:</span> Changes the outer wrapper (MKV ↔ MP4 ↔ MOV...) without touching any stream. All codecs remain bit-for-bit identical.</p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={f=>{setFile(f);setOutputBlob(null);}} title="Upload Video to Remux" description="Any container — MKV, MP4, MOV, AVI, WebM"/>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <div className="flex items-center gap-2 min-w-0"><Film size={14} className="text-cyan-500 flex-shrink-0"/>
              <span className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{file.name}</span></div>
            <button onClick={()=>{setFile(null);setOutputBlob(null);}} className="text-xs ml-3 flex-shrink-0 cursor-pointer"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>

          <div>
            <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>Target Container</label>
            <div className="grid grid-cols-3 gap-2">
              {CONTAINERS.map(c=>(
                <label key={c.ext} className="p-3 rounded-xl border cursor-pointer transition-all"
                  style={{background:target===c.ext?'rgba(6,182,212,0.08)':'var(--bg-pill)',border:`1px solid ${target===c.ext?'rgba(6,182,212,0.35)':'var(--border-card)'}`,opacity:srcExt===c.ext?0.4:1}}>
                  <input type="radio" className="hidden" checked={target===c.ext} disabled={srcExt===c.ext} onChange={()=>setTarget(c.ext)}/>
                  <div className="font-heading font-bold text-sm" style={{color:target===c.ext?'#06b6d4':'var(--text-primary)'}}>.{c.label}</div>
                  <div className="text-[10px] font-body mt-0.5" style={{color:'var(--text-muted)'}}>{c.note}</div>
                  {srcExt===c.ext && <div className="text-[9px] text-rose-500 mt-0.5">current</div>}
                </label>
              ))}
            </div>
          </div>

          {warning && (
            <div className="flex gap-3 p-3.5 rounded-xl text-sm font-body"
              style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.22)'}}>
              <AlertCircle size={15} className="text-amber-500 mt-0.5 flex-shrink-0"/>
              <p className="text-xs" style={{color:'var(--text-secondary)'}}>{warning}</p>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body"
            style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <span style={{color:'var(--text-muted)'}}>Remux:</span>
            <span className="font-mono font-bold text-cyan-500">.{srcExt}</span>
            <span style={{color:'var(--text-faint)'}}>→</span>
            <span className="font-mono font-bold text-indigo-500">.{target}</span>
          </div>

          <button disabled={processing||srcExt===target} onClick={handleRemux}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{background:'linear-gradient(135deg,#0891B2,#0E7490)',boxShadow:'0 0 20px rgba(6,182,212,0.25)'}}>
            {processing?'Remuxing...':`.${srcExt} → .${target} (lossless)`}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Rewrapping streams into new container..."/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <div className="text-center"><h3 className="font-heading font-semibold text-emerald-500 text-lg">Remux Complete!</h3>
            <p className="text-sm mt-1 font-body" style={{color:'var(--text-muted)'}}>Bit-perfect container swap</p></div>
          <a href={URL.createObjectURL(outputBlob)} download={`${file.name.replace(/\.[^.]+$/,'')}.${target}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>Download .{target} File</a>
        </div>
      )}
    </div>
  );
}
