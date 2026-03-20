import React from 'react';
import { UploadCloud, FileVideo, FileAudio } from 'lucide-react';

export default function FileUploader({
  onFileSelect,
  accept = "video/*",
  multiple = false,
  title = "Upload File",
  description = "Drag & drop or click to browse",
  icon = 'video'
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files?.length > 0)
      onFileSelect(multiple ? Array.from(e.dataTransfer.files) : e.dataTransfer.files[0]);
  };
  const handleChange = (e) => {
    if (e.target.files?.length > 0)
      onFileSelect(multiple ? Array.from(e.target.files) : e.target.files[0]);
  };
  const IconComp = icon === 'audio' ? FileAudio : icon === 'video' ? FileVideo : UploadCloud;

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className="relative cursor-pointer group rounded-2xl transition-all duration-200 ease-out"
      style={{
        border: `2px dashed ${isDragOver ? 'rgba(99,102,241,0.7)' : 'var(--border-input)'}`,
        background: isDragOver ? 'rgba(99,102,241,0.07)' : 'var(--bg-card)',
        boxShadow: isDragOver ? '0 0 30px rgba(99,102,241,0.12)' : 'none',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <input type="file" ref={fileInputRef} onChange={handleChange} accept={accept} multiple={multiple} className="hidden" />
      <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-200"
          style={{
            background: isDragOver ? 'rgba(99,102,241,0.15)' : 'var(--bg-btn-ghost)',
            color: isDragOver ? '#818cf8' : 'var(--text-muted)',
            transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <IconComp size={28} />
        </div>
        <h3 className="font-heading font-semibold text-base mb-1.5 transition-colors" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="font-body text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>{description}</p>
        <div className="mt-5 px-5 py-2 rounded-xl text-xs font-body font-medium"
          style={{ background: 'var(--bg-btn-ghost)', border: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
          {multiple ? 'Select files' : 'Select file'}
        </div>
      </div>
    </div>
  );
}
