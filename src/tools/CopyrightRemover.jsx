import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { ShieldBan, Shuffle, CheckCircle } from 'lucide-react';

export default function CopyrightRemover() {
  const [file, setFile] = useState(null);
  const [segmentLen, setSegmentLen] = useState('5');
  const [skipLen, setSkipLen] = useState('0.5');
  const [shuffle, setShuffle] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const getDuration = (f) => new Promise((res,rej) => {
    const v=document.createElement('video'); v.preload='metadata';
    v.onloadedmetadata=()=>{ URL.revokeObjectURL(v.src); res(v.duration); };
    v.onerror=()=>rej('Cannot read metadata'); v.src=URL.createObjectURL(f);
  });

  const processVideo = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null); setStatusText('Probing duration...');
    const onP=({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    try {
      const dur=await getDuration(file);
      const segL=parseFloat(segmentLen); const skipL=parseFloat(skipLen);
      if (isNaN(segL)||segL<=0) throw new Error('Invalid segment length');
      const inp=`inp_${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
      const ext=file.name.split('.').pop();
      await ffmpeg.writeFile(inp, await fetchFile(file));
      const segs=[]; let cur=0; let i=0;
      while(cur<dur){
        setStatusText(`Generating fragment ${i+1}...`); setProgress(cur/dur*0.9);
        const end=Math.min(cur+segL,dur); const sn=`seg_${i}.${ext}`;
        await ffmpeg.exec(['-ss',cur.toString(),'-i',inp,'-t',(end-cur).toString(),'-c','copy',sn]);
        segs.push(sn); cur=end+skipL; i++;
      }
      let final=[...segs];
      if (shuffle){ setStatusText('Shuffling fragments...'); final.sort(()=>Math.random()-0.5); }
      setStatusText('Concatenating...'); setProgress(0.9);
      const cc=final.map(s=>`file '${s}'`).join('\n');
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(cc));
      const out=`bypassed.${ext}`;
      await ffmpeg.exec(['-f','concat','-safe','0','-i','concat.txt','-c','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:file.type||'video/mp4'}));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile('concat.txt'); await ffmpeg.deleteFile(out);
      for(const s of segs) await ffmpeg.deleteFile(s);
      setProgress(1);
    } catch(e){ console.error(e); setStatusText('Error: '+e.message); }
    finally { setProcessing(false); ffmpeg.off('progress',onP); }
  };

  const NumInput=({label,sub,value,onChange})=>(
    <div>
      <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-1.5" style={{ color:'var(--text-muted)' }}>{label}</label>
      <input type="number" step="0.1" value={value} onChange={e=>onChange(e.target.value)}
        className="w-full font-mono text-sm rounded-xl px-4 py-3 outline-none transition-all"
        style={{ background:'var(--bg-input)', border:'1px solid var(--border-input)', color:'var(--text-primary)' }}
        onFocus={e=>e.target.style.borderColor='rgba(225,29,72,0.5)'} onBlur={e=>e.target.style.borderColor='var(--border-input)'}/>
      <p className="text-[11px] font-body mt-1.5" style={{ color:'var(--text-faint)' }}>{sub}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{ background:'var(--warn-bg)', border:'1px solid var(--warn-border)' }}>
        <ShieldBan size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
        <p style={{ color:'var(--text-secondary)' }}>
          <span className="font-semibold text-rose-500">Hash Disruption Engine:</span> Splits into timed fragments, drops micro-gaps to break fingerprinting, then stitches back. 100% lossless.
        </p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={setFile} title="Upload Video to Process" description="Supports MP4, MKV, MOV, AVI and more" />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background:'var(--bg-pill)', border:'1px solid var(--border-card)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldBan size={15} className="text-rose-500 flex-shrink-0" />
              <span className="font-body text-sm truncate" style={{ color:'var(--text-primary)' }}>{file.name}</span>
            </div>
            <button onClick={()=>setFile(null)} className="text-xs font-body ml-4 flex-shrink-0 transition-colors cursor-pointer"
              style={{ color:'var(--text-faint)' }} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <NumInput label="Segment Length (sec)" sub="Duration of each kept chunk" value={segmentLen} onChange={setSegmentLen}/>
            <NumInput label="Skip Duration (sec)" sub="Dropped between each chunk" value={skipLen} onChange={setSkipLen}/>
          </div>

          <label className="flex items-center gap-4 px-4 py-4 rounded-xl cursor-pointer transition-all duration-150"
            style={{ background:shuffle?'rgba(225,29,72,0.07)':'var(--bg-pill)', border:`1px solid ${shuffle?'rgba(225,29,72,0.25)':'var(--border-card)'}` }}>
            <div className="w-10 h-5 rounded-full transition-all duration-150 relative flex-shrink-0 cursor-pointer"
              style={{ background:shuffle?'#E11D48':'var(--bg-btn-ghost)' }} onClick={()=>setShuffle(s=>!s)}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-150"
                style={{ left:shuffle?'22px':'2px' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Shuffle size={14} style={{ color:shuffle?'#f43f5e':'var(--text-muted)' }}/>
                <span className="text-sm font-heading font-semibold" style={{ color:shuffle?'#f43f5e':'var(--text-primary)' }}>Shuffle Sequence</span>
              </div>
              <p className="text-xs font-body mt-0.5" style={{ color:'var(--text-faint)' }}>Randomizes fragment order — maximum disruption</p>
            </div>
          </label>

          <button disabled={processing} onClick={processVideo}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{ background:'linear-gradient(135deg, #E11D48, #BE123C)', boxShadow:'0 0 24px rgba(225,29,72,0.35)' }}>
            {processing ? statusText : 'Run Disruption Engine'}
          </button>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText={statusText}/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-8 rounded-2xl animate-slide-up"
          style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <div className="text-center">
            <h3 className="font-heading font-semibold text-emerald-500 text-lg">Disruption Complete</h3>
            <p className="text-sm font-body mt-1" style={{ color:'var(--text-muted)' }}>All fingerprints disrupted. File ready.</p>
          </div>
          <a href={URL.createObjectURL(outputBlob)} download={`bypassed_${file.name}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>Download Scrubbed File</a>
        </div>
      )}
    </div>
  );
}
