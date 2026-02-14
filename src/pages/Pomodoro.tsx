import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../styles/Pomodoro.css'

type Mode = 'work' | 'shortBreak' | 'longBreak'

const DEFAULTS: Record<Mode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

const LABELS: Record<Mode, string> = {
  work: 'Work',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

function beep() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 800
  gain.gain.value = 0.3
  osc.start()
  osc.stop(ctx.currentTime + 0.2)
  setTimeout(() => {
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2); gain2.connect(ctx.destination)
    osc2.frequency.value = 1000; gain2.gain.value = 0.3
    osc2.start(); osc2.stop(ctx.currentTime + 0.3)
  }, 250)
}

export default function Pomodoro() {
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState(DEFAULTS.work)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('pomodoro-sessions')
    return saved ? parseInt(saved, 10) : 0
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = DEFAULTS[mode]
  const progress = 1 - timeLeft / total
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  useEffect(() => {
    localStorage.setItem('pomodoro-sessions', String(sessions))
  }, [sessions])

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    setRunning(false)
  }, [])

  const switchMode = useCallback((m: Mode) => {
    stop()
    setMode(m)
    setTimeLeft(DEFAULTS[m])
  }, [stop])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stop()
          beep()
          if (mode === 'work') {
            setSessions(s => s + 1)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, stop])

  const reset = () => { stop(); setTimeLeft(DEFAULTS[mode]) }

  // SVG ring
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className="pomo-page">
      <SEO title="Pomodoro Timer" description="Focus timer with work and break sessions" />
      <div className="pomo-top-bar">
        <Link to="/tools" className="pomo-back-link">Tools</Link>
        <h1>Pomodoro</h1>
      </div>

      <div className="pomo-modes">
        {(Object.keys(DEFAULTS) as Mode[]).map(m => (
          <button key={m} className={`pomo-mode-btn${mode === m ? ' active' : ''}`} onClick={() => switchMode(m)}>
            {LABELS[m]}
          </button>
        ))}
      </div>

      <div className="pomo-timer-wrap">
        <svg className="pomo-ring" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke={mode === 'work' ? '#e94560' : '#4ade80'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.5s' }}
          />
        </svg>
        <div className="pomo-time">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="pomo-controls">
        <button className="pomo-btn" onClick={() => setRunning(!running)}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="pomo-btn secondary" onClick={reset}>Reset</button>
      </div>

      <div className="pomo-sessions">Sessions completed: {sessions}</div>
      <div className="pomo-footer">Focus for 25 minutes, then take a break</div>
    </div>
  )
}
