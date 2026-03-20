import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Clock, Monitor, Volume2 } from 'lucide-react';

/**
 * VideoPreview — reusable preview for any uploaded video file.
 * Props:
 *   file         — File object
 *   onDurationChange(dur) — called once metadata loads
 *   showABSlider — show dual A/B range handles
 *   startTime / endTime   — controlled A/B values (seconds)
 *   onStartChange(s) / onEndChange(s) — called on A/B drag
 */
export default function VideoPreview({
  file,
  onDurationChange,
  showABSlider = false,
  startTime = 0,
  endTime = null,
  onStartChange,
  onEndChange,
}) {
  const videoRef = useRef(null);
  const [objectURL, setObjectURL] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [info, setInfo] = useState(null);

  // Create object URL when file changes
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectURL(url);
    setPlaying(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return null;

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const handleLoaded = (e) => {
    const v = e.target;
    const dur = v.duration;
    setDuration(dur);
    if (onDurationChange) onDurationChange(dur);
    setInfo({
      width: v.videoWidth,
      height: v.videoHeight,
    });
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrent(videoRef.current.currentTime);
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const pct = parseFloat(e.target.value) / 100;
    v.currentTime = pct * duration;
  };

  // Convert seconds → % for the range slider
  const startPct = duration ? (startTime / duration) * 100 : 0;
  const endPct = duration && endTime !== null ? (endTime / duration) * 100 : 100;
  const curPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'var(--bg-pill)', border:'1px solid var(--border-card)' }}>
      {/* Video element — click to play, no autoplay */}
      <div className="relative group cursor-pointer bg-black" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={objectURL}
          className="w-full max-h-56 object-contain"
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoaded}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
        />

        {/* Play/Pause overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20">
            {playing ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-1" />}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="px-4 pb-4 pt-3 space-y-3">
        {/* Info chips */}
        {info && (
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { icon: Clock,   label: formatTime(duration) },
              { icon: Monitor, label: info.width && info.height ? `${info.width}×${info.height}` : '—' },
            ].map(({ icon: Ic, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-lg"
                style={{ background:'var(--bg-btn-ghost)', color:'var(--text-muted)', border:'1px solid var(--border-card)' }}>
                <Ic size={11} /> {label}
              </div>
            ))}
          </div>
        )}

        {/* Seek bar */}
        {!showABSlider && (
          <div className="relative h-5 flex items-center">
            {/* Track fill */}
            <div className="absolute left-0 h-1.5 rounded-full pointer-events-none"
              style={{ width:`${curPct}%`, background:'linear-gradient(90deg,#6366F1,#E11D48)' }} />
            <div className="absolute left-0 right-0 h-1.5 rounded-full -z-10" style={{ background:'var(--bg-btn-ghost)' }} />
            <input type="range" min="0" max="100" step="0.1"
              value={curPct}
              onChange={handleSeek}
              className="absolute left-0 right-0 w-full opacity-0 cursor-pointer h-5"
            />
          </div>
        )}

        {/* A/B dual slider */}
        {showABSlider && duration > 0 && (
          <div className="space-y-2">
            <div className="relative h-6 flex items-center select-none">
              {/* Grey track */}
              <div className="absolute left-0 right-0 h-1.5 rounded-full" style={{ background:'var(--bg-btn-ghost)' }} />
              {/* Coloured selection range */}
              <div className="absolute h-1.5 rounded-full pointer-events-none"
                style={{ left:`${startPct}%`, width:`${endPct - startPct}%`, background:'linear-gradient(90deg,#6366F1,#E11D48)' }} />
              {/* Playhead */}
              <div className="absolute w-0.5 h-4 rounded pointer-events-none"
                style={{ left:`${curPct}%`, background:'white', opacity:0.7 }} />
              {/* Start handle */}
              <input type="range" min="0" max="100" step="0.01"
                value={startPct}
                onChange={e => {
                  const pct = parseFloat(e.target.value);
                  const s = (pct / 100) * duration;
                  if (s < (endTime ?? duration)) {
                    if (onStartChange) onStartChange(s);
                    if (videoRef.current) videoRef.current.currentTime = s;
                  }
                }}
                className="absolute left-0 right-0 w-full opacity-0 cursor-pointer h-6"
                style={{ zIndex: startPct > 50 ? 5 : 4 }}
              />
              {/* End handle */}
              <input type="range" min="0" max="100" step="0.01"
                value={endPct}
                onChange={e => {
                  const pct = parseFloat(e.target.value);
                  const s = (pct / 100) * duration;
                  if (s > startTime) {
                    if (onEndChange) onEndChange(s);
                    if (videoRef.current) videoRef.current.currentTime = s;
                  }
                }}
                className="absolute left-0 right-0 w-full opacity-0 cursor-pointer h-6"
                style={{ zIndex: startPct <= 50 ? 5 : 4 }}
              />
              {/* Visual handles */}
              <div className="absolute w-3 h-4 rounded border-2 border-indigo-400 bg-indigo-600 pointer-events-none -translate-x-1/2"
                style={{ left:`${startPct}%`, zIndex:6 }} />
              <div className="absolute w-3 h-4 rounded border-2 border-rose-400 bg-rose-600 pointer-events-none -translate-x-1/2"
                style={{ left:`${endPct}%`, zIndex:6 }} />
            </div>

            {/* A/B time labels */}
            <div className="flex justify-between text-xs font-mono" style={{ color:'var(--text-muted)' }}>
              <span className="text-indigo-400">▶ {formatTime(startTime)}</span>
              <span className="text-xs" style={{ color:'var(--text-faint)' }}>
                {formatTime((endTime ?? duration) - startTime)} selected
              </span>
              <span className="text-rose-400">{formatTime(endTime ?? duration)} ◀</span>
            </div>
          </div>
        )}

        {/* Current time / duration */}
        <div className="flex justify-between text-xs font-mono" style={{ color:'var(--text-faint)' }}>
          <span>{formatTime(currentTime)}</span>
          <span style={{ color:'var(--text-muted)' }}>{file.name}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
