import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Games from '../src/pages/Games'

describe('Games', () => {
  it('renders all game cards', () => {
    render(
      <MemoryRouter>
        <Games />
      </MemoryRouter>
    )
    expect(screen.getByText('Checkers')).toBeInTheDocument()
    expect(screen.getByText('Snake')).toBeInTheDocument()
    expect(screen.getByText('Tetris')).toBeInTheDocument()
    expect(screen.getByText('Tic-Tac-Toe')).toBeInTheDocument()
  })

  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <Games />
      </MemoryRouter>
    )
    expect(screen.getByText('Arcade')).toBeInTheDocument()
  })
})
