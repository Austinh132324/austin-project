import { useEffect, useRef } from 'react'

interface StarFieldProps {
  shootingStars?: boolean
  nebulaOrbs?: boolean
  geoShapes?: boolean
  density?: number
}

export default function StarField({
  shootingStars = false,
  nebulaOrbs = false,
  geoShapes = false,
  density = 6000,
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const geoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let stars: { x: number; y: number; r: number; baseAlpha: number; alpha: number; phase: number; color: string; depth: number }[] = []
    const shootingStarList: { x: number; y: number; len: number; speed: number; angle: number; alpha: number; decay: number }[] = []
    let orbList: { x: number; y: number; r: number; dx: number; dy: number; hue: string; alpha: number }[] = []
    const mouse = { x: -1000, y: -1000 }
    // Smoothed parallax offset (normalized -1 to 1 from center)
    const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 }
    let t = 0

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      initStars()
      if (nebulaOrbs) initOrbs()
    }

    function initStars() {
      stars = []
      const count = Math.floor(canvas!.width * canvas!.height / density)
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          r: Math.random() * 2 + 0.3,
          baseAlpha: Math.random() * 0.6 + 0.2,
          alpha: 0,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.85 ? (Math.random() > 0.5 ? '#e94560' : '#a478e8') : '#e0e0e8',
          depth: 0.3 + Math.random() * 0.7, // 0.3 = far (slow), 1.0 = near (fast)
        })
      }
    }

    function initOrbs() {
      orbList = []
      for (let i = 0; i < 5; i++) {
        orbList.push({
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          r: 80 + Math.random() * 200,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          hue: Math.random() > 0.5 ? '233,69,96' : '83,52,131',
          alpha: 0.03 + Math.random() * 0.03,
        })
      }
    }

    function spawnShootingStar() {
      shootingStarList.push({
        x: Math.random() * canvas!.width * 0.6,
        y: Math.random() * canvas!.height * 0.3,
        len: 100 + Math.random() * 150,
        speed: 10 + Math.random() * 10,
        angle: Math.PI / 5 + Math.random() * 0.4,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.01,
      })
    }

    // Max parallax shift in pixels for the nearest stars
    const PARALLAX_STRENGTH = 30

    function draw() {
      const c = ctx!
      const w = canvas!.width
      const h = canvas!.height
      c.clearRect(0, 0, w, h)
      t += 0.016

      // Smooth parallax interpolation
      parallax.x += (parallax.targetX - parallax.x) * 0.05
      parallax.y += (parallax.targetY - parallax.y) * 0.05

      if (nebulaOrbs) {
        for (const orb of orbList) {
          orb.x += orb.dx; orb.y += orb.dy
          if (orb.x < -orb.r) orb.x = w + orb.r
          if (orb.x > w + orb.r) orb.x = -orb.r
          if (orb.y < -orb.r) orb.y = h + orb.r
          if (orb.y > h + orb.r) orb.y = -orb.r
          // Orbs shift slightly with parallax (at depth 0.2)
          const ox = orb.x + parallax.x * PARALLAX_STRENGTH * 0.2
          const oy = orb.y + parallax.y * PARALLAX_STRENGTH * 0.2
          const g = c.createRadialGradient(ox, oy, 0, ox, oy, orb.r)
          g.addColorStop(0, `rgba(${orb.hue},${orb.alpha})`)
          g.addColorStop(1, `rgba(${orb.hue},0)`)
          c.fillStyle = g
          c.fillRect(ox - orb.r, oy - orb.r, orb.r * 2, orb.r * 2)
        }
      }

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        // Apply parallax offset based on star depth
        const sx = s.x + parallax.x * PARALLAX_STRENGTH * s.depth
        const sy = s.y + parallax.y * PARALLAX_STRENGTH * s.depth

        s.alpha = s.baseAlpha + Math.sin(t * 2 + s.phase) * 0.2
        const dx = sx - mouse.x, dy = sy - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 180) {
          const strength = 1 - dist / 180
          s.alpha = Math.min(1, s.alpha + strength * 0.7)
          c.beginPath()
          c.strokeStyle = `rgba(233,69,96,${0.12 * strength})`
          c.moveTo(sx, sy); c.lineTo(mouse.x, mouse.y); c.stroke()
        }
        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j]
          const s2x = s2.x + parallax.x * PARALLAX_STRENGTH * s2.depth
          const s2y = s2.y + parallax.y * PARALLAX_STRENGTH * s2.depth
          const d = Math.abs(sx - s2x) + Math.abs(sy - s2y)
          if (d < 80) {
            c.beginPath()
            c.strokeStyle = `rgba(83,52,131,${0.06 * (1 - d / 80)})`
            c.moveTo(sx, sy); c.lineTo(s2x, s2y); c.stroke()
          }
        }
        if (s.r > 1.5) {
          c.beginPath(); c.arc(sx, sy, s.r * 3, 0, Math.PI * 2)
          c.fillStyle = `rgba(233,69,96,${s.alpha * 0.06})`; c.fill()
        }
        c.beginPath(); c.arc(sx, sy, s.r, 0, Math.PI * 2)
        if (s.color === '#e94560') c.fillStyle = `rgba(233,69,96,${s.alpha})`
        else if (s.color === '#a478e8') c.fillStyle = `rgba(164,120,232,${s.alpha})`
        else c.fillStyle = `rgba(224,224,232,${s.alpha})`
        c.fill()
      }

      if (shootingStars) {
        for (let k = shootingStarList.length - 1; k >= 0; k--) {
          const ss = shootingStarList[k]
          ss.x += Math.cos(ss.angle) * ss.speed
          ss.y += Math.sin(ss.angle) * ss.speed
          ss.alpha -= ss.decay
          if (ss.alpha <= 0) { shootingStarList.splice(k, 1); continue }
          const tailX = ss.x - Math.cos(ss.angle) * ss.len
          const tailY = ss.y - Math.sin(ss.angle) * ss.len
          const grad = c.createLinearGradient(tailX, tailY, ss.x, ss.y)
          grad.addColorStop(0, 'rgba(233,69,96,0)')
          grad.addColorStop(0.6, `rgba(233,69,96,${ss.alpha * 0.5})`)
          grad.addColorStop(1, `rgba(255,255,255,${ss.alpha})`)
          c.beginPath(); c.moveTo(tailX, tailY); c.lineTo(ss.x, ss.y)
          c.strokeStyle = grad; c.lineWidth = 2; c.stroke(); c.lineWidth = 1
          c.beginPath(); c.arc(ss.x, ss.y, 2.5, 0, Math.PI * 2)
          c.fillStyle = `rgba(255,255,255,${ss.alpha})`; c.fill()
          c.beginPath(); c.arc(ss.x, ss.y, 8, 0, Math.PI * 2)
          c.fillStyle = `rgba(233,69,96,${ss.alpha * 0.15})`; c.fill()
        }
      }

      animId = requestAnimationFrame(draw)
    }

    resize(); draw()

    let shootingInterval: ReturnType<typeof setInterval> | undefined
    if (shootingStars) {
      shootingInterval = setInterval(spawnShootingStar, 2000)
      setTimeout(spawnShootingStar, 500)
      setTimeout(spawnShootingStar, 1200)
    }

    const onResize = () => resize()
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      // Update parallax target: normalized -1 to 1 from screen center
      parallax.targetX = (e.clientX / window.innerWidth - 0.5) * 2
      parallax.targetY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      mouse.x = touch.clientX
      mouse.y = touch.clientY
      parallax.targetX = (touch.clientX / window.innerWidth - 0.5) * 2
      parallax.targetY = (touch.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove)

    return () => {
      cancelAnimationFrame(animId)
      if (shootingInterval) clearInterval(shootingInterval)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [shootingStars, nebulaOrbs, density])

  useEffect(() => {
    if (!geoShapes || !geoRef.current) return
    const container = geoRef.current

    function spawnGeo() {
      const el = document.createElement('div')
      el.className = 'geo'
      const size = 10 + Math.random() * 30
      const x = Math.random() * 100
      const duration = 15 + Math.random() * 25
      const color = Math.random() > 0.5 ? 'rgba(233,69,96,0.15)' : 'rgba(83,52,131,0.15)'
      el.style.cssText = `left:${x}%;width:${size}px;height:${size}px;border-color:${color};animation-duration:${duration}s;`
      if (Math.random() > 0.6) el.style.borderRadius = '50%'
      if (Math.random() > 0.7) el.style.transform = 'rotate(45deg)'
      container.appendChild(el)
      setTimeout(() => el.remove(), duration * 1000)
    }

    const interval = setInterval(spawnGeo, 1200)
    const timeouts: ReturnType<typeof setTimeout>[] = []
    for (let g = 0; g < 8; g++) timeouts.push(setTimeout(spawnGeo, g * 400))

    return () => {
      clearInterval(interval)
      timeouts.forEach(clearTimeout)
      while (container.firstChild) container.removeChild(container.firstChild)
    }
  }, [geoShapes])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
      />
      {geoShapes && (
        <div
          ref={geoRef}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
        />
      )}
    </>
  )
}
