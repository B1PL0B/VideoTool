import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { FFmpegProvider } from './context/FFmpegContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <FFmpegProvider>
        <App />
      </FFmpegProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
