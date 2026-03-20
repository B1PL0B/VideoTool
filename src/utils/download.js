/**
 * Reliably triggers a file download in Cross-Origin Isolated contexts
 * (where ffmpeg.wasm's SharedArrayBuffer requires COOP/COEP headers).
 *
 * Inline href={URL.createObjectURL(...)} in JSX is blocked in these contexts;
 * an imperative anchor click is the only reliable approach.
 *
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The suggested filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Small delay before cleanup so the browser has time to start the download
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}
