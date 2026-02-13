import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../styles/TicTacToe.css'

type Cell = 'X' | 'O' | null
type Mode = 'ai' | 'local'
type Difficulty = 'easy' | 'medium' | 'hard'

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

function checkWinner(board: Cell[]): { winner: Cell; line: number[] | null } {
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] }
    }
  }
  return { winner: null, line: null }
}

function isDraw(board: Cell[]): boolean {
  return board.every(c => c !== null) && !checkWinner(board).winner
}

function minimax(board: Cell[], isMax: boolean): number {
  const { winner } = checkWinner(board)
  if (winner === 'O') return 10
  if (winner === 'X') return -10
  if (board.every(c => c !== null)) return 0

  if (isMax) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O'
        best = Math.max(best, minimax(board, false))
        board[i] = null
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X'
        best = Math.min(best, minimax(board, true))
        board[i] = null
      }
    }
    return best
  }
}

function aiMove(board: Cell[], difficulty: Difficulty): number {
  const empty = board.map((c, i) => c === null ? i : -1).filter(i => i >= 0)
  if (empty.length === 0) return -1

  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)]
  }

  if (difficulty === 'medium') {
    // Block wins or take random
    for (const i of empty) {
      board[i] = 'O'
      if (checkWinner(board).winner === 'O') { board[i] = null; return i }
      board[i] = null
    }
    for (const i of empty) {
      board[i] = 'X'
      if (checkWinner(board).winner === 'X') { board[i] = null; return i }
      board[i] = null
    }
    return empty[Math.floor(Math.random() * empty.length)]
  }

  // Hard: minimax
  let bestScore = -Infinity
  let bestMove = empty[0]
  for (const i of empty) {
    board[i] = 'O'
    const score = minimax(board, false)
    board[i] = null
    if (score > bestScore) { bestScore = score; bestMove = i }
  }
  return bestMove
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [mode, setMode] = useState<Mode>('ai')
  const [difficulty, setDifficulty] = useState<Difficulty>('hard')
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 })
  const [winLine, setWinLine] = useState<number[] | null>(null)
  const [gameActive, setGameActive] = useState(true)

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
    setWinLine(null)
    setGameActive(true)
  }, [])

  const handleClick = useCallback((index: number) => {
    if (!gameActive || board[index]) return

    const newBoard = [...board]
    newBoard[index] = xIsNext ? 'X' : 'O'
    setBoard(newBoard)

    const { winner, line } = checkWinner(newBoard)
    if (winner) {
      setWinLine(line)
      setGameActive(false)
      setScores(s => ({ ...s, [winner.toLowerCase()]: s[winner.toLowerCase() as 'x' | 'o'] + 1 }))
      return
    }
    if (isDraw(newBoard)) {
      setGameActive(false)
      setScores(s => ({ ...s, draw: s.draw + 1 }))
      return
    }

    if (mode === 'ai' && xIsNext) {
      // AI responds
      setXIsNext(false)
      setTimeout(() => {
        const aiIdx = aiMove([...newBoard], difficulty)
        if (aiIdx >= 0) {
          newBoard[aiIdx] = 'O'
          setBoard([...newBoard])

          const result = checkWinner(newBoard)
          if (result.winner) {
            setWinLine(result.line)
            setGameActive(false)
            setScores(s => ({ ...s, o: s.o + 1 }))
            return
          }
          if (isDraw(newBoard)) {
            setGameActive(false)
            setScores(s => ({ ...s, draw: s.draw + 1 }))
            return
          }
        }
        setXIsNext(true)
      }, 300)
    } else {
      setXIsNext(!xIsNext)
    }
  }, [board, xIsNext, mode, difficulty, gameActive])

  const { winner } = checkWinner(board)
  const draw = isDraw(board)

  let status = ''
  if (winner) {
    status = `${winner} wins!`
  } else if (draw) {
    status = "It's a draw!"
  } else {
    status = mode === 'ai'
      ? (xIsNext ? 'Your turn (X)' : 'AI thinking...')
      : `${xIsNext ? 'X' : 'O'}'s turn`
  }

  return (
    <div className="ttt-page">
      <div className="ttt-top-bar">
        <Link to="/games" className="ttt-back-link">Games</Link>
        <h1>Tic-Tac-Toe</h1>
      </div>

      <div className="ttt-mode-bar">
        <button className={`ttt-mode-btn${mode === 'ai' ? ' active' : ''}`} onClick={() => { setMode('ai'); resetBoard() }}>vs AI</button>
        <button className={`ttt-mode-btn${mode === 'local' ? ' active' : ''}`} onClick={() => { setMode('local'); resetBoard() }}>2 Player</button>
        {mode === 'ai' && (
          <select className="ttt-diff" value={difficulty} onChange={e => { setDifficulty(e.target.value as Difficulty); resetBoard() }}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        )}
      </div>

      <div className="ttt-scores">
        <span className="ttt-score x">X: {scores.x}</span>
        <span className="ttt-score draw">Draw: {scores.draw}</span>
        <span className="ttt-score o">O: {scores.o}</span>
      </div>

      <div className="ttt-status">{status}</div>

      <div className="ttt-board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell${cell ? ' filled' : ''}${winLine?.includes(i) ? ' win' : ''}`}
            onClick={() => handleClick(i)}
          >
            {cell && <span className={`ttt-mark ${cell.toLowerCase()}`}>{cell}</span>}
          </button>
        ))}
      </div>

      <button className="ttt-btn" onClick={resetBoard}>New Round</button>

      <div className="ttt-footer">Click a cell to play</div>
    </div>
  )
}
