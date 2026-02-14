import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import StarField from '../components/StarField'
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

  const pageCounts = getPageCounts(events)
  const dailyCounts = getDailyCounts(events)
  const clickCounts = getClickCounts(events)
  const totalViews = events.filter(e => e.type === 'pageview').length
  const totalClicks = events.filter(e => e.type === 'click').length
  const totalGames = events.filter(e => e.type === 'game').length
  const uniqueVisitors = getUniqueVisitors(events)
  const hourlyCounts = getHourlyCounts(events)

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
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    ctx.fillRect(0, 0, rect.width, rect.height)
    painter(ctx, rect.width, rect.height)
  }, [])

  const drawBarChart = useCallback(() => {
    drawChart(barCanvasRef.current, (ctx, w, h) => {
      const entries = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)
      if (entries.length === 0) {
        ctx.fillStyle = '#606080'; ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('No data yet', w / 2, h / 2); return
      }
      const max = Math.max(...entries.map(e => e[1]))
      const barW = Math.min(80, (w - 60) / entries.length - 12)
      const gap = (w - entries.length * barW) / (entries.length + 1)
      entries.forEach(([page, count], i) => {
        const barH = (count / max) * (h - 80)
        const x = gap + i * (barW + gap), y = h - barH - 50
        const grad = ctx.createLinearGradient(x, y, x, h - 50)
        grad.addColorStop(0, '#e94560'); grad.addColorStop(1, '#533483')
        ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(x, y, barW, barH, 4); ctx.fill()
        ctx.fillStyle = '#a0a0b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(page.replace('/', '') || 'home', x + barW / 2, h - 28)
        ctx.fillStyle = '#e0e0e8'; ctx.font = '12px sans-serif'
        ctx.fillText(String(count), x + barW / 2, y - 8)
      })
    })
  }, [drawChart, pageCounts])

  const drawLineChart = useCallback(() => {
    drawChart(lineCanvasRef.current, (ctx, w, h) => {
      const entries = Object.entries(dailyCounts).sort((a, b) => a[0].localeCompare(b[0])).slice(-21)
      if (entries.length === 0) {
        ctx.fillStyle = '#606080'; ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('No data yet', w / 2, h / 2); return
      }
      const max = Math.max(...entries.map(e => e[1]), 1)
      const padX = 50, padY = 40, plotW = w - padX * 2, plotH = h - padY * 2
      // Grid lines
      for (let g = 0; g <= 4; g++) {
        const gy = padY + (plotH / 4) * g
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath()
        ctx.moveTo(padX, gy); ctx.lineTo(w - padX, gy); ctx.stroke()
        ctx.fillStyle = '#606080'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(String(Math.round(max * (1 - g / 4))), padX - 8, gy + 4)
      }
      // Area fill
      ctx.beginPath()
      entries.forEach(([, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      const lastX = padX + plotW
      ctx.lineTo(lastX, padY + plotH); ctx.lineTo(padX, padY + plotH); ctx.closePath()
      const areaGrad = ctx.createLinearGradient(0, padY, 0, padY + plotH)
      areaGrad.addColorStop(0, 'rgba(233,69,96,0.15)'); areaGrad.addColorStop(1, 'rgba(233,69,96,0)')
      ctx.fillStyle = areaGrad; ctx.fill()
      // Line
      ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2.5; ctx.beginPath()
      entries.forEach(([, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      })
      ctx.stroke()
      // Dots + labels
      entries.forEach(([date, count], i) => {
        const x = padX + (i / (entries.length - 1 || 1)) * plotW
        const y = padY + plotH - (count / max) * plotH
        ctx.fillStyle = '#e94560'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
        if (entries.length <= 14 || i % 2 === 0) {
          ctx.fillStyle = '#a0a0b8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(date.slice(5), x, h - 12)
        }
      })
    })
  }, [drawChart, dailyCounts])

  const drawClickChart = useCallback(() => {
    drawChart(clickCanvasRef.current, (ctx, w, h) => {
      const entries = Object.entries(clickCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)
      if (entries.length === 0) {
        ctx.fillStyle = '#606080'; ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'; ctx.fillText('No click data yet', w / 2, h / 2); return
      }
      const max = Math.max(...entries.map(e => e[1]))
      const rowH = Math.min(36, (h - 20) / entries.length - 6)
      const padLeft = Math.min(180, w * 0.25)
      entries.forEach(([label, count], i) => {
        const y = 16 + i * (rowH + 8)
        const barW = ((w - padLeft - 60) * count) / max
        const grad = ctx.createLinearGradient(padLeft, y, padLeft + barW, y)
        grad.addColorStop(0, '#00e5ff'); grad.addColorStop(1, '#a478e8')
        ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(padLeft, y, barW, rowH, 4); ctx.fill()
        ctx.fillStyle = '#c0c0d0'; ctx.font = '12px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(label.length > 20 ? label.slice(0, 20) + '...' : label, padLeft - 12, y + rowH / 2 + 4)
        ctx.textAlign = 'left'; ctx.fillStyle = '#e0e0e8'; ctx.font = '12px sans-serif'
        ctx.fillText(String(count), padLeft + barW + 8, y + rowH / 2 + 4)
      })
    })
  }, [drawChart, clickCounts])

  const drawHourChart = useCallback(() => {
    drawChart(hourCanvasRef.current, (ctx, w, h) => {
      const max = Math.max(...hourlyCounts, 1)
      const barW = (w - 40) / 24 - 3
      const padBottom = 36
      hourlyCounts.forEach((count, i) => {
        const barH = (count / max) * (h - 60 - padBottom)
        const x = 20 + i * (barW + 3), y = h - barH - padBottom
        const grad = ctx.createLinearGradient(x, y, x, h - padBottom)
        grad.addColorStop(0, '#4ade80'); grad.addColorStop(1, '#22c55e')
        ctx.fillStyle = count > 0 ? grad : 'rgba(255,255,255,0.04)'
        ctx.beginPath(); ctx.roundRect(x, y, barW, barH || 2, 3); ctx.fill()
        if (count > 0) {
          ctx.fillStyle = '#e0e0e8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(String(count), x + barW / 2, y - 6)
        }
        if (i % 2 === 0) {
          ctx.fillStyle = '#606080'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(`${i}:00`, x + barW / 2, h - 12)
        }
      })
    })
  }, [drawChart, hourlyCounts])

  useEffect(() => {
    // Small delay so canvas has correct dimensions after layout
    const timeout = setTimeout(() => {
      if (activeSection === 'overview') {
        drawBarChart(); drawLineChart(); drawClickChart(); drawHourChart()
      } else if (activeSection === 'pageviews') drawBarChart()
      else if (activeSection === 'clicks') drawClickChart()
      else if (activeSection === 'visitors') drawLineChart()
      else if (activeSection === 'hourly') drawHourChart()
    }, 50)
    return () => clearTimeout(timeout)
  }, [activeSection, drawBarChart, drawLineChart, drawClickChart, drawHourChart])

  // Redraw on resize
  useEffect(() => {
    const handler = () => {
      if (activeSection === 'overview') {
        drawBarChart(); drawLineChart(); drawClickChart(); drawHourChart()
      } else if (activeSection === 'pageviews') drawBarChart()
      else if (activeSection === 'clicks') drawClickChart()
      else if (activeSection === 'visitors') drawLineChart()
      else if (activeSection === 'hourly') drawHourChart()
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [activeSection, drawBarChart, drawLineChart, drawClickChart, drawHourChart])

  const clearData = () => {
    localStorage.removeItem('analytics-events')
    setEvents([])
  }

  const recentEvents = [...events].reverse().slice(0, 50)

  return (
    <>
    <SEO title="Analytics" description="Website analytics and visitor tracking" />
    <StarField shootingStars />
    <div className="analytics-dashboard">
      {/* Sidebar */}
      <aside className={`analytics-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="analytics-sidebar-header">
          <Link to="/" className="analytics-sidebar-back">&larr;</Link>
          {!sidebarCollapsed && <span className="analytics-sidebar-title">Analytics</span>}
          <button
            className="analytics-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '\u276F' : '\u276E'}
          </button>
        </div>

        <nav className="analytics-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`analytics-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              title={item.label}
            >
              <span className="analytics-nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="analytics-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="analytics-sidebar-footer">
            <button className="analytics-clear" onClick={clearData}>Clear Data</button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="analytics-main">
        {activeSection === 'overview' && (
          <div className="analytics-view">
            <h2 className="analytics-view-title">Overview</h2>
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
            <div className="analytics-overview-grid">
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
          </div>
        )}

        {activeSection === 'pageviews' && (
          <div className="analytics-view">
            <h2 className="analytics-view-title">Page Views</h2>
            <div className="analytics-stats analytics-stats-row">
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{totalViews}</div>
                <div className="analytics-stat-label">Total Views</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{Object.keys(pageCounts).length}</div>
                <div className="analytics-stat-label">Unique Pages</div>
              </div>
            </div>
            <div className="analytics-chart-card analytics-chart-full">
              <h3>Page Views by Route</h3>
              <canvas ref={barCanvasRef} />
            </div>
            <div className="analytics-table-card">
              <h3>All Pages</h3>
              <table className="analytics-table">
                <thead><tr><th>Page</th><th>Views</th><th>Share</th></tr></thead>
                <tbody>
                  {Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).map(([page, count]) => (
                    <tr key={page}>
                      <td>{page || '/'}</td>
                      <td>{count}</td>
                      <td>{totalViews > 0 ? ((count / totalViews) * 100).toFixed(1) + '%' : '0%'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'clicks' && (
          <div className="analytics-view">
            <h2 className="analytics-view-title">Click Tracking</h2>
            <div className="analytics-stats analytics-stats-row">
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{totalClicks}</div>
                <div className="analytics-stat-label">Total Clicks</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{Object.keys(clickCounts).length}</div>
                <div className="analytics-stat-label">Unique Elements</div>
              </div>
            </div>
            <div className="analytics-chart-card analytics-chart-full">
              <h3>Top Clicked Elements</h3>
              <canvas ref={clickCanvasRef} />
            </div>
            <div className="analytics-table-card">
              <h3>All Clicks</h3>
              <table className="analytics-table">
                <thead><tr><th>Element</th><th>Clicks</th><th>Share</th></tr></thead>
                <tbody>
                  {Object.entries(clickCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{count}</td>
                      <td>{totalClicks > 0 ? ((count / totalClicks) * 100).toFixed(1) + '%' : '0%'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'visitors' && (
          <div className="analytics-view">
            <h2 className="analytics-view-title">Visitor Trends</h2>
            <div className="analytics-stats analytics-stats-row">
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{uniqueVisitors}</div>
                <div className="analytics-stat-label">Active Days</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{Object.keys(dailyCounts).length > 0 ? Math.round(events.length / Object.keys(dailyCounts).length) : 0}</div>
                <div className="analytics-stat-label">Avg Events/Day</div>
              </div>
            </div>
            <div className="analytics-chart-card analytics-chart-full">
              <h3>Visitors Over Time</h3>
              <canvas ref={lineCanvasRef} />
            </div>
            <div className="analytics-table-card">
              <h3>Daily Breakdown</h3>
              <table className="analytics-table">
                <thead><tr><th>Date</th><th>Events</th></tr></thead>
                <tbody>
                  {Object.entries(dailyCounts).sort((a, b) => b[0].localeCompare(a[0])).map(([date, count]) => (
                    <tr key={date}>
                      <td>{date}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'hourly' && (
          <div className="analytics-view">
            <h2 className="analytics-view-title">Hourly Activity</h2>
            <div className="analytics-stats analytics-stats-row">
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{hourlyCounts.indexOf(Math.max(...hourlyCounts))}:00</div>
                <div className="analytics-stat-label">Peak Hour</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{Math.max(...hourlyCounts)}</div>
                <div className="analytics-stat-label">Peak Views</div>
              </div>
            </div>
            <div className="analytics-chart-card analytics-chart-full">
              <h3>Activity by Hour of Day</h3>
              <canvas ref={hourCanvasRef} />
            </div>
            <div className="analytics-table-card">
              <h3>Hourly Breakdown</h3>
              <table className="analytics-table">
                <thead><tr><th>Hour</th><th>Views</th><th>Bar</th></tr></thead>
                <tbody>
                  {hourlyCounts.map((count, i) => {
                    const max = Math.max(...hourlyCounts, 1)
                    return (
                      <tr key={i}>
                        <td>{String(i).padStart(2, '0')}:00</td>
                        <td>{count}</td>
                        <td>
                          <div className="analytics-table-bar-wrap">
                            <div className="analytics-table-bar" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'events' && (
          <div className="analytics-view">
            <h2 className="analytics-view-title">Event Log</h2>
            <div className="analytics-stats analytics-stats-row">
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{events.length}</div>
                <div className="analytics-stat-label">Total Events</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-val">{totalGames}</div>
                <div className="analytics-stat-label">Games Played</div>
              </div>
            </div>
            <div className="analytics-table-card">
              <h3>Recent Events (last 50)</h3>
              <table className="analytics-table">
                <thead><tr><th>Time</th><th>Type</th><th>Page</th><th>Detail</th></tr></thead>
                <tbody>
                  {recentEvents.map((ev, i) => (
                    <tr key={i}>
                      <td className="analytics-table-mono">{new Date(ev.timestamp).toLocaleString()}</td>
                      <td><span className={`analytics-event-badge analytics-event-${ev.type}`}>{ev.type}</span></td>
                      <td>{ev.page || '/'}</td>
                      <td>{ev.label || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  )
}
