import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../styles/Traitors.css'

interface Phase {
  id: string
  icon: string
  title: string
  subtitle: string
  desc: string
  presets: number[]
  defaultTime: number
  ringColor: string
  accentColor: string
}

const PHASES: Phase[] = [
  {
    id: 'roundtable',
    icon: '🕯️',
    title: 'Round Table',
    subtitle: 'Deliberation',
    desc: 'Time for all players to debate and decide who to banish from the castle.',
    presets: [5, 10, 15],
    defaultTime: 10 * 60,
    accentColor: '#c9a84c',
    ringColor: '#e8c56a',
  },
  {
    id: 'banishment',
    icon: '⚔️',
    title: 'Banishment',
    subtitle: 'Final Verdict',
    desc: 'Countdown to the moment a player is banished. Are they Faithful or Traitor?',
    presets: [1, 2, 3],
    defaultTime: 60,
    accentColor: '#c0392b',
    ringColor: '#e74c3c',
  },
  {
    id: 'mission',
    icon: '🏰',
    title: 'The Mission',
    subtitle: 'Challenge',
    desc: 'Complete the mission before time runs out to add gold to the prize pot.',
    presets: [5, 10, 20],
    defaultTime: 10 * 60,
    accentColor: '#2980b9',
    ringColor: '#5dade2',
  },
  {
    id: 'murder',
    icon: '🗡️',
    title: 'Murder Council',
    subtitle: 'Traitors Only',
    desc: 'Traitors secretly convene to choose their next victim for the night.',
    presets: [2, 3, 5],
    defaultTime: 3 * 60,
    accentColor: '#8e44ad',
    ringColor: '#a569bd',
  },
  {
    id: 'shield',
    icon: '🛡️',
    title: 'Shield Decision',
    subtitle: 'Protection',
    desc: 'Claim a shield to protect yourself from the traitors lurking in the shadows.',
    presets: [1, 2, 3],
    defaultTime: 60,
    accentColor: '#27ae60',
    ringColor: '#52be80',
  },
]

type TimerState = {
  timeLeft: number
  total: number
  running: boolean
  done: boolean
  customMin: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext

function playToll() {
  try {
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 200
    gain.gain.setValueAtTime(0.6, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 3)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2); gain2.connect(ctx.destination)
    osc2.type = 'sine'; osc2.frequency.value = 300
    gain2.gain.setValueAtTime(0.2, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
    osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 2)

    setTimeout(() => {
      try {
        const ctx2 = new AudioCtx()
        const osc3 = ctx2.createOscillator()
        const gain3 = ctx2.createGain()
        osc3.connect(gain3); gain3.connect(ctx2.destination)
        osc3.type = 'sine'; osc3.frequency.value = 180
        gain3.gain.setValueAtTime(0.4, ctx2.currentTime)
        gain3.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 3)
        osc3.start(ctx2.currentTime); osc3.stop(ctx2.currentTime + 3)
      } catch (_) {}
    }, 1400)
  } catch (_) {}
}

function playTick() {
  try {
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'square'; osc.frequency.value = 880
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.07)
  } catch (_) {}
}

function fmt(timeLeft: number) {
  const m = Math.floor(timeLeft / 60)
  const s = timeLeft % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Traitors() {
  const [timers, setTimers] = useState<Record<string, TimerState>>(() => {
    const initial: Record<string, TimerState> = {}
    PHASES.forEach(p => {
      initial[p.id] = { timeLeft: p.defaultTime, total: p.defaultTime, running: false, done: false, customMin: '' }
    })
    return initial
  })
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  // Cursor auto-hide after 3s of inactivity
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const showCursor = () => {
      document.body.style.cursor = 'default'
      clearTimeout(timeout)
      timeout = setTimeout(() => { document.body.style.cursor = 'none' }, 3000)
    }
    document.addEventListener('mousemove', showCursor)
    return () => {
      document.removeEventListener('mousemove', showCursor)
      document.body.style.cursor = 'default'
      clearTimeout(timeout)
    }
  }, [])

  // Prevent body scroll in focus mode
  useEffect(() => {
    document.body.style.overflow = focusedId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [focusedId])

  const toggleTimer = useCallback((id: string) => {
    setTimers(prev => {
      const t = prev[id]
      if (t.done || t.timeLeft === 0) return prev
      if (t.running) {
        if (intervalRefs.current[id]) { clearInterval(intervalRefs.current[id]); delete intervalRefs.current[id] }
        return { ...prev, [id]: { ...t, running: false } }
      } else {
        if (!intervalRefs.current[id]) {
          intervalRefs.current[id] = setInterval(() => {
            setTimers(curr => {
              const timer = curr[id]
              if (timer.timeLeft <= 1) {
                if (intervalRefs.current[id]) { clearInterval(intervalRefs.current[id]); delete intervalRefs.current[id] }
                playToll()
                return { ...curr, [id]: { ...timer, timeLeft: 0, running: false, done: true } }
              }
              if (timer.timeLeft <= 10) playTick()
              return { ...curr, [id]: { ...timer, timeLeft: timer.timeLeft - 1 } }
            })
          }, 1000)
        }
        return { ...prev, [id]: { ...t, running: true } }
      }
    })
  }, [])

  const resetTimer = useCallback((id: string, newTotal?: number) => {
    if (intervalRefs.current[id]) { clearInterval(intervalRefs.current[id]); delete intervalRefs.current[id] }
    setTimers(prev => {
      const total = newTotal ?? prev[id].total
      return { ...prev, [id]: { ...prev[id], timeLeft: total, total, running: false, done: false } }
    })
  }, [])

  const setPreset = useCallback((id: string, minutes: number) => {
    if (intervalRefs.current[id]) { clearInterval(intervalRefs.current[id]); delete intervalRefs.current[id] }
    setTimers(prev => {
      const total = minutes * 60
      return { ...prev, [id]: { ...prev[id], timeLeft: total, total, running: false, done: false, customMin: '' } }
    })
  }, [])

  const handleCustomChange = useCallback((id: string, value: string) => {
    setTimers(prev => ({ ...prev, [id]: { ...prev[id], customMin: value } }))
  }, [])

  const applyCustom = useCallback((id: string) => {
    setTimers(prev => {
      const mins = parseFloat(prev[id].customMin)
      if (isNaN(mins) || mins <= 0 || mins > 999) return prev
      const total = Math.round(mins * 60)
      if (intervalRefs.current[id]) { clearInterval(intervalRefs.current[id]); delete intervalRefs.current[id] }
      return { ...prev, [id]: { ...prev[id], timeLeft: total, total, running: false, done: false } }
    })
  }, [])

  // Keyboard shortcuts in focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!focusedId) return
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); toggleTimer(focusedId) }
      if (e.code === 'KeyR') resetTimer(focusedId)
      if (e.code === 'Escape') setFocusedId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusedId, toggleTimer, resetTimer])

  useEffect(() => {
    const refs = intervalRefs.current
    return () => { Object.values(refs).forEach(clearInterval) }
  }, [])

  return (
    <div className="traitors-page">
      <SEO title="The Traitors – Round Table" description="Themed countdown timers for The Traitors game night" />

      {/* ---- FOCUS OVERLAY ---- */}
      {focusedId && (() => {
        const phase = PHASES.find(p => p.id === focusedId)!
        const timer = timers[focusedId]
        const isWarning = timer.timeLeft <= 30 && timer.timeLeft > 10 && timer.running
        const isUrgent  = timer.timeLeft <= 10 && timer.running && !timer.done
        const ringColor = timer.done ? '#e74c3c' : isUrgent ? '#e74c3c' : isWarning ? '#e67e22' : phase.ringColor
        const size = 300
        const r = size * 0.43
        const circ = 2 * Math.PI * r
        const offset = circ * (timer.total > 0 ? timer.timeLeft / timer.total : 0)

        return (
          <div
            className={`traitors-focus${timer.running ? ' running' : ''}${timer.done ? ' done' : ''}${isWarning ? ' warning' : ''}${isUrgent ? ' urgent' : ''}`}
            style={{ '--timer-accent': phase.accentColor, '--timer-ring': phase.ringColor } as React.CSSProperties}
          >
            <button className="traitors-focus-close" onClick={() => setFocusedId(null)} title="Close (Esc)">✕</button>

            <div className="traitors-focus-phase">
              <span className="traitors-focus-icon">{phase.icon}</span>
              <span className="traitors-focus-phase-name">{phase.title}</span>
              <span className="traitors-focus-phase-sub">{phase.subtitle}</span>
            </div>

            <div className="traitors-focus-ring-wrap">
              <svg className="traitors-focus-ring" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                  cx={size / 2} cy={size / 2} r={r} fill="none"
                  stroke={ringColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
                />
              </svg>
              <div className={`traitors-focus-time${timer.done ? ' times-up' : ''}${isUrgent ? ' urgent' : ''}${isWarning ? ' warning' : ''}`}>
                {timer.done ? "TIME'S UP" : fmt(timer.timeLeft)}
              </div>
            </div>

            <div className="traitors-focus-controls">
              <button className="traitors-btn start" onClick={() => toggleTimer(focusedId)} disabled={timer.done}>
                {timer.running ? 'Pause' : 'Start'}
              </button>
              <button className="traitors-btn reset" onClick={() => resetTimer(focusedId)}>Reset</button>
            </div>

            <div className="traitors-focus-hints">
              Space · Start/Pause &nbsp;·&nbsp; R · Reset &nbsp;·&nbsp; Esc · Close
            </div>
          </div>
        )
      })()}

      {/* ---- HEADER ---- */}
      <div className="traitors-header">
        <Link to="/tools" className="traitors-back">← Tools</Link>
        <div className="traitors-title-block">
          <span className="traitors-crown">👑</span>
          <h1 className="traitors-title">The Traitors</h1>
          <p className="traitors-subtitle">Round Table Countdowns</p>
        </div>
        <div className="traitors-header-spacer" />
      </div>

      {/* ---- TIMER CARDS ---- */}
      <div className="traitors-grid">
        {PHASES.map(phase => {
          const timer = timers[phase.id]
          const isWarning = timer.timeLeft <= 30 && timer.timeLeft > 10 && timer.running
          const isUrgent  = timer.timeLeft <= 10 && timer.running && !timer.done
          const ringColor = timer.done ? '#e74c3c' : isUrgent ? '#e74c3c' : isWarning ? '#e67e22' : phase.ringColor
          const radius = 76
          const circumference = 2 * Math.PI * radius
          const offset = circumference * (timer.total > 0 ? timer.timeLeft / timer.total : 0)

          return (
            <div
              key={phase.id}
              className={`traitors-card${timer.running ? ' running' : ''}${timer.done ? ' done' : ''}${isWarning ? ' warning' : ''}${isUrgent ? ' urgent' : ''}`}
              style={{ '--timer-accent': phase.accentColor, '--timer-ring': phase.ringColor } as React.CSSProperties}
            >
              <div className="traitors-card-header">
                <span className="traitors-phase-icon">{phase.icon}</span>
                <div className="traitors-phase-info">
                  <div className="traitors-phase-title">{phase.title}</div>
                  <div className="traitors-phase-sub">{phase.subtitle}</div>
                </div>
                <div className="traitors-card-actions">
                  {timer.running && <span className="traitors-live-dot" />}
                  <button
                    className="traitors-expand-btn"
                    onClick={() => setFocusedId(phase.id)}
                    title="Full screen"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4.5V1h3.5M8.5 1H12v3.5M12 8.5V12H8.5M4.5 12H1V8.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="traitors-phase-desc">{phase.desc}</p>

              <div className="traitors-ring-wrap">
                <svg className="traitors-ring" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                  <circle
                    cx="90" cy="90" r={radius} fill="none"
                    stroke={ringColor}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 90 90)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
                  />
                </svg>
                <div className={`traitors-time${timer.done ? ' times-up' : ''}${isUrgent ? ' urgent' : ''}${isWarning ? ' warning' : ''}`}>
                  {timer.done ? "TIME'S UP" : fmt(timer.timeLeft)}
                </div>
              </div>

              <div className="traitors-presets">
                {phase.presets.map(min => (
                  <button
                    key={min}
                    className={`traitors-preset-btn${timer.total === min * 60 ? ' active' : ''}`}
                    onClick={() => setPreset(phase.id, min)}
                  >
                    {min}m
                  </button>
                ))}
                <div className="traitors-custom-wrap">
                  <input
                    type="number"
                    className="traitors-custom-input"
                    placeholder="min"
                    min="0.5"
                    max="999"
                    value={timer.customMin}
                    onChange={e => handleCustomChange(phase.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyCustom(phase.id)}
                  />
                  <button className="traitors-custom-go" onClick={() => applyCustom(phase.id)}>Set</button>
                </div>
              </div>

              <div className="traitors-controls">
                <button className="traitors-btn start" onClick={() => toggleTimer(phase.id)} disabled={timer.done}>
                  {timer.running ? 'Pause' : 'Start'}
                </button>
                <button className="traitors-btn reset" onClick={() => resetTimer(phase.id)}>Reset</button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="traitors-footer">
        May the faithful prevail... or may the traitors triumph.
      </p>
    </div>
  )
}
