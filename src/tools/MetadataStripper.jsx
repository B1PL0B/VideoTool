import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Layers, CheckCircle, Info } from 'lucide-react';

export default function MetadataStripper() {
  const [file, setFile] = useState(null);
  const [stripChapters, setStripChapters] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [metaBefore, setMetaBefore] = useState('');
  const { ffmpeg } = useFFmpeg();

  const handleStrip = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    let before = '';
    const Logger = ({ message }) => { if (message.includes('TITLE') || message.includes('title') || message.includes('creation_time') || message.includes('artist') || message.includes('comment') || message.includes('encoder')) before += message + '\n'; };
    ffmpeg.on('log', Logger);
    const onP = ({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    const ext = file.name.split('.').pop();
    try {
      const inp=`inp.${ext}`; const out=`clean.${ext}`;
      await ffmpeg.writeFile(inp,await fetchFile(file));
      // Probe first for metadata
      try { await ffmpeg.exec(['-i',inp]); } catch{} // Expected to fail, we just want the log
      setMetaBefore(before || 'No embedded metadata tags found');
      const args = ['-i',inp,'-map_metadata','-1','-c','copy'];
      if (stripChapters) args.push('-map_chapters','-1');
      args.push(out);
      await ffmpeg.exec(args);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:file.type||'video/mp4'}));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile(out);
    } catch(e){console.error(e);}
    finally{setProcessing(false);ffmpeg.off('progress',onP);ffmpeg.off('log',Logger);}
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'rgba(148,163,184,0.07)',border:'1px solid rgba(148,163,184,0.20)'}}>
        <Layers size={16} className="text-slate-400 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}>
          <span className="font-semibold" style={{color:'var(--text-primary)'}}>Metadata wiper:</span> Strips title, artist, GPS, creation date, encoder, and all custom tags using <code className="text-indigo-400 text-xs">-map_metadata -1</code>. Streams are not re-encoded.
        </p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={f=>{setFile(f);setOutputBlob(null);setMetaBefore('');}} title="Upload Video or Audio File" description="All embedded tags will be removed"/>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <div className="flex items-center gap-2 min-w-0"><Layers size={14} style={{color:'var(--text-muted)'}} className="flex-shrink-0"/>
              <span className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{file.name}</span></div>
            <button onClick={()=>{setFile(null);setOutputBlob(null);setMetaBefore('');}} className="text-xs ml-3 flex-shrink-0 cursor-pointer"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>

          <label className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all"
            style={{background:stripChapters?'rgba(99,102,241,0.08)':'var(--bg-pill)',border:`1px solid ${stripChapters?'rgba(99,102,241,0.30)':'var(--border-card)'}`}}>
            <div className="w-9 h-5 rounded-full relative flex-shrink-0 cursor-pointer transition-all"
              style={{background:stripChapters?'#6366F1':'var(--bg-btn-ghost)'}} onClick={()=>setStripChapters(s=>!s)}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{left:stripChapters?'20px':'2px'}}/>
            </div>
            <div>
              <div className="text-sm font-heading font-semibold" style={{color:stripChapters?'#818cf8':'var(--text-primary)'}}>Also remove chapter markers</div>
              <div className="text-xs font-body mt-0.5" style={{color:'var(--text-muted)'}}>Wipes embedded chapters in addition to metadata tags</div>
            </div>
          </label>

          <button disabled={processing} onClick={handleStrip}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{background:'linear-gradient(135deg,#475569,#334155)',boxShadow:'0 0 16px rgba(71,85,105,0.35)'}}>
            {processing?'Stripping metadata...':'Strip All Metadata'}
          </button>

          {metaBefore && (
            <div className="rounded-xl p-4" style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
              <p className="text-[10px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-faint)'}}>Detected metadata</p>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all" style={{color:'var(--text-secondary)'}}>{metaBefore}</pre>
            </div>
          )}
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Copying streams, discarding all metadata..."/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <div className="text-center"><h3 className="font-heading font-semibold text-emerald-500 text-lg">Metadata Wiped!</h3>
            <p className="text-sm mt-1 font-body" style={{color:'var(--text-muted)'}}>Clean file, identical streams</p></div>
          <a href={URL.createObjectURL(outputBlob)} download={`clean_${file.name}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>Download Clean File</a>
        </div>
      )}
    </div>
  );
}
