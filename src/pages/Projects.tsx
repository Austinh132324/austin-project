import { useState, useEffect, useRef, useCallback } from 'react'
import SEO from '../components/SEO'
import Navbar from '../components/Navbar'
import StarField from '../components/StarField'
import Footer from '../components/Footer'
import '../styles/Projects.css'

interface Project {
  title: string
  status: 'active' | 'shipped'
  tags: string[]
  filterTags: string[]
  icon: string
  description: string
  highlights: string[]
  tagColors: Record<string, string>
}

const FILTERS = ['All', 'React', 'Angular', 'Python', 'AI', 'DevOps']

const PROJECTS: Project[] = [
  {
    title: 'Personal Platform',
    status: 'active',
    tags: ['HTML/CSS', 'JavaScript', 'GitHub Pages', 'PWA'],
    filterTags: ['React', 'DevOps'],
    icon: '\u{1F310}',
    description:
      'This very site \u2014 a mobile-first PWA playground deployed to GitHub Pages with a custom domain, CI/CD pipeline, and a growing collection of interactive apps.',
    highlights: ['Custom domain HTTPS', 'CI/CD auto-deploy', 'Mobile add-to-home-screen'],
    tagColors: {},
  },
  {
    title: 'Power BI Reporting Portal',
    status: 'active',
    tags: ['React', 'Vite', 'Redux', 'Python', 'Power BI', 'Containers'],
    filterTags: ['React', 'Python'],
    icon: '\u{1F4CA}',
    description:
      'Led team of 2 to build a Vite React app with embedded Power BI dashboards, Redux async state management, and containerized DEV/PROD deployment pods.',
    highlights: ['Redux async state', 'DEV/PROD container pods', 'Embedded Power BI dashboards'],
    tagColors: { React: 'purple', Vite: 'purple', Redux: 'purple', Python: 'blue', 'Power BI': 'blue', Containers: 'blue' },
  },
  {
    title: 'AI Dev Agents',
    status: 'active',
    tags: ['AI Agents', 'Azure DevOps', 'MCP Servers', 'Code Review'],
    filterTags: ['AI', 'DevOps'],
    icon: '\u{1F916}',
    description:
      'AI-powered developer, tester, and code review agents integrated with Azure DevOps and MCP servers for automated workflows and design system compliance.',
    highlights: ['Developer/tester/review workflows', 'Azure DevOps MCP', 'Design system compliance'],
    tagColors: { 'AI Agents': 'purple', 'Azure DevOps': 'blue', 'MCP Servers': 'purple', 'Code Review': 'blue' },
  },
  {
    title: 'Kafka Feature Pipeline',
    status: 'shipped',
    tags: ['Angular', 'Kafka', 'Elasticsearch', 'Azure CI/CD', 'Full Stack'],
    filterTags: ['Angular', 'DevOps'],
    icon: '\u{1F680}',
    description:
      'Owned end-to-end Kafka messaging pipeline for Elasticsearch feature indexing, replacing legacy polling with real-time event-driven updates.',
    highlights: ['End-to-end ownership', 'Kafka replaced polling', 'CI/CD across 3 envs', '4 months user feedback'],
    tagColors: { Angular: 'purple', Kafka: 'blue', Elasticsearch: 'blue', 'Azure CI/CD': 'purple', 'Full Stack': 'blue' },
  },
  {
    title: 'Module Federation Monorepo',
    status: 'shipped',
    tags: ['Module Federation', 'Angular', 'React', 'Cypress', 'Micro-Frontends'],
    filterTags: ['Angular', 'React', 'DevOps'],
    icon: '\u{1F4E6}',
    description:
      'Modernized enterprise monorepo with Webpack Module Federation, enabling micro-frontend architecture and incremental Angular-to-React migration.',
    highlights: ['Micro-frontend architecture', 'Angular to React 25%/15%', 'Component Cypress testing'],
    tagColors: { 'Module Federation': 'purple', Angular: 'purple', React: 'purple', Cypress: 'blue', 'Micro-Frontends': 'blue' },
  },
]

export default function Projects() {
  const [activeFilter, setActiveFilter] = useState('All')
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const filteredProjects = PROJECTS.filter((p) => {
    if (activeFilter === 'All') return true
    return p.filterTags.includes(activeFilter)
  })

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [filteredProjects])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const card = cardRefs.current[index]
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateY = ((x - centerX) / centerX) * 8
    const rotateX = ((centerY - y) / centerY) * 8

    card.style.transform = `perspective(800px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`

    const glow = card.querySelector('.card-glow') as HTMLElement | null
    if (glow) {
      glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(233,69,96,0.12) 0%, transparent 60%)`
      glow.style.opacity = '1'
    }
  }, [])

  const handleMouseLeave = useCallback((index: number) => {
    const card = cardRefs.current[index]
    if (!card) return
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)'
    const glow = card.querySelector('.card-glow') as HTMLElement | null
    if (glow) {
      glow.style.opacity = '0'
    }
  }, [])

  function getTagClass(tag: string, colors: Record<string, string>) {
    const variant = colors[tag]
    if (variant === 'purple') return 'card-tag purple'
    if (variant === 'blue') return 'card-tag blue'
    return 'card-tag'
  }

  return (
    <>
      <SEO title="Projects" description="Austin Howell's project portfolio" />
      <StarField shootingStars />
      <Navbar />

      <section className="projects-hero">
        <h1 className="projects-title">Mission Control</h1>
        <p className="projects-subtitle">A look at what I&apos;m building, shipping, and dreaming up.</p>
      </section>

      <div className="hud-bar">
        <div className="hud-stat">
          <span className="hud-pulse" />
          Systems Online
        </div>
        <div className="hud-stat">
          <span className="num">5</span> Projects
        </div>
        <div className="hud-stat">
          <span className="num">3</span> Active
        </div>
        <div className="hud-stat">
          <span className="num">2</span> Shipped
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="projects-grid">
        {filteredProjects.map((project, i) => (
          <div
            key={project.title}
            className="project-card"
            ref={(el) => { cardRefs.current[i] = el }}
            style={{ animationDelay: `${i * 0.1}s` }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onMouseLeave={() => handleMouseLeave(i)}
          >
            <div className="card-glow" />
            <div className="card-header">
              <span className="card-icon">{project.icon}</span>
              <span className="card-title">{project.title}</span>
              <span className={`status-dot ${project.status}`} />
              <span className="status-label">{project.status === 'active' ? 'Active' : 'Shipped'}</span>
            </div>
            <p className="card-desc">{project.description}</p>
            <div className="card-tags">
              {project.tags.map((tag) => (
                <span key={tag} className={getTagClass(tag, project.tagColors)}>
                  {tag}
                </span>
              ))}
            </div>
            <ul className="card-highlights">
              {project.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Footer variant="simple" />
    </>
  )
}
