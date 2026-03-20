import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import VideoPreview from '../components/VideoPreview';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { Music, CheckCircle } from 'lucide-react';

export default function AudioExtractor() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const [detectedTracks, setDetectedTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [detectedExt, setDetectedExt] = useState('.m4a');
  const { ffmpeg } = useFFmpeg();

  const handleProbe = async (f) => {
    setFile(f); setOutputBlob(null); setDetectedTracks([]); setSelectedTrack(0);
    const inp=`probe.${f.name.split('.').pop()}`;
    let log='';
    const Logger=({message})=>{log+=message+'\n';};
    ffmpeg.on('log',Logger);
    await ffmpeg.writeFile(inp,await fetchFile(f));
    try{ await ffmpeg.exec(['-i',inp]); }catch{}
    ffmpeg.off('log',Logger);
    await ffmpeg.deleteFile(inp);
    // Parse audio tracks
    const tracks=[];
    const lines=log.split('\n');
    for(const line of lines){
      const m=line.match(/Stream #0:(\d+)(?:\((\w+)\))?.*?: Audio: (\S+?)[\s,]/);
      if(m) tracks.push({idx:parseInt(m[1]),lang:m[2]||'und',codec:m[3]});
    }
    setDetectedTracks(tracks);
  };

  const codecToExt=(c)=>c==='mp3'?'mp3':c==='opus'?'opus':c==='vorbis'?'ogg':c==='flac'?'flac':c==='pcm_s16le'?'wav':'m4a';

  const handleExtract = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP=({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    const track = detectedTracks[selectedTrack];
    const ext = track ? codecToExt(track.codec) : 'm4a';
    setDetectedExt(`.${ext}`);
    try {
      const inp=`inp.${file.name.split('.').pop()}`; const out=`audio.${ext}`;
      await ffmpeg.writeFile(inp,await fetchFile(file));
      const mapArg = track ? `0:${track.idx}` : '0:a:0';
      await ffmpeg.exec(['-i',inp,'-map',mapArg,'-c','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:`audio/${ext==='m4a'?'mp4':ext}`}));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile(out);
    }catch(e){console.error(e);}
    finally{setProcessing(false);ffmpeg.off('progress',onP);}
  };

  return (
    <div className="space-y-5">
      {!file ? (
        <FileUploader onFileSelect={handleProbe} icon="video" title="Upload Video to Extract Audio" description="We'll detect all audio tracks automatically"/>
      ) : (
        <div className="space-y-4">
          <VideoPreview file={file}/>

          {detectedTracks.length > 0 ? (
            <div>
              <label className="block text-[11px] font-body font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>
                {detectedTracks.length} Audio Track{detectedTracks.length>1?'s':''} Detected
              </label>
              <div className="space-y-2">
                {detectedTracks.map((t,i)=>(
                  <label key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                    style={{background:selectedTrack===i?'rgba(245,158,11,0.08)':'var(--bg-pill)',border:`1px solid ${selectedTrack===i?'rgba(245,158,11,0.30)':'var(--border-card)'}`}}>
                    <input type="radio" className="hidden" checked={selectedTrack===i} onChange={()=>setSelectedTrack(i)}/>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{borderColor:selectedTrack===i?'#f59e0b':'var(--border-input)'}}>
                      {selectedTrack===i && <div className="w-2.5 h-2.5 rounded-full bg-amber-500"/>}
                    </div>
                    <Music size={14} className="text-amber-500 flex-shrink-0"/>
                    <div className="flex-1">
                      <span className="text-sm font-body font-medium" style={{color:'var(--text-primary)'}}>Track {i+1}</span>
                      <span className="text-xs font-mono ml-2 text-amber-500">{t.codec}</span>
                      {t.lang!=='und' && <span className="text-xs ml-2" style={{color:'var(--text-muted)'}}>({t.lang})</span>}
                    </div>
                    <span className="text-xs font-mono" style={{color:'var(--text-faint)'}}>→ .{codecToExt(t.codec)}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl text-sm font-body flex items-center gap-2"
              style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.15)',color:'var(--text-secondary)'}}>
              <Music size={14} className="text-amber-500"/>
              <span>Auto-detect → outputs <span className="text-amber-500 font-medium">.m4a / .mp3 / .opus / .flac</span></span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={()=>{setFile(null);setOutputBlob(null);setDetectedTracks([]);}} className="px-4 py-3 rounded-xl text-sm font-heading font-semibold cursor-pointer flex-shrink-0 transition-all"
              style={{background:'var(--bg-btn-ghost)',border:'1px solid var(--border-card)',color:'var(--text-secondary)'}}>Change</button>
            <button disabled={processing} onClick={handleExtract}
              className="flex-1 py-3 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
              style={{background:'linear-gradient(135deg,#D97706,#B45309)',boxShadow:'0 0 20px rgba(245,158,11,0.22)'}}>
              {processing?'Extracting...':'Extract Audio Track'}
            </button>
          </div>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Demuxing audio stream..."/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <div className="text-center"><h3 className="font-heading font-semibold text-emerald-500 text-lg">Extraction Complete</h3>
            <p className="text-sm mt-1 font-body" style={{color:'var(--text-muted)'}}>Format: <span className="text-amber-500 font-mono">{detectedExt}</span></p></div>
          <a href={URL.createObjectURL(outputBlob)} download={`audio_${file.name.split('.')[0]}${detectedExt}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>Download Audio</a>
        </div>
      )}
    </div>
  );
}
