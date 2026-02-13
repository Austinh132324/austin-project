import { describe, it, expect, beforeEach } from 'vitest'
import { getLeaderboard, addScore, isHighScore } from '../src/lib/utils/leaderboard'

describe('leaderboard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array for new game', () => {
    expect(getLeaderboard('snake')).toEqual([])
  })

  it('adds a score and retrieves it', () => {
    addScore('snake', 'Alice', 100)
    const board = getLeaderboard('snake')
    expect(board).toHaveLength(1)
    expect(board[0].name).toBe('Alice')
    expect(board[0].score).toBe(100)
  })

  it('sorts scores in descending order', () => {
    addScore('snake', 'Alice', 50)
    addScore('snake', 'Bob', 150)
    addScore('snake', 'Charlie', 100)
    const board = getLeaderboard('snake')
    expect(board[0].name).toBe('Bob')
    expect(board[1].name).toBe('Charlie')
    expect(board[2].name).toBe('Alice')
  })

  it('limits to 10 entries', () => {
    for (let i = 0; i < 15; i++) {
      addScore('snake', `Player${i}`, i * 10)
    }
    expect(getLeaderboard('snake')).toHaveLength(10)
  })

  it('isHighScore returns true for empty leaderboard with score > 0', () => {
    expect(isHighScore('tetris', 10)).toBe(true)
  })

  it('isHighScore returns false for 0 score', () => {
    expect(isHighScore('tetris', 0)).toBe(false)
  })

  it('keeps separate leaderboards per game', () => {
    addScore('snake', 'Alice', 100)
    addScore('tetris', 'Bob', 200)
    expect(getLeaderboard('snake')).toHaveLength(1)
    expect(getLeaderboard('tetris')).toHaveLength(1)
    expect(getLeaderboard('snake')[0].name).toBe('Alice')
    expect(getLeaderboard('tetris')[0].name).toBe('Bob')
  })
})
