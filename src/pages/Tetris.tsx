import { useRef, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../styles/Tetris.css'

const ROWS = 20
const COLS = 10

const PIECES = [
  { shape: [[1,1,1,1]], color: '#00e5ff' },           // I
  { shape: [[1,1],[1,1]], color: '#ffd600' },          // O
  { shape: [[0,1,0],[1,1,1]], color: '#a478e8' },      // T
  { shape: [[1,0],[1,0],[1,1]], color: '#ff9100' },     // L
  { shape: [[0,1],[0,1],[1,1]], color: '#448aff' },     // J
  { shape: [[0,1,1],[1,1,0]], color: '#4ade80' },       // S
  { shape: [[1,1,0],[0,1,1]], color: '#e94560' },       // Z
]

type Board = (string | null)[][]

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length, cols = shape[0].length
  const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c]
    }
  }
  return result
}

function collides(board: Board, shape: number[][], row: number, col: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const nr = row + r, nc = col + c
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc]) {
          return true
        }
      }
    }
  }
  return false
}

function place(board: Board, shape: number[][], row: number, col: number, color: string): Board {
  const b = board.map(r => [...r])
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) { b[row + r][col + c] = color }
    }
  }
  return b
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter(row => row.some(cell => !cell))
  const cleared = ROWS - kept.length
  const empty: Board = Array.from({ length: cleared }, () => Array(COLS).fill(null))
  return { board: [...empty, ...kept], cleared }
}

function ghostRow(board: Board, shape: number[][], row: number, col: number): number {
  let gr = row
  while (!collides(board, shape, gr + 1, col)) gr++
  return gr
}

function randomPiece() {
  return PIECES[Math.floor(Math.random() * PIECES.length)]
}

const POINTS = [0, 100, 300, 500, 800]

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<Board>(createBoard())
  const initialPiece = randomPiece()
  const initialNext = randomPiece()
  const pieceRef = useRef(initialPiece)
  const nextRef = useRef(initialNext)
  const posRef = useRef({ r: 0, c: 3 })
  const shapeRef = useRef(initialPiece.shape)
  const gameOverRef = useRef(false)
  const pausedRef = useRef(false)
  const scoreRef = useRef(0)
  const levelRef = useRef(1)
  const linesRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [nextPiece, setNextPiece] = useState(initialNext)

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
    ctx.fillStyle = '#0a0a1f'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(rect.width, r * cellH); ctx.stroke()
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, rect.height); ctx.stroke()
    }

    // Placed pieces
    const board = boardRef.current
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          ctx.fillStyle = board[r][c]!
          ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2)
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'
          ctx.strokeRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2)
        }
      }
    }

    // Ghost piece
    if (!gameOverRef.current) {
      const gr = ghostRow(board, shapeRef.current, posRef.current.r, posRef.current.c)
      const shape = shapeRef.current
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)'
            ctx.fillRect((posRef.current.c + c) * cellW + 1, (gr + r) * cellH + 1, cellW - 2, cellH - 2)
          }
        }
      }

      // Current piece
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            ctx.fillStyle = pieceRef.current.color
            ctx.fillRect((posRef.current.c + c) * cellW + 1, (posRef.current.r + r) * cellH + 1, cellW - 2, cellH - 2)
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'
            ctx.strokeRect((posRef.current.c + c) * cellW + 1, (posRef.current.r + r) * cellH + 1, cellW - 2, cellH - 2)
          }
        }
      }
    }
  }, [])

  const spawnPiece = useCallback(() => {
    pieceRef.current = nextRef.current
    nextRef.current = randomPiece()
    setNextPiece(nextRef.current)
    shapeRef.current = pieceRef.current.shape
    posRef.current = { r: 0, c: Math.floor((COLS - shapeRef.current[0].length) / 2) }

    if (collides(boardRef.current, shapeRef.current, posRef.current.r, posRef.current.c)) {
      gameOverRef.current = true
      setGameOver(true)
    }
  }, [])

  const lockPiece = useCallback(() => {
    boardRef.current = place(boardRef.current, shapeRef.current, posRef.current.r, posRef.current.c, pieceRef.current.color)
    const { board, cleared } = clearLines(boardRef.current)
    boardRef.current = board
    if (cleared > 0) {
      linesRef.current += cleared
      scoreRef.current += POINTS[cleared] * levelRef.current
      levelRef.current = Math.floor(linesRef.current / 10) + 1
      setScore(scoreRef.current)
      setLevel(levelRef.current)
      setLines(linesRef.current)
    }
    spawnPiece()
  }, [spawnPiece])

  const drop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return
    if (!collides(boardRef.current, shapeRef.current, posRef.current.r + 1, posRef.current.c)) {
      posRef.current = { ...posRef.current, r: posRef.current.r + 1 }
    } else {
      lockPiece()
    }
    render()
  }, [lockPiece, render])

  const moveLeft = useCallback(() => {
    if (!collides(boardRef.current, shapeRef.current, posRef.current.r, posRef.current.c - 1)) {
      posRef.current = { ...posRef.current, c: posRef.current.c - 1 }
      render()
    }
  }, [render])

  const moveRight = useCallback(() => {
    if (!collides(boardRef.current, shapeRef.current, posRef.current.r, posRef.current.c + 1)) {
      posRef.current = { ...posRef.current, c: posRef.current.c + 1 }
      render()
    }
  }, [render])

  const rotatePiece = useCallback(() => {
    const rotated = rotate(shapeRef.current)
    // Wall kick offsets
    for (const offset of [0, -1, 1, -2, 2]) {
      if (!collides(boardRef.current, rotated, posRef.current.r, posRef.current.c + offset)) {
        shapeRef.current = rotated
        posRef.current = { ...posRef.current, c: posRef.current.c + offset }
        render()
        return
      }
    }
  }, [render])

  const hardDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return
    const gr = ghostRow(boardRef.current, shapeRef.current, posRef.current.r, posRef.current.c)
    scoreRef.current += (gr - posRef.current.r) * 2
    setScore(scoreRef.current)
    posRef.current = { ...posRef.current, r: gr }
    lockPiece()
    render()
  }, [lockPiece, render])

  const newGame = useCallback(() => {
    boardRef.current = createBoard()
    scoreRef.current = 0; levelRef.current = 1; linesRef.current = 0
    gameOverRef.current = false; pausedRef.current = false
    pieceRef.current = randomPiece()
    nextRef.current = randomPiece()
    setNextPiece(nextRef.current)
    shapeRef.current = pieceRef.current.shape
    posRef.current = { r: 0, c: Math.floor((COLS - shapeRef.current[0].length) / 2) }
    setScore(0); setLevel(1); setLines(0); setGameOver(false); setPaused(false)
    render()
  }, [render])

  useEffect(() => {
    render()
    let timeoutId: ReturnType<typeof setTimeout>
    function loop() {
      drop()
      const speed = Math.max(80, 600 - (levelRef.current - 1) * 50)
      timeoutId = setTimeout(loop, speed)
    }
    timeoutId = setTimeout(loop, 600)

    const onKey = (e: KeyboardEvent) => {
      if (gameOverRef.current) return
      if (e.key === ' ') { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); return }
      if (pausedRef.current) return
      if (e.key === 'ArrowLeft') moveLeft()
      else if (e.key === 'ArrowRight') moveRight()
      else if (e.key === 'ArrowUp') rotatePiece()
      else if (e.key === 'ArrowDown') drop()
      else if (e.key === 'z' || e.key === 'Z') hardDrop()
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || gameOverRef.current || pausedRef.current) return
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y
      touchStartRef.current = null
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15) { rotatePiece(); return }
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) moveRight(); else moveLeft()
      } else {
        if (dy > 30) hardDrop(); else drop()
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
  }, [render, drop, moveLeft, moveRight, rotatePiece, hardDrop])

  return (
    <div className="tetris-page">
      <SEO title="Tetris" description="Play Tetris in the browser" />
      <div className="tetris-top-bar">
        <Link to="/games" className="tetris-back-link">Games</Link>
        <h1>Tetris</h1>
      </div>

      <div className="tetris-stats">
        <div className="tetris-stat"><span className="tetris-stat-label">Score</span><span className="tetris-stat-val">{score}</span></div>
        <div className="tetris-stat"><span className="tetris-stat-label">Level</span><span className="tetris-stat-val">{level}</span></div>
        <div className="tetris-stat"><span className="tetris-stat-label">Lines</span><span className="tetris-stat-val">{lines}</span></div>
      </div>

      <div className="tetris-main">
        <div className="tetris-board-container">
          {(gameOver || paused) && (
            <div className="tetris-overlay">{gameOver ? 'Game Over' : 'Paused'}</div>
          )}
          <canvas ref={canvasRef} />
        </div>

        <div className="tetris-side">
          <div className="tetris-next-label">Next</div>
          <div className="tetris-next-preview">
            {nextPiece.shape.map((row, ri) => (
              <div key={ri} className="tetris-next-row">
                {row.map((cell, ci) => (
                  <div key={ci} className="tetris-next-cell" style={{ background: cell ? nextPiece.color : 'transparent' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tetris-controls">
        <button className="tetris-btn" onClick={newGame}>New Game</button>
        <button className="tetris-btn secondary" onClick={() => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current) }}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div className="tetris-footer">Arrow keys to move &middot; Up to rotate &middot; Z for hard drop</div>
    </div>
  )
}
