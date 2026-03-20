import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Eye, CheckCircle, Info, Plus, Trash2 } from 'lucide-react';
import JSZip from 'jszip';

export default function ThumbnailExtractor() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState('single');   // 'single' | 'batch'
  const [timestamp, setTimestamp] = useState('00:00:05');
  const [interval, setInterval] = useState('10');
  const [format, setFormat] = useState('png');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [statusText, setStatus] = useState('');
  const [thumbs, setThumbs] = useState([]);
  const { ffmpeg } = useFFmpeg();

  const getDuration = (f) => new Promise((res,rej)=>{
    const v=document.createElement('video'); v.preload='metadata';
    v.onloadedmetadata=()=>{URL.revokeObjectURL(v.src);res(v.duration);};
    v.onerror=()=>rej('Cannot read'); v.src=URL.createObjectURL(f);
  });

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setThumbs([]);
    const inp=`inp_${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
    await ffmpeg.writeFile(inp, await fetchFile(file));

    try {
      if (mode==='single') {
        setStatus('Extracting frame...');
        const out=`thumb.${format}`;
        await ffmpeg.exec(['-ss',timestamp,'-i',inp,'-vframes','1','-q:v','2',out]);
        const data=await ffmpeg.readFile(out);
        const blob=new Blob([data.buffer],{type:`image/${format}`});
        setThumbs([{name:`thumb_${timestamp.replace(/:/g,'-')}.${format}`,blob,url:URL.createObjectURL(blob)}]);
        await ffmpeg.deleteFile(out);
        setProgress(1);
      } else {
        const dur = duration || await getDuration(file);
        const intv = parseFloat(interval)||10;
        const frames=Math.floor(dur/intv); const results=[];
        for(let i=0;i<frames;i++){
          const t=i*intv;
          setStatus(`Frame ${i+1} of ${frames}`); setProgress(i/frames);
          const out=`thumb_${i}.${format}`;
          await ffmpeg.exec(['-ss',t.toString(),'-i',inp,'-vframes','1','-q:v','2',out]);
          const data=await ffmpeg.readFile(out);
          const blob=new Blob([data.buffer],{type:`image/${format}`});
          results.push({name:`frame_${String(i).padStart(4,'0')}_${Math.floor(t)}s.${format}`,blob,url:URL.createObjectURL(blob)});
          await ffmpeg.deleteFile(out);
        }
        setThumbs(results); setProgress(1);
      }
    } catch(e){console.error(e); setStatus('Error: '+e.message);}
    finally{await ffmpeg.deleteFile(inp); setProcessing(false);}
  };

  const downloadZip = async () => {
    const zip=new JSZip();
    thumbs.forEach(t=>zip.file(t.name,t.blob));
    const blob=await zip.generateAsync({type:'blob'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='thumbnails.zip'; a.click();
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <FileUploader onFileSelect={f=>{setFile(f);setThumbs([]);}} title="Upload Video" description="Extract any frame as PNG or JPEG"/>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <div className="flex items-center gap-2 min-w-0"><Eye size={14} className="text-lime-500 flex-shrink-0"/>
              <span className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{file.name}</span></div>
            <button onClick={()=>{setFile(null);setThumbs([]);}} className="text-xs ml-3 flex-shrink-0 cursor-pointer"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>

          {/* Mode selector */}
          <div className="flex gap-3">
            {['single','batch'].map(m=>(
              <label key={m} className="flex-1 p-3.5 rounded-xl border cursor-pointer transition-all"
                style={{background:mode===m?'rgba(132,204,22,0.08)':'var(--bg-pill)',border:`1px solid ${mode===m?'rgba(132,204,22,0.35)':'var(--border-card)'}`}}>
                <input type="radio" className="hidden" checked={mode===m} onChange={()=>setMode(m)}/>
                <div className="text-sm font-heading font-semibold capitalize mb-0.5" style={{color:mode===m?'#84cc16':'var(--text-primary)'}}>{m} Frame{m==='batch'?'s':''}</div>
                <div className="text-xs font-body" style={{color:'var(--text-muted)'}}>{m==='single'?'Extract one specific frame':'Every N seconds → ZIP'}</div>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mode==='single' ? (
              <div className="col-span-2">
                <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>Timestamp</label>
                <input type="text" value={timestamp} onChange={e=>setTimestamp(e.target.value)} placeholder="HH:MM:SS"
                  className="w-full font-mono text-sm rounded-xl px-4 py-3 outline-none"
                  style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}}
                  onFocus={e=>e.target.style.borderColor='rgba(132,204,22,0.5)'} onBlur={e=>e.target.style.borderColor='var(--border-input)'}/>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>Interval (sec)</label>
                <input type="number" min="1" value={interval} onChange={e=>setInterval(e.target.value)}
                  className="w-full font-mono text-sm rounded-xl px-4 py-3 outline-none"
                  style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}}
                  onFocus={e=>e.target.style.borderColor='rgba(132,204,22,0.5)'} onBlur={e=>e.target.style.borderColor='var(--border-input)'}/>
              </div>
            )}
            <div className={mode==='single'?'hidden':''}>
              <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>Format</label>
              <select value={format} onChange={e=>setFormat(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none cursor-pointer"
                style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}}>
                <option value="png">PNG (lossless)</option>
                <option value="jpg">JPEG (compressed)</option>
              </select>
            </div>
            {mode==='single' && (
              <div>
                <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>Format</label>
                <select value={format} onChange={e=>setFormat(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none cursor-pointer"
                  style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}}>
                  <option value="png">PNG (lossless)</option>
                  <option value="jpg">JPEG (compressed)</option>
                </select>
              </div>
            )}
          </div>

          <button disabled={processing} onClick={handleExtract}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{background:'linear-gradient(135deg,#65a30d,#4d7c0f)',boxShadow:'0 0 20px rgba(132,204,22,0.25)'}}>
            {processing?statusText:mode==='single'?'Extract Frame':'Extract All Frames'}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText={statusText}/>}

      {thumbs.length > 0 && !processing && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-lime-500">{thumbs.length} frame{thumbs.length>1?'s':''} extracted</h3>
            {thumbs.length===1 ? (
              <a href={thumbs[0].url} download={thumbs[0].name}
                className="px-4 py-2 rounded-lg font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-lime-600"
                style={{background:'rgba(132,204,22,0.10)',border:'1px solid rgba(132,204,22,0.30)'}}>↓ Download</a>
            ) : (
              <button onClick={downloadZip} className="px-4 py-2 rounded-lg font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-lime-600"
                style={{background:'rgba(132,204,22,0.10)',border:'1px solid rgba(132,204,22,0.30)'}}>⬇ Download ZIP</button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto scrollbar-hide">
            {thumbs.map((t,i)=>(
              <a key={i} href={t.url} download={t.name} className="group relative rounded-xl overflow-hidden cursor-pointer block"
                style={{border:'1px solid var(--border-card)'}}>
                <img src={t.url} alt={t.name} className="w-full h-20 object-cover transition-all group-hover:scale-105"/>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold">↓</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
