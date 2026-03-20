import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { downloadBlob } from '../utils/download';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { GripVertical, Trash2, CheckCircle, Info, Plus } from 'lucide-react';
import JSZip from 'jszip';

const fmtSec = (s) => {
  if (!s||isNaN(s)) return '?:??';
  const m=Math.floor(s/60); return `${m}:${String(Math.floor(s%60)).padStart(2,'0')}`;
};

export default function BatchCutter() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState([{ start:'00:00:00', end:'00:00:10', label:'' }]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [statusText, setStatus] = useState('');
  const [outputBlobs, setOutputBlobs] = useState([]);
  const { ffmpeg } = useFFmpeg();

  const addRow = () => setSegments(s=>[...s,{start:'00:00:00',end:'00:00:10',label:''}]);
  const removeRow = (i) => setSegments(s=>s.filter((_,idx)=>idx!==i));
  const updateRow = (i,key,v) => setSegments(s=>s.map((r,idx)=>idx===i?{...r,[key]:v}:r));

  const handleCut = async () => {
    if (!file || segments.length===0) return;
    setProcessing(true); setProgress(0); setOutputBlobs([]);
    const results = [];
    const ext = file.name.split('.').pop();
    const inp = `inp_${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
    await ffmpeg.writeFile(inp, await fetchFile(file));

    for (let i=0; i<segments.length; i++) {
      const seg = segments[i];
      const outName = seg.label ? `${seg.label.replace(/\s+/g,'_')}.${ext}` : `clip_${i+1}.${ext}`;
      setStatus(`Cutting clip ${i+1} of ${segments.length}: ${outName}`);
      setProgress(i/segments.length);
      try {
        await ffmpeg.exec(['-ss',seg.start,'-i',inp,'-to',seg.end,'-c','copy',outName]);
        const data = await ffmpeg.readFile(outName);
        results.push({ name: outName, blob: new Blob([data.buffer],{type:file.type||'video/mp4'}) });
        await ffmpeg.deleteFile(outName);
      } catch(e){ results.push({name:outName, error:e.message}); }
    }

    await ffmpeg.deleteFile(inp);
    setOutputBlobs(results);
    setProgress(1);
    setStatus('Done');
    setProcessing(false);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    for (const r of outputBlobs) {
      if (r.blob) zip.file(r.name, r.blob);
    }
    const blob = await zip.generateAsync({type:'blob'});
    downloadBlob(blob, 'clips.zip');
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'var(--info-bg-violet)',border:'1px solid var(--info-border-violet)'}}>
        <Info size={16} className="text-violet-500 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}>Add multiple [start, end] segments below. Each clip is losslessly stream-copied and bundled in a single <strong>ZIP</strong> download.</p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={f=>{setFile(f);setOutputBlobs([]);}} title="Upload Source Video" description="All clips will be extracted from this file"/>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <span className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{file.name}</span>
            <button onClick={()=>{setFile(null);setOutputBlobs([]);}} className="text-xs ml-3 flex-shrink-0 cursor-pointer"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>

          {/* Segment rows */}
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1">
              {['Start','End','Label (optional)',''].map(h=>(
                <div key={h} className="text-[10px] font-body font-bold uppercase tracking-widest" style={{color:'var(--text-faint)'}}>{h}</div>
              ))}
            </div>
            {segments.map((seg,i)=>(
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
                {['start','end','label'].map(key=>(
                  <input key={key} type="text" value={seg[key]} onChange={e=>updateRow(i,key,e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-xs font-mono outline-none"
                    style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}}
                    placeholder={key==='label'?`clip_${i+1}`:key==='start'?'00:00:00':'00:00:10'}
                    onFocus={e=>e.target.style.borderColor='rgba(168,85,247,0.5)'} onBlur={e=>e.target.style.borderColor='var(--border-input)'}/>
                ))}
                <button onClick={()=>removeRow(i)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  style={{background:'var(--bg-btn-ghost)',color:'var(--text-faint)'}}
                  onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>

          <button onClick={addRow} className="w-full py-2.5 rounded-xl text-sm font-heading font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all"
            style={{background:'var(--bg-btn-ghost)',border:'1px dashed var(--border-input)',color:'var(--text-muted)'}}>
            <Plus size={15}/> Add Segment
          </button>

          <button disabled={processing||segments.length===0} onClick={handleCut}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{background:'linear-gradient(135deg,#7C3AED,#6D28D9)',boxShadow:'0 0 20px rgba(124,58,237,0.35)'}}>
            {processing ? `${statusText}` : `Cut ${segments.length} Segment${segments.length!==1?'s':''} → ZIP`}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText={statusText}/>}

      {outputBlobs.length > 0 && !processing && (
        <div className="p-5 rounded-2xl animate-slide-up space-y-3" style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-emerald-500">{outputBlobs.filter(b=>b.blob).length} clips ready</h3>
            <button onClick={downloadZip} className="px-4 py-2 rounded-lg font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
              style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>⬇ Download ZIP</button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
            {outputBlobs.map((r,i)=>(
              <div key={i} className="flex items-center gap-2 text-xs font-mono px-2 py-1.5 rounded-lg" style={{background:'var(--bg-pill)'}}>
                {r.blob ? <CheckCircle size={12} className="text-emerald-500"/> : <span className="text-rose-500">✗</span>}
                <span className="truncate" style={{color:r.blob?'var(--text-primary)':'#f43f5e'}}>{r.name}</span>
                {r.blob && <button onClick={() => downloadBlob(r.blob, r.name)} className="ml-auto text-indigo-500 hover:underline cursor-pointer">↓</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
