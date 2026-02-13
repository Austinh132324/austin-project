import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })

  it('renders the home page by default', () => {
    render(<App />)
    const headings = screen.getAllByText('Austin Howell')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders navigation cards on the home page', () => {
    render(<App />)
    expect(screen.getByText('About Me')).toBeInTheDocument()
    expect(screen.getAllByText('Projects').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Games').length).toBeGreaterThanOrEqual(1)
  })
})
