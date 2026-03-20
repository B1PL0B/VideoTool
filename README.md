# VideoTool 🎬⚡

> **100% local, lossless video processing powered by `ffmpeg.wasm`** — no uploads, no servers, zero quality loss.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FB1PL0B%2FVideoTool&project-name=videotool&repository-name=VideoTool)
[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/B1PL0B/VideoTool)

---

## ✨ Features

All 6 tools run **entirely in your browser** using WebAssembly. Nothing ever leaves your machine.

| Tool | Description | FFmpeg Strategy |
|------|-------------|-----------------|
| 🛡️ **Copyright Remover** | Split into fragments, skip micro-gaps, optionally shuffle, re-merge | Multi-pass `-c copy` + concat demuxer |
| ✂️ **Lossless Video Cutter** | Trim A→B with keyframe-snap fast seek | `-ss` input seek + `-c copy` |
| 🔗 **Lossless Video Merger** | Concatenate same-codec clips | concat demuxer `-c copy` |
| 🎵 **Audio Extractor** | Rip raw audio track with auto codec detection | `-vn -acodec copy` |
| 🎞️ **Video & Audio Muxer** | Replace or add audio tracks losslessly | `-map` stream selection + `-c copy` |
| 📝 **Subtitle Extractor** | Extract embedded SRT/VTT soft subtitles | `-map 0:s:0 -c copy` |

---

## 🚀 Quick Start

```bash
git clone https://github.com/B1PL0B/VideoTool.git
cd VideoTool
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🛠️ Tech Stack

- **React 18** (Vite + SWC) — lightning fast HMR
- **TailwindCSS v3** — utility-first styling
- **`@ffmpeg/ffmpeg` v0.12** — WASM-compiled FFmpeg in the browser
- **`@ffmpeg/util`** — file fetch helpers
- **Poppins + Inter** — from Google Fonts

---

## 🔒 Cross-Origin Isolation (REQUIRED)

`ffmpeg.wasm` requires `SharedArrayBuffer` for multi-threading. The app **must** be served with these HTTP headers:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These are pre-configured for all three environments:

| Environment | Config File |
|-------------|-------------|
| Local dev | `vite.config.js` → `server.headers` |
| **Cloudflare Pages** | `public/_headers` |
| **Vercel** | `vercel.json` |

---

## ☁️ Deploy to Cloudflare Pages

1. Click the **Deploy to Cloudflare Pages** button above **or** fork this repo and connect it in the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. The `public/_headers` file automatically configures COOP/COEP — no extra setup needed.

## ▲ Deploy to Vercel

1. Click the **Deploy with Vercel** button above **or** import the repo at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Vite**
3. No additional configuration needed — `vercel.json` handles the security headers.

---

## 🎨 UI Design System

Generated via the **UI/UX Pro Max** skill:

- **Theme**: Cinema Dark + Cloud Pro Day Mode (toggleable via ☀️/🌙 button)
- **Colors**: `#08081A` base dark, `#E11D48` CTA rose, `#6366F1` accent indigo
- **Typography**: Poppins (headings) + Inter (body)
- **Style**: Glassmorphism (15px blur, `rgba(255,255,255,0.06)` fill)

---

## ⚠️ Keyframe Snapping Note

Because all operations use **stream copy** (`-c copy`), cuts snap to the nearest keyframe. This makes processing nearly instant but may offset a cut by up to ~2 seconds. This is expected behavior — re-encoding would fix this at the cost of quality loss and processing time.

---

## 📁 Project Structure

```
VideoTool/
├── public/
│   └── _headers          # Cloudflare Pages COOP/COEP
├── src/
│   ├── components/       # Layout, Sidebar, FileUploader, ProgressBar, LogConsole
│   ├── context/          # FFmpegContext, ThemeContext
│   └── tools/            # 6 processing tools
├── vercel.json           # Vercel COOP/COEP headers
└── vite.config.js        # Vite dev headers + WASM optimisation
```

---

## 📄 License

MIT © [B1PL0B](https://github.com/B1PL0B)
