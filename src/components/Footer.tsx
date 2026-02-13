import { Link } from 'react-router-dom'
import '../styles/Footer.css'

interface FooterProps {
  variant?: 'full' | 'simple'
}

export default function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'simple') {
    return (
      <div className="site-footer">
        <Link to="/">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="site-footer">
      <p>
        Built by Austin Howell &bull;{' '}
        <a href="mailto:AH132324@hotmail.com">AH132324@hotmail.com</a> &bull;{' '}
        <a href="https://linkedin.com/in/austin-howell-199609246" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </p>
    </div>
  )
}
