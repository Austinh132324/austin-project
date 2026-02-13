import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../styles/Analytics.css'

interface AnalyticsEvent {
  type: string
  page: string
  timestamp: number
}

function getEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem('analytics-events') || '[]')
  } catch { return [] }
}

function addEvent(type: string, page: string) {
  const events = getEvents()
  events.push({ type, page, timestamp: Date.now() })
  // Keep last 1000 events
  if (events.length > 1000) events.splice(0, events.length - 1000)
  localStorage.setItem('analytics-events', JSON.stringify(events))
}

function getPageCounts(events: AnalyticsEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    if (e.type === 'pageview') {
      counts[e.page] = (counts[e.page] || 0) + 1
    }
  }
  return counts
}

function getDailyCounts(events: AnalyticsEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    const day = new Date(e.timestamp).toISOString().slice(0, 10)
    counts[day] = (counts[day] || 0) + 1
  }
  return counts
}

// Track page view on mount (exported for use in App.tsx)
export function trackPageView(page: string) {
  addEvent('pageview', page)
}

export function trackGamePlay(game: string) {
  addEvent('game', game)
}

export default function Analytics() {
  const [events, setEvents] = useState<AnalyticsEvent[]>(getEvents)
  const barCanvasRef = useRef<HTMLCanvasElement>(null)
  const lineCanvasRef = useRef<HTMLCanvasElement>(null)

  const pageCounts = getPageCounts(events)
  const dailyCounts = getDailyCounts(events)
  const totalViews = events.filter(e => e.type === 'pageview').length
  const totalGames = events.filter(e => e.type === 'game').length

  const drawBarChart = useCallback(() => {
    const canvas = barCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width, h = rect.height
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.fillRect(0, 0, w, h)

    const entries = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    if (entries.length === 0) {
      ctx.fillStyle = '#606080'; ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('No data yet', w / 2, h / 2)
      return
    }

    const max = Math.max(...entries.map(e => e[1]))
    const barW = Math.min(60, (w - 40) / entries.length - 10)
    const gap = (w - entries.length * barW) / (entries.length + 1)

    entries.forEach(([page, count], i) => {
      const barH = (count / max) * (h - 50)
      const x = gap + i * (barW + gap)
      const y = h - barH - 30

      const grad = ctx.createLinearGradient(x, y, x, h - 30)
      grad.addColorStop(0, '#e94560')
      grad.addColorStop(1, '#533483')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, 4)
      ctx.fill()

      ctx.fillStyle = '#a0a0b8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(page.replace('/', '') || 'home', x + barW / 2, h - 12)
      ctx.fillText(String(count), x + barW / 2, y - 6)
    })
  }, [pageCounts])

  const drawLineChart = useCallback(() => {
    const canvas = lineCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width, h = rect.height
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.fillRect(0, 0, w, h)

    const entries = Object.entries(dailyCounts).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
    if (entries.length === 0) {
      ctx.fillStyle = '#606080'; ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('No data yet', w / 2, h / 2)
      return
    }

    const max = Math.max(...entries.map(e => e[1]), 1)
    const padX = 40, padY = 30
    const plotW = w - padX * 2, plotH = h - padY * 2

    ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2
    ctx.beginPath()
    entries.forEach(([, count], i) => {
      const x = padX + (i / (entries.length - 1 || 1)) * plotW
      const y = padY + plotH - (count / max) * plotH
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Dots
    entries.forEach(([date, count], i) => {
      const x = padX + (i / (entries.length - 1 || 1)) * plotW
      const y = padY + plotH - (count / max) * plotH
      ctx.fillStyle = '#e94560'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#a0a0b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(date.slice(5), x, h - 8)
    })
  }, [dailyCounts])

  useEffect(() => {
    drawBarChart()
    drawLineChart()
  }, [drawBarChart, drawLineChart])

  const clearData = () => {
    localStorage.removeItem('analytics-events')
    setEvents([])
  }

  return (
    <div className="analytics-page">
      <div className="analytics-top-bar">
        <Link to="/" className="analytics-back-link">&larr; Home</Link>
        <h1>Analytics</h1>
      </div>

      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <div className="analytics-stat-val">{totalViews}</div>
          <div className="analytics-stat-label">Page Views</div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-val">{totalGames}</div>
          <div className="analytics-stat-label">Games Played</div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-val">{Object.keys(pageCounts).length}</div>
          <div className="analytics-stat-label">Pages Visited</div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-val">{Object.keys(dailyCounts).length}</div>
          <div className="analytics-stat-label">Active Days</div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="analytics-chart-card">
          <h3>Page Views by Route</h3>
          <canvas ref={barCanvasRef} />
        </div>
        <div className="analytics-chart-card">
          <h3>Activity Over Time</h3>
          <canvas ref={lineCanvasRef} />
        </div>
      </div>

      <button className="analytics-clear" onClick={clearData}>Clear Analytics Data</button>
    </div>
  )
}
