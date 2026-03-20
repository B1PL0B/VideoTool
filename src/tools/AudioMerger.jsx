import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import VideoPreview from '../components/VideoPreview';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Film, Music, CheckCircle } from 'lucide-react';

export default function AudioMerger() {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [mode, setMode] = useState('replace');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const handleMerge = async () => {
    if (!videoFile||!audioFile) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP=({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    try {
      const v=`v.${videoFile.name.split('.').pop()}`;
      const a=`a.${audioFile.name.split('.').pop()}`;
      const ext=videoFile.name.split('.').pop(); const o=`muxed.${ext}`;
      await ffmpeg.writeFile(v,await fetchFile(videoFile));
      await ffmpeg.writeFile(a,await fetchFile(audioFile));
      const args = mode==='replace'
        ? ['-i',v,'-i',a,'-c','copy','-map','0:v:0','-map','1:a:0',o]
        : ['-i',v,'-i',a,'-c','copy','-map','0','-map','1:a:0',o];
      await ffmpeg.exec(args);
      const data=await ffmpeg.readFile(o);
      setOutputBlob(new Blob([data.buffer],{type:videoFile.type||'video/mp4'}));
      await ffmpeg.deleteFile(v); await ffmpeg.deleteFile(a); await ffmpeg.deleteFile(o);
    }catch(e){console.error(e);}
    finally{setProcessing(false);ffmpeg.off('progress',onP);}
  };

  const ModeCard=({id,label,sub})=>(
    <label className="flex-1 p-4 rounded-xl border cursor-pointer transition-all"
      style={{background:mode===id?'rgba(20,184,166,0.07)':'var(--bg-pill)',border:`1px solid ${mode===id?'rgba(20,184,166,0.35)':'var(--border-card)'}`}}>
      <input type="radio" className="hidden" checked={mode===id} onChange={()=>setMode(id)}/>
      <div className="text-sm font-heading font-semibold mb-0.5" style={{color:mode===id?'#14b8a6':'var(--text-primary)'}}>{label}</div>
      <div className="text-xs font-body" style={{color:'var(--text-muted)'}}>{sub}</div>
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {/* Video slot */}
        {!videoFile ? (
          <FileUploader onFileSelect={setVideoFile} icon="video" title="Video File" description="Base video"/>
        ) : (
          <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <div className="flex items-center gap-2 text-teal-500"><Film size={14}/><span className="text-xs font-heading font-semibold uppercase tracking-wider">Video</span></div>
            {/* Tiny preview */}
            <video src={URL.createObjectURL(videoFile)} className="w-full h-20 object-cover rounded-lg bg-black" muted playsInline preload="metadata"/>
            <span className="text-xs font-body truncate" style={{color:'var(--text-primary)'}}>{videoFile.name}</span>
            <button onClick={()=>setVideoFile(null)} className="text-xs cursor-pointer text-left transition-colors"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>
        )}
        {/* Audio slot */}
        {!audioFile ? (
          <FileUploader onFileSelect={setAudioFile} accept="audio/*,video/*" icon="audio" title="Audio File" description="New soundtrack"/>
        ) : (
          <div className="flex flex-col gap-2 p-4 rounded-2xl justify-between" style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <div className="flex items-center gap-2 text-amber-500"><Music size={14}/><span className="text-xs font-heading font-semibold uppercase tracking-wider">Audio</span></div>
            <span className="text-xs font-body truncate flex-1 mt-2" style={{color:'var(--text-primary)'}}>{audioFile.name}</span>
            <button onClick={()=>setAudioFile(null)} className="text-xs cursor-pointer text-left transition-colors mt-1"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-body font-semibold uppercase tracking-widest mb-3" style={{color:'var(--text-faint)'}}>Merge Strategy</p>
        <div className="flex gap-3">
          <ModeCard id="replace" label="Replace Audio" sub="Strips original, uses new"/>
          <ModeCard id="add" label="Add as Track 2" sub="Keeps original + adds new"/>
        </div>
      </div>

      <button disabled={processing||!videoFile||!audioFile} onClick={handleMerge}
        className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
        style={{background:'linear-gradient(135deg,#0D9488,#0F766E)',boxShadow:'0 0 20px rgba(20,184,166,0.22)'}}>
        {processing?'Muxing...':'Mux Audio & Video'}
      </button>

      {processing && <ProgressBar progress={progress} statusText="Muxing streams losslessly..."/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <h3 className="font-heading font-semibold text-emerald-500">Mux Complete!</h3>
          <a href={URL.createObjectURL(outputBlob)} download={`muxed_${videoFile.name}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>Download Muxed Video</a>
        </div>
      )}
    </div>
  );
}
