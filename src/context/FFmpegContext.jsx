import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const FFmpegContext = createContext(null);

export const FFmpegProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef('');

  useEffect(() => {
    const loadFFmpeg = async () => {
      // Prevent double loading
      if (loaded || loading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        const ffmpeg = ffmpegRef.current;
        
        // Hook into ffmpeg logs to display in our custom console later
        ffmpeg.on('log', ({ message }) => {
          messageRef.current += message + '\n';
          console.log('[FFMPEG]:', message);
        });

        // toBlobURL handles CORS/COEP restrictions when loading from a CDN
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        
        setLoaded(true);
      } catch (err) {
        console.error('Error loading FFmpeg:', err);
        setError('Failed to load FFmpeg. Please ensure COOP/COEP headers are active.');
      } finally {
        setLoading(false);
      }
    };

    loadFFmpeg();

  }, [loaded, loading]);

  const value = {
    ffmpeg: ffmpegRef.current,
    loaded,
    loading,
    error,
    messages: messageRef
  };

  return (
    <FFmpegContext.Provider value={value}>
      {children}
    </FFmpegContext.Provider>
  );
};

export const useFFmpeg = () => useContext(FFmpegContext);
