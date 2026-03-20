import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ProgressBar from '../components/ProgressBar';
import VideoPreview from '../components/VideoPreview';
import { useFFmpeg } from '../context/FFmpegContext';
import { fetchFile } from '@ffmpeg/util';
import { VolumeX, CheckCircle, Info } from 'lucide-react';

export default function RemoveAudio() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outputBlob, setOutputBlob] = useState(null);
  const { ffmpeg } = useFFmpeg();

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true); setProgress(0); setOutputBlob(null);
    const onP=({progress})=>setProgress(progress); ffmpeg.on('progress',onP);
    try {
      const ext = file.name.split('.').pop();
      const inp=`inp.${ext}`; const out=`silent.${ext}`;
      await ffmpeg.writeFile(inp,await fetchFile(file));
      await ffmpeg.exec(['-i',inp,'-an','-c:v','copy',out]);
      const data=await ffmpeg.readFile(out);
      setOutputBlob(new Blob([data.buffer],{type:file.type||'video/mp4'}));
      await ffmpeg.deleteFile(inp); await ffmpeg.deleteFile(out);
    } catch(e){console.error(e);}
    finally{setProcessing(false);ffmpeg.off('progress',onP);}
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 p-4 rounded-xl text-sm font-body"
        style={{background:'rgba(249,115,22,0.07)',border:'1px solid rgba(249,115,22,0.20)'}}>
        <VolumeX size={16} className="text-orange-500 mt-0.5 flex-shrink-0"/>
        <p style={{color:'var(--text-secondary)'}}>
          <span className="font-semibold text-orange-500">Lossless audio removal:</span> Strips all audio tracks using <code className="text-orange-400">-an</code> while stream-copying the video. Instant, zero quality loss.
        </p>
      </div>

      {!file ? (
        <FileUploader onFileSelect={f=>{setFile(f);setOutputBlob(null);}} title="Upload Video" description="All audio tracks will be stripped"/>
      ) : (
        <div className="space-y-4">
          <VideoPreview file={file}/>
          <div className="flex gap-3">
            <button onClick={()=>{setFile(null);setOutputBlob(null);}} className="px-4 py-3 rounded-xl text-sm font-heading font-semibold cursor-pointer flex-shrink-0 transition-all"
              style={{background:'var(--bg-btn-ghost)',border:'1px solid var(--border-card)',color:'var(--text-secondary)'}}>Change</button>
            <button disabled={processing} onClick={handleProcess}
              className="flex-1 py-3 rounded-xl font-heading font-semibold text-sm text-white cursor-pointer disabled:opacity-40 transition-all"
              style={{background:'linear-gradient(135deg,#EA580C,#C2410C)',boxShadow:'0 0 20px rgba(249,115,22,0.30)'}}>
              {processing?'Removing audio...':'Strip All Audio Tracks'}
            </button>
          </div>
        </div>
      )}

      {processing && <ProgressBar progress={progress} statusText="Copying video stream, discarding audio..."/>}
      {outputBlob && !processing && (
        <div className="flex flex-col items-center gap-4 py-7 rounded-2xl animate-slide-up"
          style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>
          <CheckCircle size={34} className="text-emerald-500" strokeWidth={1.5}/>
          <div className="text-center"><h3 className="font-heading font-semibold text-emerald-500 text-lg">Audio Removed!</h3>
            <p className="text-sm mt-1 font-body" style={{color:'var(--text-muted)'}}>Silent video, full quality preserved</p></div>
          <a href={URL.createObjectURL(outputBlob)} download={`silent_${file.name}`}
            className="px-8 py-3 rounded-xl font-heading font-semibold text-sm cursor-pointer transition-all hover:scale-105 text-emerald-600"
            style={{background:'var(--success-bg)',border:'1px solid var(--success-border)'}}>Download Silent Video</a>
        </div>
      )}
    </div>
  );
}
