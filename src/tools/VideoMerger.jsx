import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Trash2, GripVertical, CheckCircle, Info } from 'lucide-react';

export default function VideoMerger() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const addFiles = (f) => setFiles(p => [...p, ...f]);
  const removeFile = (i) => setFiles(files.filter((_,idx)=>idx!==i));

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP = ({ progress }) => setProgress(progress);
    ffmpeg.on('progress', onP);
    try {
      let concat = ''; const names = [];
      for (let i=0;i<files.length;i++){
        const n=`v${i}_${files[i].name.replace(/[^a-zA-Z0-9.]/g,'')}`;
        names.push(n); await ffmpeg.writeFile(n, await fetchFile(files[i])); concat+=`file '${n}'\n`;
      }
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concat));
      const ext=files[0].name.split('.').pop(); const out=`merged.${ext}`;
      await ffmpeg.exec(['-f','concat','-safe','0','-i','concat.txt','-c','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:files[0].type||'video/mp4'}));
      await ffmpeg.deleteFile('concat.txt'); await ffmpeg.deleteFile(out);
      for(const n of names) await ffmpeg.deleteFile(n);
    } catch(e){ console.error(e); } finally { setProcessing(false); ffmpeg.off('progress',onP); }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{ background:'var(--info-bg-blue)', border:'1px solid var(--info-border-blue)' }}>
        <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p style={{ color:'var(--text-secondary)' }}>
          <span className="font-semibold text-blue-500">Codec matching required:</span> All clips must share the same resolution, frame rate, and codecs for lossless stream concatenation.
        </p>
      </div>

      <FileUploader onFileSelect={addFiles} multiple title="Add Videos to Queue" description="Drop multiple files at once" />

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-body font-semibold uppercase tracking-widest" style={{ color:'var(--text-faint)' }}>{files.length} file{files.length>1?'s':''} queued</span>
            <button onClick={()=>setFiles([])} className="text-xs font-body cursor-pointer transition-colors"
              style={{ color:'var(--text-faint)' }} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Clear all</button>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-hide pr-1">
            {files.map((f,i)=>(
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl group transition-all"
                style={{ background:'var(--bg-pill)', border:'1px solid var(--border-card)' }}>
                <GripVertical size={15} style={{ color:'var(--text-faint)' }} />
                <span className="flex-1 text-sm font-body truncate" style={{ color:'var(--text-primary)' }}>{i+1}. {f.name}</span>
                <button onClick={()=>removeFile(i)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" style={{ color:'var(--text-faint)' }}
                  onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <button disabled={processing||files.length<2} onClick={handleMerge}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer transition-all disabled:opacity-40"
            style={{ background:'linear-gradient(135deg, #2563EB, #1D4ED8)', boxShadow:'0 0 20px rgba(59,130,246,0.25)' }}>
            {processing ? 'Merging...' : files.length<2 ? 'Add at least 2 videos' : `Merge ${files.length} Videos`}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Concatenating streams..." />}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-8 rounded-2xl animate-slide-up"
          style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5} />
          <h3 className="font-heading font-semibold text-emerald-500 text-lg">Merge Complete!</h3>
          <a href={URL.createObjectURL(outputBlob)} download={`merged_${files[0].name}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>Download Merged File</a>
        </div>
      )}
    </div>
  );
}
