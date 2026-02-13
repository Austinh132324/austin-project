import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Tools from '../src/pages/Tools'

describe('Tools', () => {
  it('renders all tool cards', () => {
    render(
      <MemoryRouter>
        <Tools />
      </MemoryRouter>
    )
    expect(screen.getByText('Pomodoro Timer')).toBeInTheDocument()
    expect(screen.getByText('Markdown Preview')).toBeInTheDocument()
    expect(screen.getByText('Color Palette')).toBeInTheDocument()
    expect(screen.getByText('Music Visualizer')).toBeInTheDocument()
    expect(screen.getByText('NBA Command Center')).toBeInTheDocument()
  })

  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <Tools />
      </MemoryRouter>
    )
    expect(screen.getByText('Mission Control')).toBeInTheDocument()
  })
})
