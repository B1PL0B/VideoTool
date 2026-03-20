import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import { downloadBlob } from '../utils/download';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { FileText, Video, CheckCircle, Info } from 'lucide-react';

const LANGUAGES = [
  {val:'eng',label:'English'},{val:'fre',label:'French'},{val:'ger',label:'German'},
  {val:'spa',label:'Spanish'},{val:'jpn',label:'Japanese'},{val:'chi',label:'Chinese'},
  {val:'ara',label:'Arabic'},{val:'por',label:'Portuguese'},{val:'kor',label:'Korean'},
  {val:'und',label:'Undetermined'},
];

export default function SubtitleEmbedder() {
  const [videoFile, setVideoFile] = useState(null);
  const [subFile, setSubFile] = useState(null);
  const [lang, setLang] = useState('eng');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const handleEmbed = async () => {
    if (!videoFile||!subFile) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP=({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    try {
      const v=`v_${videoFile.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
      const s=`s_${subFile.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
      const out='output.mkv'; // MKV supports all subtitle formats
      await ffmpeg.writeFile(v,await fetchFile(videoFile));
      await ffmpeg.writeFile(s,await fetchFile(subFile));
      await ffmpeg.exec(['-i',v,'-i',s,'-c','copy','-c:s','copy','-metadata:s:s:0',`language=${lang}`,out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:'video/x-matroska'}));
      await ffmpeg.deleteFile(v); await ffmpeg.deleteFile(s); await ffmpeg.deleteFile(out);
    } catch(e){console.error(e);}
    finally{setProcessing(false);ffmpeg.off('progress',onP);}
  };

  const FilePill = ({f, onRemove, Ic, color, label}) => (
    <div className="flex flex-col gap-2 p-4 rounded-2xl" style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
      <div className={`flex items-center gap-2 mb-1 ${color}`}><Ic size={14}/><span className="text-xs font-heading font-semibold uppercase tracking-wider">{label}</span></div>
      <span className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{f.name}</span>
      <button onClick={onRemove} className="text-xs cursor-pointer text-left transition-colors mt-1"
        style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'rgba(14,165,233,0.07)',border:'1px solid rgba(14,165,233,0.20)'}}>
        <Info size={16} className="text-sky-500 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}>
          <span className="font-semibold text-sky-500">Soft subtitle embedding:</span> Subtitle stream is attached as a separate track inside the MKV container — 100% lossless. Video/audio streams are not touched.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {!videoFile ? <FileUploader onFileSelect={setVideoFile} icon="video" title="Video File" description="MP4, MKV, MOV..."/>
          : <FilePill f={videoFile} onRemove={()=>setVideoFile(null)} Ic={Video} color="text-sky-500" label="Video"/>}
        {!subFile ? <FileUploader onFileSelect={setSubFile} accept=".srt,.vtt,.ass,.ssa,.sub" icon="srt" title="Subtitle File" description=".srt / .vtt / .ass / .ssa"/>
          : <FilePill f={subFile} onRemove={()=>setSubFile(null)} Ic={FileText} color="text-indigo-500" label="Subtitle"/>}
      </div>

      {/* Language selector */}
      <div>
        <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>Subtitle Language</label>
        <select value={lang} onChange={e=>setLang(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none appearance-none cursor-pointer transition-all"
          style={{background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)'}}>
          {LANGUAGES.map(l=><option key={l.val} value={l.val}>{l.label} ({l.val})</option>)}
        </select>
      </div>

      <div className="px-4 py-3 rounded-xl text-xs font-body" style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)',color:'var(--text-muted)'}}>
        Output format forced to <span className="text-sky-500 font-semibold">.mkv</span> — the only container that universally supports all text subtitle formats.
      </div>

      <button disabled={processing||!videoFile||!subFile} onClick={handleEmbed}
        className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
        style={{background:'linear-gradient(135deg,#0284C7,#0369A1)',boxShadow:'0 0 20px rgba(14,165,233,0.25)'}}>
        {processing?'Embedding subtitles...':'Embed Subtitle Track'}
      </button>

      {processing && <ProgressBar progress={progress} statusText="Muxing subtitle stream..."/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <div className="text-center"><h3 className="font-heading font-semibold text-emerald-500 text-lg">Subtitle Embedded!</h3>
            <p className="text-sm mt-1 font-body" style={{color:'var(--text-muted)'}}>Language tag: <span className="text-sky-500">{lang}</span></p></div>
          <button onClick={() => downloadBlob(outputBlob, `subtitled_${videoFile.name.split('.')[0]}.mkv`)}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>Download .mkv File</button>
        </div>
      )}
    </div>
  );
}
