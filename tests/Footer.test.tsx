import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../src/components/Footer'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Footer', () => {
  it('renders the full footer by default', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByText(/Built by Austin Howell/)).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
  })

  it('renders the full footer with email link', () => {
    renderWithRouter(<Footer />)
    const emailLink = screen.getByText('AH132324@hotmail.com')
    expect(emailLink).toBeInTheDocument()
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:AH132324@hotmail.com')
  })

  it('renders the simple footer variant', () => {
    renderWithRouter(<Footer variant="simple" />)
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
    expect(screen.queryByText(/Built by Austin Howell/)).not.toBeInTheDocument()
  })

  it('simple variant links back to home', () => {
    renderWithRouter(<Footer variant="simple" />)
    const link = screen.getByText('Back to Home')
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })
})
