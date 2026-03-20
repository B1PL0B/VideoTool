import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { downloadBlob } from '../utils/download';
import VideoPreview from '../components/VideoPreview';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { ShieldBan, Shuffle, CheckCircle, Plus, CheckSquare, Square, Clock } from 'lucide-react';

export default function CopyrightRemover() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [segmentLen, setSegmentLen] = useState('5');
  const [skipLen, setSkipLen] = useState('0.5');
  const [shuffle, setShuffle] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [outputBlob, setOutputBlob] = useState(null);
  const [fragStatus, setFragStatus] = useState([]);
  const { ffmpeg } = useFFmpeg();

  const segL = parseFloat(segmentLen) || 5;
  const skipL = parseFloat(skipLen) || 0.5;
  const totalFrags = duration > 0 ? Math.ceil(duration / (segL + skipL)) : 0;

  const getDuration = (f) => new Promise((res,rej)=>{
    const v=document.createElement('video'); v.preload='metadata';
    v.onloadedmetadata=()=>{URL.revokeObjectURL(v.src);res(v.duration);};
    v.onerror=()=>rej('Cannot read metadata'); v.src=URL.createObjectURL(f);
  });

  const processVideo = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null); setStatusText('Probing duration...');
    setFragStatus([]);
    const onP=({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    try {
      const dur = await getDuration(file);
      if (!dur) throw new Error('Cannot read video duration');
      const inp=`inp_${file.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
      const ext=file.name.split('.').pop();
      await ffmpeg.writeFile(inp, await fetchFile(file));
      const segs=[]; let cur=0; let i=0;
      const statuses=[];
      while(cur<dur){
        const end=Math.min(cur+segL,dur);
        const sn=`seg_${i}.${ext}`;
        statuses.push({ name: sn, status:'pending' });
        setFragStatus([...statuses]);
        setStatusText(`Fragment ${i+1} of ${Math.ceil((dur)/(segL+skipL))}...`);
        setProgress(cur/dur*0.88);
        await ffmpeg.exec(['-ss',cur.toString(),'-i',inp,'-t',(end-cur).toString(),'-c','copy',sn]);
        statuses[i].status='done';
        setFragStatus([...statuses]);
        segs.push(sn); cur=end+skipL; i++;
      }
      await ffmpeg.deleteFile(inp);
      if(shuffle){setStatusText('Shuffling...');final.sort(()=>Math.random()-0.5);}
      setStatusText('Concatenating...'); setProgress(0.92);
      await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(final.map(s=>`file '${s}'`).join('\n')));
      const out=`bypassed.${ext}`;
      await ffmpeg.exec(['-f','concat','-safe','0','-i','concat.txt','-c','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:file.type||'video/mp4'}));
      await ffmpeg.deleteFile('concat.txt'); await ffmpeg.deleteFile(out);
      for(const s of segs) await ffmpeg.deleteFile(s);
      setProgress(1);
    } catch(e){
      console.error(e);
      const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'WASM Abort/OOM');
      setStatusText('Error: ' + msg);
    }
    finally{setProcessing(false);ffmpeg.off('progress',onP);}
  };

  const NumInput=({label,sub,value,onChange})=>(
    <div>
      <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-1.5" style={{color:'var(--text-muted)'}}>{label}</label>
      <input type="number" step="0.1" value={value} onChange={e=>onChange(e.target.value)}
        className="w-full font-mono text-sm rounded-xl px-4 py-3 outline-none transition-all"
        style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}}
        onFocus={e=>e.target.style.borderColor='rgba(225,29,72,0.5)'} onBlur={e=>e.target.style.borderColor='var(--border-input)'}/>
      <p className="text-[11px] font-body mt-1.5" style={{color:'var(--text-faint)'}}>{sub}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'var(--warn-bg)',border:'1px solid var(--warn-border)'}}>
        <ShieldBan size={16} className="text-rose-500 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}><span className="font-semibold text-rose-500">Hash Disruption Engine:</span> Splits into timed fragments, drops micro-gaps, then stitches back. 100% stream-copy lossless.</p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={f=>{setFile(f);setOutputBlob(null);}} title="Upload Video to Process" description="Supports MP4, MKV, MOV, AVI"/>
      ) : (
        <div className="space-y-5">
          <VideoPreview file={file} onDurationChange={setDuration}/>

          {duration > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {label:'Fragments', val: totalFrags},
                {label:'Segment Length', val:`${segL}s`},
                {label:'Total Skip', val:`${(totalFrags * skipL).toFixed(1)}s`},
              ].map(({label,val})=>(
                <div key={label} className="text-center p-3 rounded-xl" style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
                  <div className="text-lg font-heading font-bold text-rose-500">{val}</div>
                  <div className="text-[11px] font-body mt-0.5" style={{color:'var(--text-muted)'}}>{label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <NumInput label="Segment Length (sec)" sub="Duration of each kept chunk" value={segmentLen} onChange={(v)=>{setSegmentLen(v);}}/>
            <NumInput label="Skip Duration (sec)" sub="Dropped between chunks" value={skipLen} onChange={(v)=>{setSkipLen(v);}}/>
          </div>

          <label className="flex items-center gap-4 px-4 py-4 rounded-xl cursor-pointer transition-all"
            style={{background:shuffle?'rgba(225,29,72,0.07)':'var(--bg-pill)',border:`1px solid ${shuffle?'rgba(225,29,72,0.25)':'var(--border-card)'}`}}>
            <div className="w-10 h-5 rounded-full transition-all relative flex-shrink-0 cursor-pointer"
              style={{background:shuffle?'#E11D48':'var(--bg-btn-ghost)'}} onClick={()=>setShuffle(s=>!s)}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{left:shuffle?'22px':'2px'}}/>
            </div>
            <div>
              <div className="flex items-center gap-2"><Shuffle size={14} style={{color:shuffle?'#f43f5e':'var(--text-muted)'}}/>
                <span className="text-sm font-heading font-semibold" style={{color:shuffle?'#f43f5e':'var(--text-primary)'}}>Shuffle Sequence</span></div>
              <p className="text-xs font-body mt-0.5" style={{color:'var(--text-faint)'}}>Randomizes fragment order — maximum disruption</p>
            </div>
          </label>          {/* Fragment status list (live) */}
          {fragStatus.length > 0 && !outputBlob && (
            <div className="max-h-36 overflow-y-auto scrollbar-hide space-y-1 pr-1">
              {fragStatus.map((f,i)=>(
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                  style={{background:'var(--bg-pill)',color:f.status==='done'?'var(--text-primary)':'var(--text-faint)'}}>
                  {f.status==='done' ? <CheckSquare size={13} className="text-emerald-500"/> : <Square size={13} style={{color:'var(--text-faint)'}}/>}
                  <span className="truncate">{f.name}</span>
                  {f.status==='done' && <span className="ml-auto text-emerald-500">✓</span>}
                </div>
              ))}
            </div>
          )}

          {statusText.startsWith('Error') && (
            <div className="p-4 rounded-xl text-sm font-body bg-rose-500/10 border border-rose-500/20 text-rose-500">
              {statusText}
            </div>
          )}

          {outputBlob ? (
            <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
              style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
              <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
              <div className="text-center"><h3 className="font-heading font-semibold text-emerald-500 text-lg">Disruption Complete</h3>
                <p className="text-sm font-body mt-1" style={{color:'var(--text-muted)'}}>All fingerprints disrupted. File ready.</p></div>
              <div className="flex gap-3">
                <button onClick={()=>{setFile(null);setOutputBlob(null);setFragStatus([]);setStatusText('');}} className="px-5 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all"
                  style={{background:'var(--bg-btn-ghost)',border:'1px solid var(--border-card)',color:'var(--text-secondary)'}}>Start Over</button>
                <button onClick={() => downloadBlob(outputBlob, `bypassed_${file.name}`)}
                  className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600 shadow-lg shadow-emerald-500/20"
                  style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>Download Result</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={()=>{setFile(null);setOutputBlob(null);setFragStatus([]);setStatusText('');}} className="px-4 py-3 rounded-xl text-sm font-heading font-semibold cursor-pointer transition-all flex-shrink-0"
                style={{background:'var(--bg-btn-ghost)',border:'1px solid var(--border-card)',color:'var(--text-secondary)'}}>Change</button>
              <button disabled={processing} onClick={processVideo}
                className="flex-1 py-3 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
                style={{background:'linear-gradient(135deg,#E11D48,#BE123C)',boxShadow:'0 0 24px rgba(225,29,72,0.35)'}}>
                {processing ? statusText : 'Run Disruption Engine'}
              </button>
            </div>
          )}
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText={statusText}/>}
    </div>
  );
}
