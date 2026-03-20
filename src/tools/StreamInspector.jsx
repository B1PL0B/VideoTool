import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Info, Copy, Check, Film, Music, Subtitles, BookOpen, Clock, HardDrive } from 'lucide-react';

const parseInfo = (log) => {
  const result = { container:'', duration:'', bitrate:'', size:'', video:[], audio:[], subtitle:[], chapters:[] };
  const lines = log.split('\n');
  for (const line of lines) {
    if (line.includes('Duration:')) {
      const m = line.match(/Duration:\s*([\d:\.]+)/); if (m) result.duration = m[1];
      const b = line.match(/bitrate:\s*(\d+\s*kb\/s)/); if (b) result.bitrate = b[1];
    }
    if (line.match(/Stream.*Video:/)) result.video.push(line.replace(/.*Stream/,'Stream').trim());
    if (line.match(/Stream.*Audio:/)) result.audio.push(line.replace(/.*Stream/,'Stream').trim());
    if (line.match(/Stream.*Subtitle:/)) result.subtitle.push(line.replace(/.*Stream/,'Stream').trim());
    if (line.includes('Chapter')) result.chapters.push(line.trim());
    if (line.match(/Input #\d/)) { const m=line.match(/from '.*?',\s*(.+?):/); if(m) result.container=m[1].trim(); }
  }
  return result;
};

const Section = ({icon:Ic, color, label, items}) => items.length===0 ? null : (
  <div className="rounded-xl overflow-hidden" style={{border:'1px solid var(--border-card)'}}>
    <div className="flex items-center gap-2 px-4 py-2.5" style={{background:'var(--bg-pill)',borderBottom:'1px solid var(--border-card)'}}>
      <Ic size={13} style={{color}} /><span className="text-xs font-heading font-semibold" style={{color}}>{label}</span>
      <span className="ml-auto text-xs font-mono" style={{color:'var(--text-faint)'}}>{items.length} track{items.length>1?'s':''}</span>
    </div>
    {items.map((item,i)=>(
      <div key={i} className="px-4 py-2 text-xs font-mono" style={{color:'var(--text-secondary)',borderTop:i>0?'1px solid var(--border-card)':'none'}}>{item}</div>
    ))}
  </div>
);

export default function StreamInspector() {
  const [file, setFile] = useState(null);
  const [probing, setProbing] = useState(false);
  const [info, setInfo] = useState(null);
  const [rawLog, setRawLog] = useState('');
  const [copied, setCopied] = useState(false);
  const { ffmpeg } = useFFmpeg();

  const handleProbe = async () => {
    if (!file) return;
    setProbing(true); setInfo(null); setRawLog('');
    let log = '';
    const Logger = ({message}) => { log += message + '\n'; };
    ffmpeg.on('log', Logger);
    const ext = file.name.split('.').pop();
    const inp = `probe.${ext}`;
    try {
      await ffmpeg.writeFile(inp, await fetchFile(file));
      try { await ffmpeg.exec(['-i', inp]); } catch{} // expected
      setRawLog(log);
      setInfo(parseInfo(log));
      await ffmpeg.deleteFile(inp);
    } catch(e){console.error(e);}
    finally{setProbing(false);ffmpeg.off('log',Logger);}
  };

  const copyRaw = () => {
    navigator.clipboard.writeText(rawLog);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'rgba(34,197,94,0.07)',border:'1px solid rgba(34,197,94,0.20)'}}>
        <Info size={16} className="text-green-500 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}>
          <span className="font-semibold text-green-500">Zero-output probe:</span> Inspects the container and streams without creating any output file. Safe and instant.
        </p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={f=>{setFile(f);setInfo(null);}} title="Upload File to Inspect" description="Video, audio, or any media container"/>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
            <span className="text-sm font-body truncate" style={{color:'var(--text-primary)'}}>{file.name}</span>
            <button onClick={()=>{setFile(null);setInfo(null);}} className="text-xs ml-3 flex-shrink-0 cursor-pointer"
              style={{color:'var(--text-faint)'}} onMouseEnter={e=>e.currentTarget.style.color='#f43f5e'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-faint)'}>Remove</button>
          </div>
          <button disabled={probing} onClick={handleProbe}
            className="w-full py-3.5 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
            style={{background:'linear-gradient(135deg,#16a34a,#15803d)',boxShadow:'0 0 20px rgba(34,197,94,0.22)'}}>
            {probing?'Probing streams...':'Inspect File'}
          </button>
        </div>
      )}

      {info && (
        <div className="space-y-3 animate-slide-up">
          {/* Summary chips */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {icon:Clock,  label:'Duration', val:info.duration||'N/A', color:'#06b6d4'},
              {icon:HardDrive,label:'Bitrate',  val:info.bitrate||'N/A', color:'#8b5cf6'},
              {icon:Film,   label:'Container',val:info.container.split(',')[0]||'N/A', color:'#3b82f6'},
              {icon:Music,  label:'Tracks',   val:`${info.video.length}V · ${info.audio.length}A · ${info.subtitle.length}S`, color:'#f59e0b'},
            ].map(({icon:Ic,label,val,color})=>(
              <div key={label} className="p-3 rounded-xl flex items-center gap-3" style={{background:'var(--bg-pill)',border:'1px solid var(--border-card)'}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${color}18`}}><Ic size={15} style={{color}}/></div>
                <div><div className="text-[10px] font-body font-semibold uppercase tracking-widest" style={{color:'var(--text-faint)'}}>{label}</div>
                  <div className="text-sm font-mono font-medium" style={{color:'var(--text-primary)'}}>{val}</div></div>
              </div>
            ))}
          </div>

          <Section icon={Film}     color="#3b82f6" label="Video Streams"    items={info.video}/>
          <Section icon={Music}    color="#f59e0b" label="Audio Streams"    items={info.audio}/>
          <Section icon={Subtitles}color="#0ea5e9" label="Subtitle Streams" items={info.subtitle}/>
          <Section icon={BookOpen} color="#a855f7" label="Chapters"         items={info.chapters}/>

          {/* Raw log */}
          <div className="rounded-xl overflow-hidden" style={{border:'1px solid var(--border-card)'}}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{background:'var(--bg-pill)',borderBottom:'1px solid var(--border-card)'}}>
              <span className="text-xs font-heading font-semibold" style={{color:'var(--text-muted)'}}>Raw FFmpeg Output</span>
              <button onClick={copyRaw} className="flex items-center gap-1.5 text-xs font-body cursor-pointer transition-colors px-2 py-1 rounded-lg"
                style={{color:copied?'#22c55e':'var(--text-muted)',background:'var(--bg-btn-ghost)'}}>
                {copied?<Check size={12}/>:<Copy size={12}/>} {copied?'Copied!':'Copy'}
              </button>
            </div>
            <div className="max-h-44 overflow-y-auto scrollbar-hide px-4 py-3">
              <pre className="text-[11px] font-mono whitespace-pre-wrap break-all" style={{color:'var(--text-secondary)'}}>{rawLog}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
