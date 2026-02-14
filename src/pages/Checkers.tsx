import { useRef, useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../styles/Checkers.css'

/* ── Constants ── */
const EMPTY = 0
const RED = 1
const BLACK = 2
const RED_KING = 3
const BLACK_KING = 4

const ROWS = 8
const COLS = 8
const AI_DEPTH = 5

/* ── Colors ── */
const LIGHT_SQ = '#1a1a2e'
const DARK_SQ = '#16213e'
const RED_COLOR = '#e94560'
const BLACK_COLOR = '#2c2c54'
const HIGHLIGHT_COLOR = 'rgba(233,69,96,0.35)'
const VALID_COLOR = 'rgba(83,52,131,0.55)'
const SELECTED_COLOR = 'rgba(233,69,96,0.5)'
const CROWN_COLOR = '#ffd700'

/* ── Types ── */
type Board = number[][]
interface Pos { r: number; c: number }
interface Move { from: Pos; to: Pos; jumped: Pos[] }

/* ── Board helpers ── */
function createBoard(): Board {
  const board: Board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY))
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((r + c) % 2 === 1) board[r][c] = BLACK
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((r + c) % 2 === 1) board[r][c] = RED
    }
  }
  return board
}

function cloneBoard(b: Board): Board {
  return b.map((row) => [...row])
}

function isRed(p: number) { return p === RED || p === RED_KING }
function isBlack(p: number) { return p === BLACK || p === BLACK_KING }
function isKing(p: number) { return p === RED_KING || p === BLACK_KING }
function sameColor(a: number, b: number) {
  return (isRed(a) && isRed(b)) || (isBlack(a) && isBlack(b))
}

function promoteIfNeeded(board: Board, r: number, c: number) {
  if (board[r][c] === RED && r === 0) board[r][c] = RED_KING
  if (board[r][c] === BLACK && r === ROWS - 1) board[r][c] = BLACK_KING
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS
}

/* ── Move generation ── */
function getDirs(piece: number): number[][] {
  if (piece === RED) return [[-1, -1], [-1, 1]]
  if (piece === BLACK) return [[1, -1], [1, 1]]
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
}

function getJumps(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  if (piece === EMPTY) return []
  const dirs = getDirs(piece)
  const jumps: Move[] = []
  for (const [dr, dc] of dirs) {
    const mr = r + dr
    const mc = c + dc
    const lr = r + 2 * dr
    const lc = c + 2 * dc
    if (
      inBounds(lr, lc) &&
      board[lr][lc] === EMPTY &&
      board[mr][mc] !== EMPTY &&
      !sameColor(piece, board[mr][mc])
    ) {
      jumps.push({ from: { r, c }, to: { r: lr, c: lc }, jumped: [{ r: mr, c: mc }] })
    }
  }
  return jumps
}

function getMultiJumps(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  if (piece === EMPTY) return []

  const results: Move[] = []

  function dfs(b: Board, pos: Pos, jumped: Pos[], currentPiece: number) {
    const dirs = getDirs(currentPiece)
    let extended = false
    for (const [dr, dc] of dirs) {
      const mr = pos.r + dr
      const mc = pos.c + dc
      const lr = pos.r + 2 * dr
      const lc = pos.c + 2 * dc
      if (
        inBounds(lr, lc) &&
        b[lr][lc] === EMPTY &&
        b[mr][mc] !== EMPTY &&
        !sameColor(currentPiece, b[mr][mc])
      ) {
        extended = true
        const nb = cloneBoard(b)
        nb[pos.r][pos.c] = EMPTY
        nb[mr][mc] = EMPTY
        nb[lr][lc] = currentPiece
        // Check promotion mid-chain
        let nextPiece = currentPiece
        if (currentPiece === RED && lr === 0) nextPiece = RED_KING
        if (currentPiece === BLACK && lr === ROWS - 1) nextPiece = BLACK_KING
        nb[lr][lc] = nextPiece
        dfs(nb, { r: lr, c: lc }, [...jumped, { r: mr, c: mc }], nextPiece)
      }
    }
    if (!extended && jumped.length > 0) {
      results.push({ from: { r, c }, to: pos, jumped: [...jumped] })
    }
  }

  dfs(board, { r, c }, [], piece)
  return results
}

function getSimpleMoves(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  if (piece === EMPTY) return []
  const dirs = getDirs(piece)
  const moves: Move[] = []
  for (const [dr, dc] of dirs) {
    const nr = r + dr
    const nc = c + dc
    if (inBounds(nr, nc) && board[nr][nc] === EMPTY) {
      moves.push({ from: { r, c }, to: { r: nr, c: nc }, jumped: [] })
    }
  }
  return moves
}

function allMoves(board: Board, isRedTurn: boolean): Move[] {
  const colorCheck = isRedTurn ? isRed : isBlack
  // Collect all jump moves first
  let jumps: Move[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (colorCheck(board[r][c])) {
        const mj = getMultiJumps(board, r, c)
        jumps = jumps.concat(mj)
      }
    }
  }
  // If any jumps exist, they are mandatory
  if (jumps.length > 0) return jumps

  let simple: Move[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (colorCheck(board[r][c])) {
        simple = simple.concat(getSimpleMoves(board, r, c))
      }
    }
  }
  return simple
}

function applyMove(board: Board, move: Move): Board {
  const b = cloneBoard(board)
  const piece = b[move.from.r][move.from.c]
  b[move.from.r][move.from.c] = EMPTY
  for (const j of move.jumped) {
    b[j.r][j.c] = EMPTY
  }
  b[move.to.r][move.to.c] = piece
  promoteIfNeeded(b, move.to.r, move.to.c)
  return b
}

/* ── AI: minimax with alpha-beta ── */
function evaluate(board: Board): number {
  let score = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c]
      if (p === EMPTY) continue

      const baseVal = isKing(p) ? 5 : 3
      const sign = isBlack(p) ? 1 : -1

      // Piece value
      score += sign * baseVal

      // Advancement bonus (for non-kings)
      if (p === BLACK) score += r * 0.1
      if (p === RED) score -= (ROWS - 1 - r) * 0.1

      // Center control
      const centerDist = Math.abs(c - 3.5) + Math.abs(r - 3.5)
      score += sign * (4 - centerDist) * 0.05

      // Back row bonus (protects kings formation)
      if (p === BLACK && r === 0) score += 0.3
      if (p === RED && r === ROWS - 1) score -= 0.3
    }
  }
  return score
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  const moves = allMoves(board, !maximizing) // black maximizes
  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      // The side to move has no moves => they lose
      return maximizing ? -1000 : 1000
    }
    return evaluate(board)
  }

  if (maximizing) {
    let maxEval = -Infinity
    for (const m of moves) {
      const nb = applyMove(board, m)
      const ev = minimax(nb, depth - 1, alpha, beta, false)
      maxEval = Math.max(maxEval, ev)
      alpha = Math.max(alpha, ev)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const m of moves) {
      const nb = applyMove(board, m)
      const ev = minimax(nb, depth - 1, alpha, beta, true)
      minEval = Math.min(minEval, ev)
      beta = Math.min(beta, ev)
      if (beta <= alpha) break
    }
    return minEval
  }
}

function aiBestMove(board: Board): Move | null {
  const moves = allMoves(board, false) // black's turn
  if (moves.length === 0) return null

  let bestMove = moves[0]
  let bestVal = -Infinity
  for (const m of moves) {
    const nb = applyMove(board, m)
    const val = minimax(nb, AI_DEPTH - 1, -Infinity, Infinity, false)
    if (val > bestVal) {
      bestVal = val
      bestMove = m
    }
  }
  return bestMove
}

/* ── Piece count ── */
function countPieces(board: Board) {
  let red = 0
  let black = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isRed(board[r][c])) red++
      if (isBlack(board[r][c])) black++
    }
  }
  return { red, black }
}

/* ── Drawing ── */
function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  cellSize: number,
  selectedPos: Pos | null,
  validTargets: Pos[],
) {
  const dpr = window.devicePixelRatio || 1

  // Draw squares
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? LIGHT_SQ : DARK_SQ
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
    }
  }

  // Highlight valid move targets
  for (const t of validTargets) {
    ctx.fillStyle = VALID_COLOR
    ctx.fillRect(t.c * cellSize, t.r * cellSize, cellSize, cellSize)
  }

  // Highlight selected piece
  if (selectedPos) {
    ctx.fillStyle = SELECTED_COLOR
    ctx.fillRect(
      selectedPos.c * cellSize,
      selectedPos.r * cellSize,
      cellSize,
      cellSize,
    )
  }

  // Draw pieces
  const radius = cellSize * 0.38
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c]
      if (piece === EMPTY) continue

      const cx = c * cellSize + cellSize / 2
      const cy = r * cellSize + cellSize / 2

      // Shadow
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 6 * dpr
      ctx.shadowOffsetY = 2 * dpr

      // Gradient fill
      const baseColor = isRed(piece) ? RED_COLOR : BLACK_COLOR
      const grad = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.1,
        cx,
        cy,
        radius,
      )
      if (isRed(piece)) {
        grad.addColorStop(0, '#ff6b81')
        grad.addColorStop(1, RED_COLOR)
      } else {
        grad.addColorStop(0, '#3d3d6b')
        grad.addColorStop(1, BLACK_COLOR)
      }

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Edge ring
      ctx.strokeStyle = isRed(piece)
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 2 * dpr
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()

      // Inner ring
      ctx.strokeStyle = isRed(piece)
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1 * dpr
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2)
      ctx.stroke()

      // Crown for kings
      if (isKing(piece)) {
        ctx.fillStyle = CROWN_COLOR
        ctx.font = `bold ${cellSize * 0.3}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('\u265A', cx, cy)
      }
    }
  }
}

/* ── Component ── */
export default function Checkers() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<Board>(createBoard())
  const selectedRef = useRef<Pos | null>(null)
  const validMovesRef = useRef<Move[]>([])
  const isRedTurnRef = useRef(true)
  const gameOverRef = useRef(false)

  const [redScore, setRedScore] = useState(0)
  const [blackScore, setBlackScore] = useState(0)
  const [status, setStatus] = useState('Your turn')
  const [statusClass, setStatusClass] = useState('your-turn')

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

    const cellSize = rect.width / COLS
    drawBoard(ctx, boardRef.current, cellSize, selectedRef.current, validMovesRef.current.map((m) => m.to))
  }, [])

  const updateScores = useCallback(() => {
    const { red, black } = countPieces(boardRef.current)
    setRedScore(12 - black) // pieces captured
    setBlackScore(12 - red)
  }, [])

  const checkGameOver = useCallback((): boolean => {
    const redMoves = allMoves(boardRef.current, true)
    const blackMoves = allMoves(boardRef.current, false)
    if (redMoves.length === 0) {
      setStatus('Black wins!')
      setStatusClass('game-over')
      gameOverRef.current = true
      return true
    }
    if (blackMoves.length === 0) {
      setStatus('Red wins!')
      setStatusClass('game-over')
      gameOverRef.current = true
      return true
    }
    return false
  }, [])

  const doAiTurn = useCallback(() => {
    setStatus('AI is thinking...')
    setStatusClass('thinking')
    render()

    setTimeout(() => {
      const move = aiBestMove(boardRef.current)
      if (move) {
        boardRef.current = applyMove(boardRef.current, move)
      }
      updateScores()
      isRedTurnRef.current = true
      if (!checkGameOver()) {
        setStatus('Your turn')
        setStatusClass('your-turn')
      }
      selectedRef.current = null
      validMovesRef.current = []
      render()
    }, 300)
  }, [render, updateScores, checkGameOver])

  const handleClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (gameOverRef.current || !isRedTurnRef.current) return

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cellSize = rect.width / COLS

      let clientX: number, clientY: number
      if ('touches' in e) {
        e.preventDefault()
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      const col = Math.floor((clientX - rect.left) / cellSize)
      const row = Math.floor((clientY - rect.top) / cellSize)
      if (!inBounds(row, col)) return

      const board = boardRef.current
      const selected = selectedRef.current

      // If a piece is selected, check if clicking a valid target
      if (selected) {
        const targetMove = validMovesRef.current.find(
          (m) => m.to.r === row && m.to.c === col,
        )
        if (targetMove) {
          // Execute the move
          boardRef.current = applyMove(board, targetMove)
          selectedRef.current = null
          validMovesRef.current = []
          updateScores()
          isRedTurnRef.current = false

          if (!checkGameOver()) {
            doAiTurn()
          } else {
            render()
          }
          return
        }
      }

      // Select a red piece
      if (isRed(board[row][col])) {
        // Check if mandatory jumps exist for any red piece
        let allJumps: Move[] = []
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (isRed(board[r][c])) {
              allJumps = allJumps.concat(getMultiJumps(board, r, c))
            }
          }
        }

        if (allJumps.length > 0) {
          // Must jump -- check if this piece has jumps
          const pieceJumps = allJumps.filter(
            (m) => m.from.r === row && m.from.c === col,
          )
          if (pieceJumps.length === 0) {
            setStatus('You must jump!')
            setStatusClass('your-turn')
            // Highlight all pieces that can jump
            selectedRef.current = null
            validMovesRef.current = allJumps
            render()
            return
          }
          selectedRef.current = { r: row, c: col }
          validMovesRef.current = pieceJumps
        } else {
          // No jumps required, show simple moves
          const moves = getSimpleMoves(board, row, col)
          if (moves.length === 0) {
            selectedRef.current = null
            validMovesRef.current = []
            render()
            return
          }
          selectedRef.current = { r: row, c: col }
          validMovesRef.current = moves
        }

        setStatus('Your turn')
        setStatusClass('your-turn')
        render()
        return
      }

      // Click on empty or opponent piece while nothing useful
      selectedRef.current = null
      validMovesRef.current = []
      render()
    },
    [render, updateScores, checkGameOver, doAiTurn],
  )

  const newGame = useCallback(() => {
    boardRef.current = createBoard()
    selectedRef.current = null
    validMovesRef.current = []
    isRedTurnRef.current = true
    gameOverRef.current = false
    setRedScore(0)
    setBlackScore(0)
    setStatus('Your turn')
    setStatusClass('your-turn')
    render()
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    render()

    const onClick = (e: MouseEvent) => handleClick(e)
    const onTouch = (e: TouchEvent) => handleClick(e)

    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchstart', onTouch, { passive: false })

    const onResize = () => render()
    window.addEventListener('resize', onResize)

    return () => {
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('touchstart', onTouch)
      window.removeEventListener('resize', onResize)
    }
  }, [render, handleClick])

  return (
    <div className="checkers-page">
      <SEO title="Checkers" description="Play Checkers in the browser" />
      <div className="checkers-top-bar">
        <Link to="/games" className="checkers-back-link">
          Games
        </Link>
        <h1>Checkers</h1>
      </div>

      <div className="checkers-score-bar">
        <span className="checkers-score-item">
          <span className="checkers-dot red" />
          {redScore}
        </span>
        <span className="checkers-score-item">
          <span className="checkers-dot black" />
          {blackScore}
        </span>
      </div>

      <div className={`checkers-status ${statusClass}`}>{status}</div>

      <div className="checkers-board-container">
        <canvas ref={canvasRef} />
      </div>

      <button className="checkers-btn" onClick={newGame}>
        New Game
      </button>

      <div className="checkers-footer">Red moves first &middot; Jumps are mandatory</div>
    </div>
  )
}
