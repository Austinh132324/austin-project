import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../src/components/Navbar'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Navbar', () => {
  it('renders the Home link', () => {
    renderWithRouter(<Navbar />)
    const homeLink = screen.getByText(/Home/)
    expect(homeLink).toBeInTheDocument()
    expect(homeLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders without additional links by default', () => {
    const { container } = renderWithRouter(<Navbar />)
    expect(container.querySelector('.nav-links')).toBeNull()
  })

  it('renders additional links when provided', () => {
    const links = [
      { label: 'GitHub', href: 'https://github.com' },
      { label: 'Blog', href: '/blog' },
    ]
    renderWithRouter(<Navbar links={links} />)

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('GitHub').closest('a')).toHaveAttribute('href', 'https://github.com')
    expect(screen.getByText('Blog').closest('a')).toHaveAttribute('href', '/blog')
  })
})
