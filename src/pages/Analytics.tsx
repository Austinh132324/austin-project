import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import StarField from '../components/StarField'
import SEO from '../components/SEO'
import '../styles/Analytics.css'

/* ─── Visitor ID ─── */
function getVisitorId(): string {
  let id = localStorage.getItem('analytics-visitor-id')
  if (!id) {
    id = crypto.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('analytics-visitor-id', id)
  }
  return id
}

/* ─── Events ─── */
interface AnalyticsEvent {
  type: string
  page: string
  timestamp: number
  label?: string
  visitorId?: string
}

function getEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem('analytics-events') || '[]')
  } catch { return [] }
}

function addEvent(type: string, page: string, label?: string) {
  const events = getEvents()
  events.push({ type, page, timestamp: Date.now(), label, visitorId: getVisitorId() })
  if (events.length > 5000) events.splice(0, events.length - 5000)
  localStorage.setItem('analytics-events', JSON.stringify(events))
}

function getPageCounts(events: AnalyticsEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    if (e.type === 'pageview') counts[e.page] = (counts[e.page] || 0) + 1
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

function getDailyVisitorCounts(events: AnalyticsEvent[]): Record<string, number> {
  const dayVisitors: Record<string, Set<string>> = {}
  for (const e of events) {
    if (e.type === 'pageview' && e.visitorId) {
      const day = new Date(e.timestamp).toISOString().slice(0, 10)
      if (!dayVisitors[day]) dayVisitors[day] = new Set()
      dayVisitors[day].add(e.visitorId)
    }
  }
  const counts: Record<string, number> = {}
  for (const [day, set] of Object.entries(dayVisitors)) counts[day] = set.size
  return counts
}

function getClickCounts(events: AnalyticsEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    if (e.type === 'click' && e.label) counts[e.label] = (counts[e.label] || 0) + 1
  }
  return counts
}

function getUniqueVisitorCount(events: AnalyticsEvent[]): number {
  const ids = new Set<string>()
  for (const e of events) {
    if (e.visitorId) ids.add(e.visitorId)
  }
  return Math.max(ids.size, 1) // At least 1 (the current user)
}

function getActiveDays(events: AnalyticsEvent[]): number {
  const days = new Set<string>()
  for (const e of events) {
    if (e.type === 'pageview') days.add(new Date(e.timestamp).toISOString().slice(0, 10))
  }
  return days.size
}

function getHourlyCounts(events: AnalyticsEvent[]): number[] {
  const hours = new Array(24).fill(0)
  for (const e of events) {
    if (e.type === 'pageview') hours[new Date(e.timestamp).getHours()]++
  }
  return hours
}

function getSessionCount(events: AnalyticsEvent[]): number {
  // A session is a group of events from the same visitor within 30 min
  const sorted = events.filter(e => e.type === 'pageview').sort((a, b) => a.timestamp - b.timestamp)
  if (sorted.length === 0) return 0
  let sessions = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].timestamp - sorted[i - 1].timestamp > 30 * 60 * 1000) sessions++
  }
  return sessions
}

function getBounceRate(events: AnalyticsEvent[]): number {
  // Approximate: sessions with only 1 pageview
  const sorted = events.filter(e => e.type === 'pageview').sort((a, b) => a.timestamp - b.timestamp)
  if (sorted.length === 0) return 0
  let sessions = 0
  let singlePageSessions = 0
  let sessionViews = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].timestamp - sorted[i - 1].timestamp > 30 * 60 * 1000) {
      sessions++
      if (sessionViews === 1) singlePageSessions++
      sessionViews = 1
    } else {
      sessionViews++
    }
  }
  sessions++
  if (sessionViews === 1) singlePageSessions++
  return sessions > 0 ? Math.round((singlePageSessions / sessions) * 100) : 0
}

export function trackPageView(page: string) { addEvent('pageview', page) }
export function trackGamePlay(game: string) { addEvent('game', game) }
export function trackClick(label: string) { addEvent('click', window.location.hash.replace('#', '') || '/', label) }

/* ─── Power BI color palette ─── */
const PBI = {
  blue: '#118DFF',
  orange: '#F2C80F',
  green: '#12B5CB',
  red: '#E94560',
  purple: '#A478E8',
  teal: '#0CC0DF',
  gray: '#605E5C',
}

type NavSection = 'overview' | 'pageviews' | 'clicks' | 'visitors' | 'hourly' | 'events'

const NAV_ITEMS: { id: NavSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '\u2302' },
  { id: 'pageviews', label: 'Page Views', icon: '\uD83D\uDCC4' },
  { id: 'clicks', label: 'Clicks', icon: '\uD83D\uDDB1' },
  { id: 'visitors', label: 'Visitors', icon: '\uD83D\uDCC8' },
  { id: 'hourly', label: 'Hourly Activity', icon: '\u23F0' },
  { id: 'events', label: 'Event Log', icon: '\uD83D\uDCCB' },
]

export default function Analytics() {
  const [events, setEvents] = useState<AnalyticsEvent[]>(getEvents)
  const [activeSection, setActiveSection] = useState<NavSection>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const barCanvasRef = useRef<HTMLCanvasElement>(null)
  const lineCanvasRef = useRef<HTMLCanvasElement>(null)
  const clickCanvasRef = useRef<HTMLCanvasElement>(null)
  const hourCanvasRef = useRef<HTMLCanvasElement>(null)
  const visitorCanvasRef = useRef<HTMLCanvasElement>(null)

  const pageCounts = getPageCounts(events)
  const dailyCounts = getDailyCounts(events)
  const dailyVisitorCounts = getDailyVisitorCounts(events)
  const clickCounts = getClickCounts(events)
  const totalViews = events.filter(e => e.type === 'pageview').length
  const totalClicks = events.filter(e => e.type === 'click').length
  const totalGames = events.filter(e => e.type === 'game').length
  const uniqueVisitors = getUniqueVisitorCount(events)
  const activeDays = getActiveDays(events)
  const hourlyCounts = getHourlyCounts(events)
  const sessions = getSessionCount(events)
  const bounceRate = getBounceRate(events)
  const avgViewsPerSession = sessions > 0 ? (totalViews / sessions).toFixed(1) : '0'

  const drawChart = useCallback((
    canvas: HTMLCanvasElement | null,
    painter: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  ) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    painter(ctx, rect.width, rect.height)
  }, [])

  const drawBarChart = useCallback(() => {
    drawChart(barCanvasRef.current, (ctx, w, h) => {
      const entries = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)
      if (entries.length === 0) {
        ctx.fillStyle = '#605E5C'; ctx.font = '14px "Segoe UI", sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('No page view data yet', w / 2, h / 2); return
      }
      const max = Math.max(...entries.map(e => e[1]))
      const padBottom = 48, padTop = 24
      const barW = Math.min(56, (w - 48) / entries.length - 8)
      const gap = (w - entries.length * barW) / (entries.length + 1)
      // Grid lines
      for (let g = 0; g <= 4; g++) {
        const gy = padTop + ((h - padTop - padBottom) / 4) * g
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath()
        ctx.moveTo(gap, gy); ctx.lineTo(w - gap, gy); ctx.stroke()
      }
      entries.forEach(([page, count], i) => {
        const barH = (count / max) * (h - padTop - padBottom)
        const x = gap + i * (barW + gap), y = h - barH - padBottom
        ctx.fillStyle = PBI.blue
        ctx.beginPath(); ctx.roundRect(x, y, barW, barH, [3, 3, 0, 0]); ctx.fill()
        // Label
        ctx.fillStyle = '#A19F9D'; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center'
        const label = (page.replace(/^\//, '') || 'home')
        ctx.fillText(label.length > 10 ? label.slice(0, 9) + '..' : label, x + barW / 2, h - 24)
        // Value
        ctx.fillStyle = '#E1DFDD'; ctx.font = 'bold 11px "Segoe UI", sans-serif'
        ctx.fillText(String(count), x + barW / 2, y - 6)
      })
    })
  }, [drawChart, pageCounts])

  const drawLineChart = useCallback(() => {
    drawChart(lineCanvasRef.current, (ctx, w, h) => {
      const entries = Object.entries(dailyCounts).sort((a, b) => a[0].localeCompare(b[0])).slice(-21)
      if (entries.length === 0) {
        ctx.fillStyle = '#605E5C'; ctx.font = '14px "Segoe UI", sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('No data yet', w / 2, h / 2); return
      }
      const max = Math.max(...entries.map(e => e[1]), 1)
      const padX = 48, padY = 28, plotW = w - padX * 2, plotH = h - padY * 2
      // Grid lines
      for (let g = 0; g <= 4; g++) {
        const gy = padY + (plotH / 4) * g
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath()
        ctx.moveTo(padX, gy); ctx.lineTo(w - padX, gy); ctx.stroke()
        ctx.fillStyle = '#A19F9D'; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(String(Math.round(max * (1 - g / 4))), padX - 8, gy + 3)
      }
      // Area
      ctx.beginPath()
      entries.forEach(([, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.lineTo(padX + plotW, padY + plotH); ctx.lineTo(padX, padY + plotH); ctx.closePath()
      const areaGrad = ctx.createLinearGradient(0, padY, 0, padY + plotH)
      areaGrad.addColorStop(0, 'rgba(17,141,255,0.18)'); areaGrad.addColorStop(1, 'rgba(17,141,255,0)')
      ctx.fillStyle = areaGrad; ctx.fill()
      // Line
      ctx.strokeStyle = PBI.blue; ctx.lineWidth = 2.5; ctx.beginPath()
      entries.forEach(([, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.stroke()
      // Dots + date labels
      entries.forEach(([date, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        ctx.fillStyle = PBI.blue; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill()
        if (entries.length <= 14 || i % 2 === 0) {
          ctx.fillStyle = '#A19F9D'; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(date.slice(5), x, h - 8)
        }
      })
    })
  }, [drawChart, dailyCounts])

  const drawVisitorChart = useCallback(() => {
    drawChart(visitorCanvasRef.current, (ctx, w, h) => {
      const entries = Object.entries(dailyVisitorCounts).sort((a, b) => a[0].localeCompare(b[0])).slice(-21)
      if (entries.length === 0) {
        ctx.fillStyle = '#605E5C'; ctx.font = '14px "Segoe UI", sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('No visitor data yet', w / 2, h / 2); return
      }
      const max = Math.max(...entries.map(e => e[1]), 1)
      const padX = 48, padY = 28, plotW = w - padX * 2, plotH = h - padY * 2
      for (let g = 0; g <= 4; g++) {
        const gy = padY + (plotH / 4) * g
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath()
        ctx.moveTo(padX, gy); ctx.lineTo(w - padX, gy); ctx.stroke()
        ctx.fillStyle = '#A19F9D'; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(String(Math.round(max * (1 - g / 4))), padX - 8, gy + 3)
      }
      // Area
      ctx.beginPath()
      entries.forEach(([, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.lineTo(padX + plotW, padY + plotH); ctx.lineTo(padX, padY + plotH); ctx.closePath()
      const areaGrad = ctx.createLinearGradient(0, padY, 0, padY + plotH)
      areaGrad.addColorStop(0, 'rgba(18,181,203,0.18)'); areaGrad.addColorStop(1, 'rgba(18,181,203,0)')
      ctx.fillStyle = areaGrad; ctx.fill()
      // Line
      ctx.strokeStyle = PBI.green; ctx.lineWidth = 2.5; ctx.beginPath()
      entries.forEach(([, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.stroke()
      entries.forEach(([date, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        ctx.fillStyle = PBI.green; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill()
        if (entries.length <= 14 || i % 2 === 0) {
          ctx.fillStyle = '#A19F9D'; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(date.slice(5), x, h - 8)
        }
      })
    })
  }, [drawChart, dailyVisitorCounts])

  const drawClickChart = useCallback(() => {
    drawChart(clickCanvasRef.current, (ctx, w, h) => {
      const entries = Object.entries(clickCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)
      if (entries.length === 0) {
        ctx.fillStyle = '#605E5C'; ctx.font = '14px "Segoe UI", sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('No click data yet', w / 2, h / 2); return
      }
      const max = Math.max(...entries.map(e => e[1]))
      const rowH = Math.min(32, (h - 16) / entries.length - 6)
      const padLeft = Math.min(160, w * 0.22)
      entries.forEach(([label, count], i) => {
        const y = 12 + i * (rowH + 6)
        const barW = Math.max(4, ((w - padLeft - 60) * count) / max)
        ctx.fillStyle = PBI.orange
        ctx.beginPath(); ctx.roundRect(padLeft, y, barW, rowH, [0, 3, 3, 0]); ctx.fill()
        ctx.fillStyle = '#D2D0CE'; ctx.font = '11px "Segoe UI", sans-serif'
        ctx.textAlign = 'right'
        const truncated = label.length > 18 ? label.slice(0, 17) + '..' : label
        ctx.fillText(truncated, padLeft - 10, y + rowH / 2 + 4)
        ctx.textAlign = 'left'; ctx.fillStyle = '#E1DFDD'; ctx.font = 'bold 11px "Segoe UI", sans-serif'
        ctx.fillText(String(count), padLeft + barW + 8, y + rowH / 2 + 4)
      })
    })
  }, [drawChart, clickCounts])

  const drawHourChart = useCallback(() => {
    drawChart(hourCanvasRef.current, (ctx, w, h) => {
      const max = Math.max(...hourlyCounts, 1)
      const padBottom = 36, padTop = 20
      const barW = (w - 36) / 24 - 2
      hourlyCounts.forEach((count, i) => {
        const barH = (count / max) * (h - padTop - padBottom)
        const x = 18 + i * (barW + 2), y = h - barH - padBottom
        ctx.fillStyle = count > 0 ? PBI.green : 'rgba(255,255,255,0.03)'
        ctx.beginPath(); ctx.roundRect(x, y, barW, barH || 2, [2, 2, 0, 0]); ctx.fill()
        if (count > 0) {
          ctx.fillStyle = '#E1DFDD'; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(String(count), x + barW / 2, y - 5)
        }
        if (i % 3 === 0) {
          ctx.fillStyle = '#A19F9D'; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(`${String(i).padStart(2, '0')}`, x + barW / 2, h - 14)
        }
      })
    })
  }, [drawChart, hourlyCounts])

  const redraw = useCallback(() => {
    const timeout = setTimeout(() => {
      if (activeSection === 'overview') {
        drawBarChart(); drawLineChart(); drawClickChart(); drawHourChart()
      } else if (activeSection === 'pageviews') drawBarChart()
      else if (activeSection === 'clicks') drawClickChart()
      else if (activeSection === 'visitors') { drawLineChart(); drawVisitorChart() }
      else if (activeSection === 'hourly') drawHourChart()
    }, 60)
    return () => clearTimeout(timeout)
  }, [activeSection, drawBarChart, drawLineChart, drawClickChart, drawHourChart, drawVisitorChart])

  useEffect(() => { return redraw() }, [redraw])

  useEffect(() => {
    const handler = () => redraw()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [redraw])

  const clearData = () => {
    localStorage.removeItem('analytics-events')
    setEvents([])
  }

  const recentEvents = [...events].reverse().slice(0, 50)

  return (
    <>
    <SEO title="Analytics" description="Website analytics and visitor tracking" />
    <StarField />
    <div className="pbi-dashboard">
      {/* Sidebar */}
      <aside className={`pbi-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="pbi-sidebar-header">
          <Link to="/" className="pbi-sidebar-back">&larr;</Link>
          {!sidebarCollapsed && <span className="pbi-sidebar-title">Analytics</span>}
          <button
            className="pbi-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '\u276F' : '\u276E'}
          </button>
        </div>
        <nav className="pbi-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`pbi-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              title={item.label}
            >
              <span className="pbi-nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="pbi-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        {!sidebarCollapsed && (
          <div className="pbi-sidebar-footer">
            <button className="pbi-clear-btn" onClick={clearData}>Clear Data</button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="pbi-main">
        {/* Ribbon */}
        <div className="pbi-ribbon">
          <h1 className="pbi-ribbon-title">
            {NAV_ITEMS.find(n => n.id === activeSection)?.icon}{' '}
            {NAV_ITEMS.find(n => n.id === activeSection)?.label}
          </h1>
          <span className="pbi-ribbon-meta">Last updated: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="pbi-content">
          {/* ═══ OVERVIEW ═══ */}
          {activeSection === 'overview' && (
            <>
              <div className="pbi-kpi-row">
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.blue } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{totalViews.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Page Views</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.green } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{uniqueVisitors.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Unique Visitors</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.orange } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{totalClicks.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Total Clicks</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.red } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{sessions.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Sessions</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.purple } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{bounceRate}%</div>
                  <div className="pbi-kpi-label">Bounce Rate</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.teal } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{avgViewsPerSession}</div>
                  <div className="pbi-kpi-label">Views / Session</div>
                </div>
              </div>

              <div className="pbi-grid-2">
                <div className="pbi-visual">
                  <div className="pbi-visual-header">Page Views by Route</div>
                  <canvas ref={barCanvasRef} />
                </div>
                <div className="pbi-visual">
                  <div className="pbi-visual-header">Events Over Time</div>
                  <canvas ref={lineCanvasRef} />
                </div>
              </div>
              <div className="pbi-grid-2">
                <div className="pbi-visual">
                  <div className="pbi-visual-header">Top Clicked Elements</div>
                  <canvas ref={clickCanvasRef} />
                </div>
                <div className="pbi-visual">
                  <div className="pbi-visual-header">Hourly Activity</div>
                  <canvas ref={hourCanvasRef} />
                </div>
              </div>
            </>
          )}

          {/* ═══ PAGE VIEWS ═══ */}
          {activeSection === 'pageviews' && (
            <>
              <div className="pbi-kpi-row">
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.blue } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{totalViews.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Total Views</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.green } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{Object.keys(pageCounts).length}</div>
                  <div className="pbi-kpi-label">Unique Pages</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.orange } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{activeDays > 0 ? (totalViews / activeDays).toFixed(1) : '0'}</div>
                  <div className="pbi-kpi-label">Avg Views / Day</div>
                </div>
              </div>
              <div className="pbi-visual pbi-visual-full">
                <div className="pbi-visual-header">Page Views by Route</div>
                <canvas ref={barCanvasRef} className="pbi-canvas-tall" />
              </div>
              <div className="pbi-visual">
                <div className="pbi-visual-header">All Pages</div>
                <table className="pbi-table">
                  <thead><tr><th>Page</th><th>Views</th><th>Share</th><th>Distribution</th></tr></thead>
                  <tbody>
                    {Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).map(([page, count]) => (
                      <tr key={page}>
                        <td className="pbi-table-bold">{page || '/'}</td>
                        <td>{count}</td>
                        <td>{totalViews > 0 ? ((count / totalViews) * 100).toFixed(1) + '%' : '0%'}</td>
                        <td><div className="pbi-bar-cell"><div className="pbi-bar-fill" style={{ width: `${totalViews > 0 ? (count / totalViews) * 100 : 0}%`, background: PBI.blue }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ CLICKS ═══ */}
          {activeSection === 'clicks' && (
            <>
              <div className="pbi-kpi-row">
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.orange } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{totalClicks.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Total Clicks</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.blue } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{Object.keys(clickCounts).length}</div>
                  <div className="pbi-kpi-label">Unique Elements</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.green } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{activeDays > 0 ? (totalClicks / activeDays).toFixed(1) : '0'}</div>
                  <div className="pbi-kpi-label">Avg Clicks / Day</div>
                </div>
              </div>
              <div className="pbi-visual pbi-visual-full">
                <div className="pbi-visual-header">Top Clicked Elements</div>
                <canvas ref={clickCanvasRef} className="pbi-canvas-tall" />
              </div>
              <div className="pbi-visual">
                <div className="pbi-visual-header">Click Breakdown</div>
                <table className="pbi-table">
                  <thead><tr><th>Element</th><th>Clicks</th><th>Share</th><th>Distribution</th></tr></thead>
                  <tbody>
                    {Object.entries(clickCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
                      <tr key={label}>
                        <td className="pbi-table-bold">{label}</td>
                        <td>{count}</td>
                        <td>{totalClicks > 0 ? ((count / totalClicks) * 100).toFixed(1) + '%' : '0%'}</td>
                        <td><div className="pbi-bar-cell"><div className="pbi-bar-fill" style={{ width: `${totalClicks > 0 ? (count / totalClicks) * 100 : 0}%`, background: PBI.orange }} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ VISITORS ═══ */}
          {activeSection === 'visitors' && (
            <>
              <div className="pbi-kpi-row">
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.green } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{uniqueVisitors.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Unique Visitors</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.blue } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{activeDays}</div>
                  <div className="pbi-kpi-label">Active Days</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.orange } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{sessions.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Total Sessions</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.red } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{activeDays > 0 ? (events.length / activeDays).toFixed(0) : '0'}</div>
                  <div className="pbi-kpi-label">Avg Events / Day</div>
                </div>
              </div>
              <div className="pbi-visual pbi-visual-full">
                <div className="pbi-visual-header">Unique Visitors per Day</div>
                <canvas ref={visitorCanvasRef} className="pbi-canvas-tall" />
              </div>
              <div className="pbi-visual pbi-visual-full">
                <div className="pbi-visual-header">Events Over Time</div>
                <canvas ref={lineCanvasRef} className="pbi-canvas-tall" />
              </div>
              <div className="pbi-visual">
                <div className="pbi-visual-header">Daily Breakdown</div>
                <table className="pbi-table">
                  <thead><tr><th>Date</th><th>Events</th><th>Unique Visitors</th></tr></thead>
                  <tbody>
                    {Object.entries(dailyCounts).sort((a, b) => b[0].localeCompare(a[0])).map(([date, count]) => (
                      <tr key={date}>
                        <td className="pbi-table-bold">{date}</td>
                        <td>{count}</td>
                        <td>{dailyVisitorCounts[date] || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ HOURLY ═══ */}
          {activeSection === 'hourly' && (
            <>
              <div className="pbi-kpi-row">
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.green } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{hourlyCounts.indexOf(Math.max(...hourlyCounts))}:00</div>
                  <div className="pbi-kpi-label">Peak Hour</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.blue } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{Math.max(...hourlyCounts)}</div>
                  <div className="pbi-kpi-label">Peak Views</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.orange } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{Math.round(totalViews / 24)}</div>
                  <div className="pbi-kpi-label">Avg / Hour</div>
                </div>
              </div>
              <div className="pbi-visual pbi-visual-full">
                <div className="pbi-visual-header">Activity by Hour of Day</div>
                <canvas ref={hourCanvasRef} className="pbi-canvas-tall" />
              </div>
              <div className="pbi-visual">
                <div className="pbi-visual-header">Hourly Breakdown</div>
                <table className="pbi-table">
                  <thead><tr><th>Hour</th><th>Views</th><th>Distribution</th></tr></thead>
                  <tbody>
                    {hourlyCounts.map((count, i) => {
                      const mx = Math.max(...hourlyCounts, 1)
                      return (
                        <tr key={i}>
                          <td className="pbi-table-bold">{String(i).padStart(2, '0')}:00</td>
                          <td>{count}</td>
                          <td><div className="pbi-bar-cell"><div className="pbi-bar-fill" style={{ width: `${(count / mx) * 100}%`, background: PBI.green }} /></div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ EVENTS ═══ */}
          {activeSection === 'events' && (
            <>
              <div className="pbi-kpi-row">
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.blue } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{events.length.toLocaleString()}</div>
                  <div className="pbi-kpi-label">Total Events</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.purple } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{totalGames}</div>
                  <div className="pbi-kpi-label">Games Played</div>
                </div>
                <div className="pbi-kpi" style={{ '--kpi-accent': PBI.green } as React.CSSProperties}>
                  <div className="pbi-kpi-value">{Object.keys(pageCounts).length}</div>
                  <div className="pbi-kpi-label">Pages Visited</div>
                </div>
              </div>
              <div className="pbi-visual">
                <div className="pbi-visual-header">Recent Events</div>
                <table className="pbi-table">
                  <thead><tr><th>Timestamp</th><th>Type</th><th>Page</th><th>Detail</th></tr></thead>
                  <tbody>
                    {recentEvents.map((ev, i) => (
                      <tr key={i}>
                        <td className="pbi-table-mono">{new Date(ev.timestamp).toLocaleString()}</td>
                        <td><span className={`pbi-badge pbi-badge-${ev.type}`}>{ev.type}</span></td>
                        <td>{ev.page || '/'}</td>
                        <td>{ev.label || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
    </>
  )
}
