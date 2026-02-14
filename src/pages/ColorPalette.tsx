import { useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../styles/ColorPalette.css'

interface PaletteColor {
  h: number; s: number; l: number
  locked: boolean
}

type Harmony = 'random' | 'analogous' | 'complementary' | 'triadic' | 'split'

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function hslToRgb(h: number, s: number, l: number): string {
  const hex = hslToHex(h, s, l)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${r}, ${g}, ${b})`
}

function generatePalette(harmony: Harmony, locked: boolean[], existing: PaletteColor[]): PaletteColor[] {
  const baseH = Math.random() * 360
  const colors: PaletteColor[] = []

  for (let i = 0; i < 5; i++) {
    if (locked[i] && existing[i]) {
      colors.push(existing[i])
      continue
    }

    let h: number
    const s = 0.5 + Math.random() * 0.3
    const l = 0.35 + Math.random() * 0.35

    switch (harmony) {
      case 'analogous':
        h = (baseH + i * 30) % 360; break
      case 'complementary':
        h = i < 3 ? (baseH + i * 15) % 360 : (baseH + 180 + (i - 3) * 15) % 360; break
      case 'triadic':
        h = (baseH + Math.floor(i / 2) * 120 + (i % 2) * 20) % 360; break
      case 'split':
        h = i === 0 ? baseH : i < 3 ? (baseH + 150 + (i - 1) * 20) % 360 : (baseH + 210 + (i - 3) * 20) % 360; break
      default:
        h = Math.random() * 360
    }

    colors.push({ h, s, l, locked: false })
  }

  return colors
}

export default function ColorPalette() {
  const [harmony, setHarmony] = useState<Harmony>('random')
  const [colors, setColors] = useState<PaletteColor[]>(() =>
    generatePalette('random', [false,false,false,false,false], [])
  )
  const [copied, setCopied] = useState<number | null>(null)

  const generate = useCallback(() => {
    const locked = colors.map(c => c.locked)
    setColors(generatePalette(harmony, locked, colors))
  }, [harmony, colors])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        generate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [generate])

  const toggleLock = (index: number) => {
    setColors(prev => prev.map((c, i) => i === index ? { ...c, locked: !c.locked } : c))
  }

  const copyColor = (index: number) => {
    const c = colors[index]
    navigator.clipboard.writeText(hslToHex(c.h, c.s, c.l))
    setCopied(index)
    setTimeout(() => setCopied(null), 1500)
  }

  const exportCSS = () => {
    const css = colors.map((c, i) => `  --color-${i + 1}: ${hslToHex(c.h, c.s, c.l)};`).join('\n')
    navigator.clipboard.writeText(`:root {\n${css}\n}`)
    setCopied(-1)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="cp-page">
      <SEO title="Color Palette" description="Generate harmonious color palettes" />
      <div className="cp-top-bar">
        <Link to="/tools" className="cp-back-link">Tools</Link>
        <h1>Color Palette</h1>
      </div>

      <div className="cp-controls">
        <select className="cp-select" value={harmony} onChange={e => setHarmony(e.target.value as Harmony)}>
          <option value="random">Random</option>
          <option value="analogous">Analogous</option>
          <option value="complementary">Complementary</option>
          <option value="triadic">Triadic</option>
          <option value="split">Split Complementary</option>
        </select>
        <button className="cp-btn" onClick={generate}>Generate</button>
        <button className="cp-btn secondary" onClick={exportCSS}>
          {copied === -1 ? 'Copied!' : 'Export CSS'}
        </button>
      </div>

      <div className="cp-palette">
        {colors.map((c, i) => {
          const hex = hslToHex(c.h, c.s, c.l)
          const rgb = hslToRgb(c.h, c.s, c.l)
          return (
            <div key={i} className="cp-swatch" style={{ background: hex }} onClick={() => copyColor(i)}>
              <div className="cp-swatch-info">
                <div className="cp-hex">{copied === i ? 'Copied!' : hex}</div>
                <div className="cp-rgb">{rgb}</div>
              </div>
              <button
                className={`cp-lock${c.locked ? ' locked' : ''}`}
                onClick={e => { e.stopPropagation(); toggleLock(i) }}
              >
                {c.locked ? '\uD83D\uDD12' : '\uD83D\uDD13'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="cp-footer">Press spacebar or click Generate &middot; Click a swatch to copy hex</div>
    </div>
  )
}
