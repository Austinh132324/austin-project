import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import StarField from '../components/StarField'
import Footer from '../components/Footer'
import { matchResponse } from '../lib/utils/matchResponse'
import '../styles/Home.css'

const phrases = [
  'Building production apps with React & Angular',
  'Full stack engineer at JB Hunt',
  'University of Arkansas  |  Class of 2022  |  4.0 GPA',
  'Passionate about clean architecture & CI/CD',
  'Exploring AI agents & MCP servers',
  'Module Federation & micro-frontend enthusiast',
]

const techItems = [
  'TypeScript', 'JavaScript', 'Python', 'Angular', 'React', 'Redux',
  'Vite', 'Cypress', 'Azure DevOps', 'Kafka', 'Elasticsearch', 'Git',
  'CI/CD', 'Module Federation', 'Power BI', 'HTML/CSS', 'Agile', 'REST APIs',
]

interface ChatMessage {
  text: string
  type: 'bot' | 'user'
}

const suggestions = [
  { label: 'Tech stack?', query: 'What tech stack do you work with?' },
  { label: 'JB Hunt experience?', query: 'Tell me about your experience at JB Hunt' },
  { label: 'Best projects?', query: 'What projects are you most proud of?' },
  { label: 'Education?', query: 'Where did you go to school?' },
  { label: 'Hiring?', query: 'Are you open to new opportunities?' },
]

export default function Home() {
  const [typedText, setTypedText] = useState('')
  const [gpaCount, setGpaCount] = useState(0)
  const [projectsCount, setProjectsCount] = useState(0)
  const [yearsCount, setYearsCount] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: "Hey! I'm an AI version of Austin. Ask me about my experience, skills, projects, or anything else. What would you like to know?", type: 'bot' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // Typing effect
  useEffect(() => {
    let phraseIdx = 0
    let charIdx = 0
    let deleting = false
    let pauseTime = 0
    let timerId: ReturnType<typeof setTimeout>

    function typeLoop() {
      const phrase = phrases[phraseIdx]
      if (!deleting) {
        charIdx++
        if (charIdx > phrase.length) {
          pauseTime++
          if (pauseTime > 60) {
            deleting = true
            pauseTime = 0
          }
          timerId = setTimeout(typeLoop, 16)
          return
        }
      } else {
        charIdx--
        if (charIdx < 0) {
          charIdx = 0
          deleting = false
          phraseIdx = (phraseIdx + 1) % phrases.length
          pauseTime = 0
        }
      }
      setTypedText(phrase.substring(0, charIdx))
      timerId = setTimeout(typeLoop, deleting ? 25 : 50)
    }

    timerId = setTimeout(typeLoop, 1500)
    return () => clearTimeout(timerId)
  }, [])

  // Stat counter animation
  useEffect(() => {
    const duration = 1200 // ms total
    const steps = 40
    const interval = duration / steps

    let step = 0
    const timerId = setTimeout(() => {
      const countInterval = setInterval(() => {
        step++
        if (step >= steps) {
          setGpaCount(4.0)
          setProjectsCount(5)
          setYearsCount(8)
          clearInterval(countInterval)
          return
        }
        const progress = step / steps
        setGpaCount(parseFloat((4.0 * progress).toFixed(1)))
        setProjectsCount(Math.round(5 * progress))
        setYearsCount(Math.round(8 * progress))
      }, interval)
    }, 1200)

    return () => clearTimeout(timerId)
  }, [])

  // Scroll chat to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { text, type: 'user' }])
    setChatInput('')
    setShowSuggestions(false)
    setIsTyping(true)

    const delay = 600 + Math.random() * 800
    setTimeout(() => {
      setIsTyping(false)
      const response = matchResponse(text)
      setMessages(prev => [...prev, { text: response, type: 'bot' }])
    }, delay)
  }, [])

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage(chatInput)
  }

  const marqueeItems = [...techItems, ...techItems]

  return (
    <>
      <StarField shootingStars nebulaOrbs geoShapes />

      {/* ===== HERO ===== */}
      <section className="home-hero">
        <div className="home-content">
          <div className="status-badge">
            <div className="status-dot" />
            <span>Available for opportunities</span>
          </div>

          <div className="avatar-wrap">
            <div className="avatar-ring-pulse" />
            <div className="avatar-ring-outer" />
            <div className="avatar-ring" />
            <div className="avatar">AH</div>
          </div>

          <h1 className="home-title">Austin Howell</h1>
          <p className="home-subtitle">Software Engineer &bull; Creator &bull; Gamer</p>
          <div className="typed-line">
            {typedText}
            <span className="cursor" />
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-num">{gpaCount.toFixed(1)}</div>
              <div className="stat-label">GPA</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{projectsCount}</div>
              <div className="stat-label">Projects</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{yearsCount}</div>
              <div className="stat-label">Years Exp</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" style={{ fontSize: '1.4rem' }}>Full-Stack</div>
              <div className="stat-label">Developer</div>
            </div>
          </div>

          <div className="home-cards">
            <Link to="/aboutme" className="home-card">
              <div className="card-icon">&#128100;</div>
              <div className="card-title">About Me</div>
              <div className="card-desc">Background &amp; experience</div>
            </Link>
            <Link to="/projects" className="home-card">
              <div className="card-icon">&#128640;</div>
              <div className="card-title">Projects</div>
              <div className="card-desc">What I&apos;m building</div>
            </Link>
            <Link to="/games" className="home-card">
              <div className="card-icon">&#127918;</div>
              <div className="card-title">Games</div>
              <div className="card-desc">Play in the browser</div>
            </Link>
            <Link to="/tools" className="home-card">
              <div className="card-icon">&#128295;</div>
              <div className="card-title">Tools</div>
              <div className="card-desc">Handy utilities</div>
            </Link>
            <Link to="/terminal" className="home-card">
              <div className="card-icon">&#128187;</div>
              <div className="card-title">Terminal</div>
              <div className="card-desc">Interactive CLI</div>
            </Link>
          </div>
        </div>

        <div className="scroll-hint">
          <span>Explore</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* ===== TECH MARQUEE ===== */}
      <div className="marquee-section">
        <div className="marquee-track">
          {marqueeItems.map((tech, i) => (
            <span className="marquee-item" key={i}>{tech}</span>
          ))}
        </div>
      </div>

      {/* ===== AI CHAT ===== */}
      <section className="chat-section">
        <div className="chat-header">
          <h2>Ask Me Anything</h2>
          <p>Chat with an AI version of me &mdash; powered by my resume</p>
        </div>
        <div className="chat-box">
          <div className="chat-title-bar">
            <div className="chat-avatar-sm">AH</div>
            <div className="chat-title-info">
              <div className="chat-title-name">Austin Howell</div>
              <div className="chat-title-status">
                <div className="dot" />
                Online
              </div>
            </div>
          </div>

          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((msg, i) => (
              <div className={`msg ${msg.type}`} key={i}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="msg bot">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {showSuggestions && (
            <div className="suggestions">
              {suggestions.map((s, i) => (
                <button
                  className="suggestion-btn"
                  key={i}
                  onClick={() => sendMessage(s.query)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-wrap">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask me anything..."
              autoComplete="off"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
            />
            <button className="chat-send" onClick={() => sendMessage(chatInput)}>
              Send
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
