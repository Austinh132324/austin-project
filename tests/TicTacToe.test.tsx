import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TicTacToe from '../src/pages/TicTacToe'

function renderTicTacToe() {
  return render(
    <MemoryRouter>
      <TicTacToe />
    </MemoryRouter>
  )
}

describe('TicTacToe', () => {
  it('renders the game board with 9 cells', () => {
    renderTicTacToe()
    const cells = document.querySelectorAll('.ttt-cell')
    expect(cells.length).toBe(9)
  })

  it('renders the title', () => {
    renderTicTacToe()
    expect(screen.getByText('Tic-Tac-Toe')).toBeInTheDocument()
  })

  it('shows mode buttons', () => {
    renderTicTacToe()
    expect(screen.getByText('vs AI')).toBeInTheDocument()
    expect(screen.getByText('2 Player')).toBeInTheDocument()
  })

  it('allows switching to 2 player mode', () => {
    renderTicTacToe()
    fireEvent.click(screen.getByText('2 Player'))
    expect(screen.getByText("X's turn")).toBeInTheDocument()
  })

  it('places X on first click in 2-player mode', () => {
    renderTicTacToe()
    fireEvent.click(screen.getByText('2 Player'))
    const cells = document.querySelectorAll('.ttt-cell')
    fireEvent.click(cells[0])
    expect(cells[0].textContent).toBe('X')
  })

  it('alternates between X and O in 2-player mode', () => {
    renderTicTacToe()
    fireEvent.click(screen.getByText('2 Player'))
    const cells = document.querySelectorAll('.ttt-cell')
    fireEvent.click(cells[0])
    fireEvent.click(cells[1])
    expect(cells[0].textContent).toBe('X')
    expect(cells[1].textContent).toBe('O')
  })

  it('detects a win in 2-player mode', () => {
    renderTicTacToe()
    fireEvent.click(screen.getByText('2 Player'))
    const cells = document.querySelectorAll('.ttt-cell')
    // X: 0, 1, 2 (top row)  O: 3, 4
    fireEvent.click(cells[0]) // X
    fireEvent.click(cells[3]) // O
    fireEvent.click(cells[1]) // X
    fireEvent.click(cells[4]) // O
    fireEvent.click(cells[2]) // X wins
    expect(screen.getByText('X wins!')).toBeInTheDocument()
  })

  it('new round resets the board', () => {
    renderTicTacToe()
    fireEvent.click(screen.getByText('2 Player'))
    const cells = document.querySelectorAll('.ttt-cell')
    fireEvent.click(cells[0])
    fireEvent.click(screen.getByText('New Round'))
    const newCells = document.querySelectorAll('.ttt-cell')
    newCells.forEach(cell => {
      expect(cell.textContent).toBe('')
    })
  })
})
