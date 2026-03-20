import React, { useState, useRef } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import VideoPreview from '../components/VideoPreview';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Trash2, GripVertical, CheckCircle, Info, Plus, Film } from 'lucide-react';

const fmtDur = (s) => {
  if (!s||isNaN(s)) return '?';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
};

export default function VideoMerger() {
  const [items, setItems] = useState([]);   // {file, duration, objectURL}
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const addFiles = (files) => {
    const newItems = files.map(f => ({ file: f, duration: null, objectURL: URL.createObjectURL(f) }));
    setItems(p => [...p, ...newItems]);
    // probe durations
    newItems.forEach((item, offset) => {
      const v = document.createElement('video'); v.preload='metadata';
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(v.src);
        setItems(prev => {
          const idx = prev.findIndex(i => i.file === item.file);
          if (idx < 0) return prev;
          const copy = [...prev]; copy[idx].duration = v.duration; return copy;
        });
      };
      v.src = item.objectURL;
    });
  };

  const removeItem = (i) => setItems(items.filter((_,idx)=>idx!==i));

  // Drag-and-drop reorder
  const handleDragStart = (i) => setDragIdx(i);
  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const copy = [...items]; const [moved] = copy.splice(dragIdx, 1); copy.splice(i, 0, moved);
    setItems(copy); setDragIdx(i);
  };
  const handleDragEnd = () => setDragIdx(null);

  const totalDuration = items.reduce((sum,i)=>sum+(i.duration||0),0);

  const handleMerge = async () => {
    if (items.length < 2) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP = ({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    try {
      let concat=''; const names=[];
      for(let i=0;i<items.length;i++){
        const n=`v${i}_${items[i].file.name.replace(/[^a-zA-Z0-9.]/g,'')}`;
        names.push(n); await ffmpeg.writeFile(n,await fetchFile(items[i].file)); concat+=`file '${n}'\n`;
      }
      await ffmpeg.writeFile('concat.txt',new TextEncoder().encode(concat));
      const ext=items[0].file.name.split('.').pop(); const out=`merged.${ext}`;
      await ffmpeg.exec(['-f','concat','-safe','0','-i','concat.txt','-c','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:items[0].file.type||'video/mp4'}));
      await ffmpeg.deleteFile('concat.txt'); await ffmpeg.deleteFile(out);
      for(const n of names) await ffmpeg.deleteFile(n);
    } catch(e){console.error(e);}
    finally{setProcessing(false);ffmpeg.off('progress',onP);}
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'var(--info-bg-blue)',border:'1px solid var(--info-border-blue)'}}>
        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}><span className="font-semibold text-blue-500">Drag to reorder.</span> All clips must share resolution, frame rate, and codecs for lossless concat.</p>
      </div>

      <FileUploader onFileSelect={addFiles} multiple title="Add Videos to Queue" description="Drop multiple files — drag to reorder"/>

      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-body font-semibold uppercase tracking-widest" style={{color:'var(--text-faint)'}}>
              {items.length} clips · Total {fmtDur(totalDuration)}
            </span>
            <button onClick={()=>setItems([])} className="text-xs font-body cursor-pointer transition-colors"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Clear all</button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {items.map((item,i)=>(
              <div key={i} draggable onDragStart={()=>handleDragStart(i)} onDragOver={e=>handleDragOver(e,i)} onDragEnd={handleDragEnd}
                className="flex items-center gap-3 px-3 py-3 rounded-xl group transition-all cursor-grab active:cursor-grabbing"
                style={{background: dragIdx===i ? 'var(--nav-active-bg)' : 'var(--bg-pill)', border:'1px solid var(--border-card)'}}>
                {/* Thumbnail */}
                <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                  <video src={item.objectURL} className="w-full h-full object-cover" muted playsInline preload="metadata" style={{filter:'brightness(0.95)'}}/>
                </div>
                <GripVertical size={14} style={{color:'var(--text-faint)'}}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{i+1}. {item.file.name}</div>
                  <div className="text-xs font-mono mt-0.5" style={{color:'var(--text-muted)'}}>{item.duration ? fmtDur(item.duration) : '...'}</div>
                </div>
                <button onClick={()=>removeItem(i)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}><Trash2 size={14}/></button>
              </div>
            ))}
          </div>

          <button disabled={processing||items.length<2} onClick={handleMerge}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{background:'linear-gradient(135deg,#2563EB,#1D4ED8)',boxShadow:'0 0 20px rgba(59,130,246,0.28)'}}>
            {processing?'Merging...':`Merge ${items.length} Clips`}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Concatenating streams..."/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <h3 className="font-heading font-semibold text-emerald-500 text-lg">Merge Complete!</h3>
          <a href={URL.createObjectURL(outputBlob)} download={`merged_${items[0].file.name}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>Download Merged File</a>
        </div>
      )}
    </div>
  );
}
