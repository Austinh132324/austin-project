import { useRef, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/MusicVisualizer.css'

type VisMode = 'bars' | 'wave' | 'circular'

export default function MusicVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animRef = useRef<number>(0)

  const [mode, setMode] = useState<VisMode>('bars')
  const [active, setActive] = useState(false)
  const [inputType, setInputType] = useState<'file' | 'mic'>('file')

  const startVisualization = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')!
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    function draw() {
      const rect = canvas!.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const w = rect.width, h = rect.height

      ctx.fillStyle = '#0a0a1f'
      ctx.fillRect(0, 0, w, h)

      analyser!.getByteFrequencyData(dataArray)

      if (mode === 'bars') {
        const barW = (w / bufferLength) * 2.5
        for (let i = 0; i < bufferLength; i++) {
          const barH = (dataArray[i] / 255) * h * 0.85
          const ratio = i / bufferLength
          const r = Math.round(233 * (1 - ratio) + 83 * ratio)
          const g = Math.round(69 * (1 - ratio) + 52 * ratio)
          const b = Math.round(96 * (1 - ratio) + 131 * ratio)
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(i * barW, h - barH, barW - 1, barH)
        }
      } else if (mode === 'wave') {
        analyser!.getByteTimeDomainData(dataArray)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#e94560'
        ctx.beginPath()
        const sliceWidth = w / bufferLength
        let x = 0
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * h) / 2
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
          x += sliceWidth
        }
        ctx.lineTo(w, h / 2)
        ctx.stroke()
      } else if (mode === 'circular') {
        const cx = w / 2, cy = h / 2
        const baseRadius = Math.min(w, h) * 0.2
        for (let i = 0; i < bufferLength; i++) {
          const angle = (i / bufferLength) * Math.PI * 2
          const amp = (dataArray[i] / 255) * baseRadius * 1.5
          const x1 = cx + Math.cos(angle) * baseRadius
          const y1 = cy + Math.sin(angle) * baseRadius
          const x2 = cx + Math.cos(angle) * (baseRadius + amp)
          const y2 = cy + Math.sin(angle) * (baseRadius + amp)
          const ratio = i / bufferLength
          ctx.strokeStyle = `hsl(${340 + ratio * 60}, 80%, ${50 + (dataArray[i] / 255) * 30}%)`
          ctx.lineWidth = 2
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    cancelAnimationFrame(animRef.current)
    draw()
  }, [mode])

  const setupAudio = useCallback((source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode) => {
    const audioCtx = audioCtxRef.current!
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    if (source instanceof MediaElementAudioSourceNode) {
      analyser.connect(audioCtx.destination)
    }
    analyserRef.current = analyser
    sourceRef.current = source
    setActive(true)
    startVisualization()
  }, [startVisualization])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clean up previous
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (audioCtxRef.current) audioCtxRef.current.close()

    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const audio = new Audio(URL.createObjectURL(file))
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio
    const source = audioCtx.createMediaElementSource(audio)
    setupAudio(source)
    audio.play()
  }, [setupAudio])

  const handleMic = useCallback(async () => {
    if (audioCtxRef.current) audioCtxRef.current.close()
    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = audioCtx.createMediaStreamSource(stream)
    setInputType('mic')
    setupAudio(source)
  }, [setupAudio])

  useEffect(() => {
    if (active) startVisualization()
  }, [mode, active, startVisualization])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current)
      if (audioRef.current) audioRef.current.pause()
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  return (
    <div className="viz-page">
      <div className="viz-top-bar">
        <Link to="/tools" className="viz-back-link">Tools</Link>
        <h1>Music Visualizer</h1>
      </div>

      <div className="viz-controls">
        <label className="viz-file-label">
          Upload Audio
          <input type="file" accept="audio/*" onChange={handleFile} hidden />
        </label>
        <button className="viz-btn" onClick={handleMic}>Use Microphone</button>
        <div className="viz-modes">
          {(['bars', 'wave', 'circular'] as VisMode[]).map(m => (
            <button key={m} className={`viz-mode-btn${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="viz-canvas-wrap">
        <canvas ref={canvasRef} />
        {!active && (
          <div className="viz-placeholder">Upload audio or enable microphone to start</div>
        )}
      </div>

      <div className="viz-footer">
        {active ? `Visualizing ${inputType === 'mic' ? 'microphone' : 'audio file'}` : 'Select an audio source to begin'}
      </div>
    </div>
  )
}
