import { useRef, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../styles/Snake.css'

const ROWS = 20
const COLS = 20

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
interface Pos { r: number; c: number }

function randomFood(snake: Pos[]): Pos {
  let pos: Pos
  do {
    pos = { r: Math.floor(Math.random() * ROWS), c: Math.floor(Math.random() * COLS) }
  } while (snake.some(s => s.r === pos.r && s.c === pos.c))
  return pos
}

export default function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Pos[]>([{ r: 10, c: 10 }, { r: 10, c: 9 }, { r: 10, c: 8 }])
  const dirRef = useRef<Direction>('RIGHT')
  const nextDirRef = useRef<Direction>('RIGHT')
  const foodRef = useRef<Pos>({ r: 5, c: 5 })
  const scoreRef = useRef(0)
  const gameOverRef = useRef(false)
  const pausedRef = useRef(false)
  const speedRef = useRef(120)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const cellW = rect.width / COLS
    const cellH = rect.height / ROWS

    // Background
    ctx.fillStyle = '#0f0f23'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(rect.width, r * cellH); ctx.stroke()
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, rect.height); ctx.stroke()
    }

    // Food
    const food = foodRef.current
    ctx.fillStyle = '#e94560'
    ctx.shadowColor = '#e94560'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(food.c * cellW + cellW / 2, food.r * cellH + cellH / 2, cellW * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Snake
    const snake = snakeRef.current
    snake.forEach((seg, i) => {
      const ratio = 1 - i / snake.length
      const r = Math.round(233 * ratio + 83 * (1 - ratio))
      const g = Math.round(69 * ratio + 52 * (1 - ratio))
      const b = Math.round(96 * ratio + 131 * (1 - ratio))
      ctx.fillStyle = `rgb(${r},${g},${b})`
      const pad = i === 0 ? 1 : 2
      ctx.beginPath()
      ctx.roundRect(seg.c * cellW + pad, seg.r * cellH + pad, cellW - pad * 2, cellH - pad * 2, 4)
      ctx.fill()
    })

    // Eyes on head
    if (snake.length > 0) {
      const head = snake[0]
      const cx = head.c * cellW + cellW / 2
      const cy = head.r * cellH + cellH / 2
      ctx.fillStyle = '#fff'
      const dir = dirRef.current
      const ox = dir === 'LEFT' ? -3 : dir === 'RIGHT' ? 3 : 0
      const oy = dir === 'UP' ? -3 : dir === 'DOWN' ? 3 : 0
      ctx.beginPath(); ctx.arc(cx - 3 + ox * 0.3, cy - 2 + oy * 0.3, 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 3 + ox * 0.3, cy - 2 + oy * 0.3, 2, 0, Math.PI * 2); ctx.fill()
    }
  }, [])

  const tick = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return

    dirRef.current = nextDirRef.current
    const snake = snakeRef.current
    const head = snake[0]
    const dir = dirRef.current
    const newHead: Pos = {
      r: head.r + (dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0),
      c: head.c + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0),
    }

    // Wall collision
    if (newHead.r < 0 || newHead.r >= ROWS || newHead.c < 0 || newHead.c >= COLS) {
      gameOverRef.current = true
      setGameOver(true)
      render()
      return
    }

    // Self collision
    if (snake.some(s => s.r === newHead.r && s.c === newHead.c)) {
      gameOverRef.current = true
      setGameOver(true)
      render()
      return
    }

    const newSnake = [newHead, ...snake]

    // Eat food
    if (newHead.r === foodRef.current.r && newHead.c === foodRef.current.c) {
      scoreRef.current += 10
      setScore(scoreRef.current)
      foodRef.current = randomFood(newSnake)
      // Speed up
      speedRef.current = Math.max(50, speedRef.current - 2)
    } else {
      newSnake.pop()
    }

    snakeRef.current = newSnake
    render()
  }, [render])

  const newGame = useCallback(() => {
    snakeRef.current = [{ r: 10, c: 10 }, { r: 10, c: 9 }, { r: 10, c: 8 }]
    dirRef.current = 'RIGHT'
    nextDirRef.current = 'RIGHT'
    foodRef.current = randomFood(snakeRef.current)
    scoreRef.current = 0
    gameOverRef.current = false
    pausedRef.current = false
    speedRef.current = 120
    setScore(0)
    setGameOver(false)
    setPaused(false)
    render()
  }, [render])

  useEffect(() => {
    render()
    let timeoutId: ReturnType<typeof setTimeout>

    function loop() {
      tick()
      timeoutId = setTimeout(loop, speedRef.current)
    }
    timeoutId = setTimeout(loop, speedRef.current)

    const onKey = (e: KeyboardEvent) => {
      const dir = dirRef.current
      if (e.key === 'ArrowUp' && dir !== 'DOWN') nextDirRef.current = 'UP'
      else if (e.key === 'ArrowDown' && dir !== 'UP') nextDirRef.current = 'DOWN'
      else if (e.key === 'ArrowLeft' && dir !== 'RIGHT') nextDirRef.current = 'LEFT'
      else if (e.key === 'ArrowRight' && dir !== 'LEFT') nextDirRef.current = 'RIGHT'
      else if (e.key === ' ') {
        pausedRef.current = !pausedRef.current
        setPaused(pausedRef.current)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y
      touchStartRef.current = null
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
      const dir = dirRef.current
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && dir !== 'LEFT') nextDirRef.current = 'RIGHT'
        else if (dx < 0 && dir !== 'RIGHT') nextDirRef.current = 'LEFT'
      } else {
        if (dy > 0 && dir !== 'UP') nextDirRef.current = 'DOWN'
        else if (dy < 0 && dir !== 'DOWN') nextDirRef.current = 'UP'
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('resize', render)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('resize', render)
    }
  }, [render, tick])

  return (
    <div className="snake-page">
      <SEO title="Snake" description="Play Snake in the browser" />
      <div className="snake-top-bar">
        <Link to="/games" className="snake-back-link">Games</Link>
        <h1>Snake</h1>
      </div>

      <div className="snake-score">Score: {score}</div>

      {paused && <div className="snake-overlay">PAUSED</div>}
      {gameOver && (
        <div className="snake-overlay">
          <div>Game Over</div>
          <div className="snake-final-score">Score: {score}</div>
        </div>
      )}

      <div className="snake-board-container">
        <canvas ref={canvasRef} />
      </div>

      <div className="snake-controls">
        <button className="snake-btn" onClick={newGame}>New Game</button>
        <button className="snake-btn secondary" onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current) }}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div className="snake-dpad">
        <button className="dpad-btn up" onClick={() => { if (dirRef.current !== 'DOWN') nextDirRef.current = 'UP' }}>&uarr;</button>
        <div className="dpad-row">
          <button className="dpad-btn" onClick={() => { if (dirRef.current !== 'RIGHT') nextDirRef.current = 'LEFT' }}>&larr;</button>
          <button className="dpad-btn" onClick={() => { if (dirRef.current !== 'LEFT') nextDirRef.current = 'RIGHT' }}>&rarr;</button>
        </div>
        <button className="dpad-btn down" onClick={() => { if (dirRef.current !== 'UP') nextDirRef.current = 'DOWN' }}>&darr;</button>
      </div>

      <div className="snake-footer">Swipe or arrow keys to move &middot; Space to pause</div>
    </div>
  )
}
