import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Terminal from '../src/pages/Terminal'

function renderTerminal() {
  return render(
    <MemoryRouter>
      <Terminal />
    </MemoryRouter>
  )
}

describe('Terminal', () => {
  it('renders with welcome message', () => {
    renderTerminal()
    expect(screen.getByText(/Welcome to Austin's terminal/)).toBeInTheDocument()
  })

  it('renders the terminal prompt', () => {
    renderTerminal()
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('renders the title bar', () => {
    renderTerminal()
    expect(screen.getByText('visitor@austinshowell.dev')).toBeInTheDocument()
  })

  it('executes help command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText(/Available commands/)).toBeInTheDocument()
  })

  it('executes whoami command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'whoami' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getAllByText('visitor@austinshowell.dev').length).toBeGreaterThanOrEqual(2)
  })

  it('shows error for unknown command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'foobar' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText(/command not found/)).toBeInTheDocument()
  })

  it('executes about command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'about' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText(/Austin Howell/)).toBeInTheDocument()
  })

  it('executes ls command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ls' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText(/home.*aboutme.*projects/)).toBeInTheDocument()
  })

  it('executes clear command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    // Add some output first
    fireEvent.change(input, { target: { value: 'whoami' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    // Now clear
    fireEvent.change(input, { target: { value: 'clear' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    // Welcome message should be gone
    expect(screen.queryByText(/Welcome to Austin's terminal/)).not.toBeInTheDocument()
  })

  it('executes date command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'date' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    // Should contain a year
    expect(screen.getByText(/202\d/)).toBeInTheDocument()
  })

  it('executes echo command', () => {
    renderTerminal()
    const input = document.querySelector('.term-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'echo hello world' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })
})
