import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import StarField from '../components/StarField'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import '../styles/Analytics.css'

interface AnalyticsEvent {
  type: string
  page: string
  timestamp: number
  label?: string
}

function getEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem('analytics-events') || '[]')
  } catch { return [] }
}

function addEvent(type: string, page: string, label?: string) {
  const events = getEvents()
  events.push({ type, page, timestamp: Date.now(), label })
  if (events.length > 2000) events.splice(0, events.length - 2000)
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

function getClickCounts(events: AnalyticsEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    if (e.type === 'click' && e.label) {
      counts[e.label] = (counts[e.label] || 0) + 1
    }
  }
  return counts
}

function getUniqueVisitors(events: AnalyticsEvent[]): number {
  const days = new Set<string>()
  for (const e of events) {
    if (e.type === 'pageview') {
      days.add(new Date(e.timestamp).toISOString().slice(0, 10))
    }
  }
  return days.size
}

function getHourlyCounts(events: AnalyticsEvent[]): number[] {
  const hours = new Array(24).fill(0)
  for (const e of events) {
    if (e.type === 'pageview') {
      hours[new Date(e.timestamp).getHours()]++
    }
  }
  return hours
}

export function trackPageView(page: string) {
  addEvent('pageview', page)
}

export function trackGamePlay(game: string) {
  addEvent('game', game)
}

export function trackClick(label: string) {
  addEvent('click', window.location.hash.replace('#', '') || '/', label)
}

export default function Analytics() {
  const [events, setEvents] = useState<AnalyticsEvent[]>(getEvents)
  const barCanvasRef = useRef<HTMLCanvasElement>(null)
  const lineCanvasRef = useRef<HTMLCanvasElement>(null)
  const clickCanvasRef = useRef<HTMLCanvasElement>(null)
  const hourCanvasRef = useRef<HTMLCanvasElement>(null)

  const pageCounts = getPageCounts(events)
  const dailyCounts = getDailyCounts(events)
  const clickCounts = getClickCounts(events)
  const totalViews = events.filter(e => e.type === 'pageview').length
  const totalClicks = events.filter(e => e.type === 'click').length
  const totalGames = events.filter(e => e.type === 'game').length
  const uniqueVisitors = getUniqueVisitors(events)
  const hourlyCounts = getHourlyCounts(events)

  const drawBarChart = useCallback(() => {
    const canvas = barCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const w = rect.width, h = rect.height
    ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(0, 0, w, h)

    const entries = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    if (entries.length === 0) {
      ctx.fillStyle = '#606080'; ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('No data yet', w / 2, h / 2); return
    }
    const max = Math.max(...entries.map(e => e[1]))
    const barW = Math.min(60, (w - 40) / entries.length - 10)
    const gap = (w - entries.length * barW) / (entries.length + 1)
    entries.forEach(([page, count], i) => {
      const barH = (count / max) * (h - 50)
      const x = gap + i * (barW + gap), y = h - barH - 30
      const grad = ctx.createLinearGradient(x, y, x, h - 30)
      grad.addColorStop(0, '#e94560'); grad.addColorStop(1, '#533483')
      ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 4); ctx.fill()
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
    ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(0, 0, w, h)

    const entries = Object.entries(dailyCounts).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
    if (entries.length === 0) {
      ctx.fillStyle = '#606080'; ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('No data yet', w / 2, h / 2); return
    }
    const max = Math.max(...entries.map(e => e[1]), 1)
    const padX = 40, padY = 30, plotW = w - padX * 2, plotH = h - padY * 2
    ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2; ctx.beginPath()
    entries.forEach(([, count], i) => {
      const x = padX + (i / (entries.length - 1 || 1)) * plotW
      const y = padY + plotH - (count / max) * plotH
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()
    entries.forEach(([date, count], i) => {
      const x = padX + (i / (entries.length - 1 || 1)) * plotW
      const y = padY + plotH - (count / max) * plotH
      ctx.fillStyle = '#e94560'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#a0a0b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(date.slice(5), x, h - 8)
    })
  }, [dailyCounts])

  const drawClickChart = useCallback(() => {
    const canvas = clickCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const w = rect.width, h = rect.height
    ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(0, 0, w, h)

    const entries = Object.entries(clickCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    if (entries.length === 0) {
      ctx.fillStyle = '#606080'; ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('No click data yet', w / 2, h / 2); return
    }
    const max = Math.max(...entries.map(e => e[1]))
    const barH = Math.min(24, (h - 20) / entries.length - 4)
    const padLeft = 120
    entries.forEach(([label, count], i) => {
      const y = 10 + i * (barH + 6)
      const barW = ((w - padLeft - 40) * count) / max
      const grad = ctx.createLinearGradient(padLeft, y, padLeft + barW, y)
      grad.addColorStop(0, '#00e5ff'); grad.addColorStop(1, '#a478e8')
      ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(padLeft, y, barW, barH, 3); ctx.fill()
      ctx.fillStyle = '#a0a0b8'; ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(label.length > 16 ? label.slice(0, 16) + '...' : label, padLeft - 8, y + barH / 2 + 3)
      ctx.textAlign = 'left'
      ctx.fillText(String(count), padLeft + barW + 6, y + barH / 2 + 3)
    })
  }, [clickCounts])

  const drawHourChart = useCallback(() => {
    const canvas = hourCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const w = rect.width, h = rect.height
    ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(0, 0, w, h)
    const max = Math.max(...hourlyCounts, 1)
    const barW = (w - 20) / 24 - 2, padBottom = 24
    hourlyCounts.forEach((count, i) => {
      const barH = (count / max) * (h - 40 - padBottom)
      const x = 10 + i * (barW + 2), y = h - barH - padBottom
      const grad = ctx.createLinearGradient(x, y, x, h - padBottom)
      grad.addColorStop(0, '#4ade80'); grad.addColorStop(1, '#22c55e')
      ctx.fillStyle = count > 0 ? grad : 'rgba(255,255,255,0.04)'
      ctx.beginPath(); ctx.roundRect(x, y, barW, barH || 2, 2); ctx.fill()
      if (i % 3 === 0) {
        ctx.fillStyle = '#606080'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${i}h`, x + barW / 2, h - 8)
      }
    })
  }, [hourlyCounts])

  useEffect(() => {
    drawBarChart(); drawLineChart(); drawClickChart(); drawHourChart()
  }, [drawBarChart, drawLineChart, drawClickChart, drawHourChart])

  const clearData = () => {
    localStorage.removeItem('analytics-events')
    setEvents([])
  }

  return (
    <>
    <SEO title="Analytics" description="Website analytics and visitor tracking" />
    <StarField shootingStars />
    <Navbar />
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
          <div className="analytics-stat-val">{totalClicks}</div>
          <div className="analytics-stat-label">Clicks</div>
        </div>
        <div className="analytics-stat-card">
          <div className="analytics-stat-val">{uniqueVisitors}</div>
          <div className="analytics-stat-label">Active Days</div>
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
          <div className="analytics-stat-val">{events.length}</div>
          <div className="analytics-stat-label">Total Events</div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="analytics-chart-card">
          <h3>Page Views by Route</h3>
          <canvas ref={barCanvasRef} />
        </div>
        <div className="analytics-chart-card">
          <h3>Visitors Over Time</h3>
          <canvas ref={lineCanvasRef} />
        </div>
        <div className="analytics-chart-card">
          <h3>Top Clicks</h3>
          <canvas ref={clickCanvasRef} />
        </div>
        <div className="analytics-chart-card">
          <h3>Activity by Hour</h3>
          <canvas ref={hourCanvasRef} />
        </div>
      </div>

      <button className="analytics-clear" onClick={clearData}>Clear Analytics Data</button>
    </div>
    </>
  )
}
