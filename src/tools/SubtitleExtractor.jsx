import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { CheckCircle, AlertCircle, Subtitles, Download } from 'lucide-react';
import JSZip from 'jszip';

export default function SubtitleExtractor() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [probed, setProbed] = useState(false);
  const { ffmpeg } = useFFmpeg();

  const handleProbe = async (f) => {
    setFile(f); setTracks([]); setResults([]); setErrorMsg(''); setProbed(false);
    let log='';
    const Logger=({message})=>{log+=message+'\n';};
    ffmpeg.on('log',Logger);
    const ext=f.name.split('.').pop(); const inp=`probe.${ext}`;
    await ffmpeg.writeFile(inp,await fetchFile(f));
    try{ await ffmpeg.exec(['-i',inp]); }catch{}
    ffmpeg.off('log',Logger);
    await ffmpeg.deleteFile(inp);
    const found=[];
    const lines=log.split('\n');
    for(const line of lines){
      const m=line.match(/Stream #0:(\d+)(?:\((\w+)\))?.*?: Subtitle: (\S+)/);
      if(m) found.push({streamIdx:parseInt(m[1]),subIdx:found.length,lang:m[2]||'und',codec:m[3],selected:true});
    }
    setTracks(found);
    setProbed(true);
    if(found.length===0) setErrorMsg('No subtitle streams detected. Bitmap-based subs (PGS/DVD) cannot be text-extracted.');
  };

  const toggleTrack = (i) => setTracks(t=>t.map((tr,idx)=>idx===i?{...tr,selected:!tr.selected}:tr));

  const handleExtract = async () => {
    if (!file||!tracks.some(t=>t.selected)) return;
    setProcessing(true); setProgress(0); setResults([]); setErrorMsg('');
    const ext=file.name.split('.').pop(); const inp=`inp.${ext}`;
    await ffmpeg.writeFile(inp,await fetchFile(file));
    const sel=tracks.filter(t=>t.selected); const extracted=[];
    for(let i=0;i<sel.length;i++){
      const t=sel[i];
      setProgress(i/sel.length);
      const outExt=t.codec.includes('webvtt')?'vtt':'srt';
      const out=`sub_${t.subIdx}_${t.lang}.${outExt}`;
      try {
        await ffmpeg.exec(['-i',inp,'-map',`0:${t.streamIdx}`,'-c','copy',out]);
        const data=await ffmpeg.readFile(out);
        const blob=new Blob([data.buffer],{type:outExt==='vtt'?'text/vtt':'text/plain'});
        extracted.push({name:out,blob,lang:t.lang,codec:t.codec});
        await ffmpeg.deleteFile(out);
      }catch(e){ extracted.push({name:out,error:e.message,lang:t.lang,codec:t.codec}); }
    }
    await ffmpeg.deleteFile(inp);
    setResults(extracted); setProgress(1); setProcessing(false);
  };

  const downloadZip = async () => {
    const zip=new JSZip();
    results.filter(r=>r.blob).forEach(r=>zip.file(r.name,r.blob));
    const blob=await zip.generateAsync({type:'blob'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='subtitles.zip'; a.click();
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <FileUploader onFileSelect={handleProbe} icon="video" title="Upload MKV / MP4 with Subtitles" description="We'll probe all embedded soft-subtitle streams"/>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <span className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{file.name}</span>
            <button onClick={()=>{setFile(null);setTracks([]);setResults([]);setErrorMsg('');setProbed(false);}} className="text-xs ml-3 flex-shrink-0 cursor-pointer"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>

          {errorMsg && (
            <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
              style={{background:'var(--warn-bg)',border:'1px solid var(--warn-border)'}}>
              <AlertCircle size={16} className="text-rose-500 mt-0.5 flex-shrink-0"/>
              <p style={{color:'var(--text-secondary)'}}>{errorMsg}</p>
            </div>
          )}

          {tracks.length > 0 && (
            <div>
              <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>
                {tracks.length} Subtitle Track{tracks.length>1?'s':''} — select to extract
              </label>
              <div className="space-y-2">
                {tracks.map((t,i)=>(
                  <label key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                    style={{background:t.selected?'rgba(99,102,241,0.08)':'var(--bg-pill)',border:`1px solid ${t.selected?'rgba(99,102,241,0.30)':'var(--border-card)'}`}}>
                    <input type="checkbox" className="hidden" checked={t.selected} onChange={()=>toggleTrack(i)}/>
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{borderColor:t.selected?'#6366F1':'var(--border-input)',background:t.selected?'#6366F1':'transparent'}}>
                      {t.selected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <Subtitles size={14} className="text-indigo-500 flex-shrink-0"/>
                    <div className="flex-1">
                      <span className="text-sm font-body font-medium" style={{color:'var(--text-primary)'}}>Track {t.subIdx+1}</span>
                      <span className="text-xs font-mono ml-2 text-indigo-500">{t.codec}</span>
                      {t.lang!=='und' && <span className="text-xs ml-2" style={{color:'var(--text-muted)'}}>({t.lang})</span>}
                    </div>
                    <span className="text-xs font-mono" style={{color:'var(--text-faint)'}}>→ .{t.codec.includes('webvtt')?'vtt':'srt'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tracks.some(t=>t.selected) && (
            <button disabled={processing} onClick={handleExtract}
              className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
              style={{background:'linear-gradient(135deg,#4F46E5,#3730A3)',boxShadow:'0 0 20px rgba(99,102,241,0.28)'}}>
              {processing?'Extracting...':tracks.filter(t=>t.selected).length>1?`Extract ${tracks.filter(t=>t.selected).length} Tracks → ZIP`:'Extract Subtitle'}
            </button>
          )}
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Extracting subtitle streams..."/>}
      {results.length > 0 && !processing && (
        <div className="p-5 rounded-2xl animate-slide-up space-y-3"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-emerald-500">{results.filter(r=>r.blob).length} subtitle{results.filter(r=>r.blob).length>1?'s':''} extracted</h3>
            {results.filter(r=>r.blob).length>1 && (
              <button onClick={downloadZip} className="px-4 py-2 rounded-lg font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
                style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>⬇ ZIP All</button>
            )}
          </div>
          {results.map((r,i)=>(
            <div key={i} className="flex items-center gap-3 text-xs font-body px-3 py-2.5 rounded-xl" style={{background:'var(--bg-pill)'}}>
              {r.blob ? <CheckCircle size={13} className="text-emerald-500"/> : <AlertCircle size={13} className="text-rose-500"/>}
              <span className="truncate flex-1" style={{color:r.blob?'var(--text-primary)':'#f43f5e'}}>{r.name}</span>
              {r.blob && <a href={URL.createObjectURL(r.blob)} download={r.name} className="flex items-center gap-1 text-indigo-500 hover:underline cursor-pointer flex-shrink-0"><Download size={11}/>Save</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
