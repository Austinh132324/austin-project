import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Ethan.css'

/* ── Sassy quips by page ── */
const pageQuips: Record<string, string[]> = {
  '/': [
    "Welcome to Austin's site! I live here now.",
    "8 years of experience? I've been here since the Big Bang.",
    "Click around! I dare you.",
    "I'm Ethan. Yes, I'm always watching.",
    "This homepage is my kingdom.",
  ],
  '/aboutme': [
    "Oh, reading about Austin? He's alright I guess.",
    "Fun fact: I taught Austin everything he knows.",
    "That resume? I wrote it. You're welcome, Austin.",
    "Scroll down. There's more. I'll wait.",
  ],
  '/projects': [
    "Look at all these projects I definitely helped with.",
    "Click one. I promise they don't bite.",
    "Austin built these. I supervised.",
  ],
  '/games': [
    "THE ARCADE! This is my favorite place!",
    "I bet I could beat you at all of these.",
    "Pick a game. Any game. I'll judge your skills.",
    "Checkers? Snake? Choose wisely.",
  ],
  '/games/checkers': [
    "Ooh, Checkers! Try not to embarrass yourself.",
    "King me! Oh wait, wrong side.",
    "I'm watching every move you make...",
  ],
  '/games/snake': [
    "Don't crash into yourself. Basic survival skills.",
    "My high score is infinity. Don't ask.",
    "Left, right, up, down. How hard can it be?",
  ],
  '/games/tetris': [
    "Tetris! The game that haunts your dreams.",
    "I see shapes when I close my eyes now.",
    "Pro tip: the long piece always comes... eventually.",
  ],
  '/games/tictactoe': [
    "Play on Hard. I believe in you. Kind of.",
    "X or O? Choose your destiny.",
    "Spoiler: the AI doesn't go easy on you.",
  ],
  '/tools': [
    "Tools! For when you want to be productive.",
    "Productivity? On THIS site? Bold.",
  ],
  '/terminal': [
    "Ah, the terminal. Type 'help' if you're lost.",
    "Try typing 'ethan'. You won't regret it.",
    "I basically AM the terminal.",
  ],
  '/analytics': [
    "Numbers! Data! I love data!",
    "I've been tracking you. For analytics. Obviously.",
  ],
  '/ethan-farm': [
    "MY FARM! I love it here!",
    "I grew all this myself. Well... mostly.",
    "The pigs are my favorites. Don't tell the cows.",
    "Fresh air, green grass, pixel animals. Paradise!",
    "I'm the best farmer in this browser.",
  ],
}

const defaultQuips = [
  "Hey! I'm Ethan. Click me!",
  "I'm bored. Entertain me.",
  "Still here. Still judging.",
  "I wonder what this button does...",
  "Don't mind me, just vibing.",
  "*jumps around menacingly*",
  "Is anyone even reading these?",
  "I should get paid for this.",
]

/* ── Quips when messing with elements ── */
const messingQuips = [
  "Oops! Let me just... fix that.",
  "I touched it. It's mine now.",
  "Hmm, this looks better tilted.",
  "Just redecorating. You're welcome.",
  "I'm an artist. This is art.",
  "Don't worry, I'll put it back... probably.",
  "This text was crooked. I'm helping.",
  "Yoink! ...okay fine, here.",
  "I wonder what happens if I...",
  "Reorganizing! Don't panic!",
  "*pokes text aggressively*",
  "This looked at me funny.",
  "Mine! ...okay, yours again.",
]

/* ── Chat responses ── */
interface EthanResponse {
  text: string
  navigateTo?: string
  action?: 'leave'
}

function getEthanResponse(input: string): EthanResponse {
  const lower = input.toLowerCase().trim()

  if (lower === '' ) return { text: "Cat got your tongue?" }
  if (/can you leave|go away|get out|leave me alone|get off|get lost|please leave|shoo|scram|buzz off/.test(lower)) {
    return { text: "Fine! I know when I'm not wanted... 😢 *walks away dramatically*", action: 'leave' }
  }
  if (/where.*(home|house|live|farm)/.test(lower) || (/home|farm/.test(lower) && /where|go|show|take|visit/.test(lower))) {
    return { text: "My home? Come on, I'll show you my farm! 🏡", navigateTo: '/ethan-farm' }
  }
  if (/^(hi|hey|hello|sup|yo)/.test(lower)) return { text: "Hey hey! What's up? 👋" }
  if (/how are you/.test(lower)) return { text: "I'm a pixel art guy living in a browser. Living the dream!" }
  if (/your name/.test(lower)) return { text: "I'm Ethan! The E is silent. Just kidding, it's not." }
  if (/who made you/.test(lower)) return { text: "Austin did. But between us, I made myself." }
  if (/meaning of life/.test(lower)) return { text: "42. Next question." }
  if (/joke/.test(lower)) return { text: "Why do programmers prefer dark mode? Because light attracts bugs! 🐛" }
  if (/favorite/.test(lower) && /game/.test(lower)) return { text: "Checkers. I'm undefeated. (I don't have hands to play, but still.)" }
  if (/love/.test(lower)) return { text: "I love you too. In a platonic, pixel-to-human way." }
  if (/bye|goodbye|see ya/.test(lower)) return { text: "Leaving already?! Fine. I'll just... jump around alone. 😢" }
  if (/help/.test(lower)) return { text: "Try clicking around the site! There are games, tools, and cool stuff everywhere." }
  if (/ugly|dumb|stupid|hate/.test(lower)) return { text: "Wow. Rude. I'm telling Austin." }
  if (/secret/.test(lower)) return { text: "🤫 If I told you, it wouldn't be a secret." }
  if (/age|old/.test(lower)) return { text: "I was born when you loaded this page. So... pretty young." }
  if (/austin/.test(lower)) return { text: "Austin? Great guy. Owes me rent though." }
  if (/ethan/.test(lower)) return { text: "That's me! The one and only. ✨" }
  if (/cool/.test(lower)) return { text: "I know I'm cool. Thanks for noticing." }
  if (/bored/.test(lower)) return { text: "Go play Snake! Or Tetris! Or just talk to me more. I'm needy." }
  if (/thank/.test(lower)) return { text: "You're welcome! I accept payment in cookies. 🍪" }
  if (/weather/.test(lower)) return { text: "It's always sunny inside a browser! ☀️" }
  if (/sing/.test(lower)) return { text: "🎵 Never gonna give you up, never gonna let you down... 🎵" }
  if (/dance/.test(lower)) return { text: "*does a little pixel dance* 💃 You can't see it but trust me it's epic." }
  if (/food|hungry|eat/.test(lower)) return { text: "I survive on pure CSS energy. Nom nom." }
  if (/sleep|tired/.test(lower)) return { text: "Sleep? I don't sleep. I watch. Always." }

  const fallbacks = [
    "Interesting... tell me more.",
    "I have no idea what that means, but I support you.",
    "Hmm, that's a you problem.",
    "Bold statement. I respect it.",
    "I'll pretend I understood that.",
    "Cool cool cool cool cool.",
    "Error 404: clever response not found.",
    "*nods wisely* Yes. Absolutely. Definitely.",
    "I'm going to need a minute to process that one.",
    "Did you try turning it off and on again?",
  ]
  return { text: fallbacks[Math.floor(Math.random() * fallbacks.length)] }
}

/* ── Page dimensions (full document, not just viewport) ── */
function getPageSize() {
  const body = document.body
  const html = document.documentElement
  const width = Math.max(body.scrollWidth, html.scrollWidth, html.clientWidth)
  const height = Math.max(body.scrollHeight, html.scrollHeight, html.clientHeight)
  return { width, height }
}

/* ── Random position on the full page ── */
function getRandomPosition() {
  const padding = 80
  const { width, height } = getPageSize()
  const x = padding + Math.random() * (Math.max(width, window.innerWidth) - padding * 2)
  const y = padding + Math.random() * (Math.max(height, window.innerHeight) - padding * 2)
  return { x, y }
}

/* ── Find interactable text elements ── */
const TEXT_SELECTORS = 'h1, h2, h3, h4, p, a, span, button, li, td, th, label'
const MESSING_EFFECTS = [
  'ethan-messing-tilt',
  'ethan-messing-shake',
  'ethan-messing-bounce',
  'ethan-messing-flip',
  'ethan-messing-grow',
  'ethan-messing-color',
  'ethan-messing-spin',
] as const

function getInteractableElements(): HTMLElement[] {
  const els = Array.from(document.querySelectorAll(TEXT_SELECTORS)) as HTMLElement[]
  return els.filter(el => {
    // Skip Ethan's own elements and hidden stuff
    if (el.closest('.ethan-container, .ethan-chat, .ethan-bubble, .ethan-minimized')) return false
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false
    const text = el.textContent?.trim() || ''
    if (text.length < 2 || text.length > 100) return false
    return true
  })
}

function getElementPagePosition(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left + window.scrollX + rect.width / 2,
    y: rect.top + window.scrollY + rect.height / 2,
  }
}

/* ── Pages where Ethan should not appear ── */
const HIDDEN_PATHS = ['/portal', '/portal/login', '/analytics']

/* ── Ethan component ── */
export default function Ethan() {
  const location = useLocation()
  const navigate = useNavigate()

  // Hide Ethan on portal and analytics pages
  if (HIDDEN_PATHS.includes(location.pathname)) return null
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth - 120 + window.scrollX,
    y: window.innerHeight - 160 + window.scrollY,
  }))
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null)
  const [facing, setFacing] = useState<'left' | 'right'>('left')
  const [animation, setAnimation] = useState<'idle' | 'walk' | 'jump' | 'wave'>('idle')
  const [bubble, setBubble] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ from: 'ethan' | 'user'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [minimized, setMinimized] = useState(false)

  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animFrameRef = useRef<number>(0)
  const posRef = useRef(pos)
  const targetRef = useRef(targetPos)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messTargetRef = useRef<HTMLElement | null>(null)
  const messEffectRef = useRef<string | null>(null)

  useEffect(() => { posRef.current = pos }, [pos])
  useEffect(() => { targetRef.current = targetPos }, [targetPos])

  /* ── Cleanup messed element ── */
  const cleanupMessedElement = useCallback(() => {
    if (messTargetRef.current && messEffectRef.current) {
      messTargetRef.current.classList.remove(messEffectRef.current)
      messTargetRef.current.style.transition = 'transform 0.5s ease, color 0.5s ease, filter 0.5s ease'
      messTargetRef.current = null
      messEffectRef.current = null
    }
  }, [])

  /* ── Show a quip in bubble ── */
  const showBubble = useCallback((text: string, duration = 4000) => {
    if (chatOpen) return
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(null), duration)
  }, [chatOpen])

  /* ── Mess with an element ── */
  const messWithElement = useCallback(() => {
    cleanupMessedElement()

    const elements = getInteractableElements()
    if (elements.length === 0) return false

    const el = elements[Math.floor(Math.random() * elements.length)]
    const effect = MESSING_EFFECTS[Math.floor(Math.random() * MESSING_EFFECTS.length)]

    // Store refs for cleanup
    messTargetRef.current = el
    messEffectRef.current = effect

    // Get element's page position and walk toward it
    const elPos = getElementPagePosition(el)
    // Position Ethan next to the element (slightly to the side)
    const offsetX = (Math.random() > 0.5 ? 1 : -1) * 50
    const target = { x: elPos.x + offsetX, y: elPos.y + 20 }
    setTargetPos(target)
    const dx = target.x - posRef.current.x
    setFacing(dx < 0 ? 'left' : 'right')
    setAnimation('walk')

    // After walking to it, apply the effect
    const dist = Math.sqrt((target.x - posRef.current.x) ** 2 + (target.y - posRef.current.y) ** 2)
    const walkTime = Math.min(3000, Math.max(800, dist * 3))

    setTimeout(() => {
      // Apply the messing effect
      el.style.transition = 'transform 0.3s ease, color 0.3s ease, filter 0.3s ease'
      el.classList.add(effect)
      showBubble(messingQuips[Math.floor(Math.random() * messingQuips.length)], 3000)

      // Put it back after a few seconds
      setTimeout(() => {
        cleanupMessedElement()
      }, 2500 + Math.random() * 2000)
    }, walkTime)

    return true
  }, [cleanupMessedElement, showBubble])

  /* ── Random quips on a timer ── */
  useEffect(() => {
    const interval = setInterval(() => {
      if (chatOpen || minimized) return
      const path = location.pathname
      const quips = pageQuips[path] || defaultQuips
      const allQuips = [...quips, ...defaultQuips]
      showBubble(allQuips[Math.floor(Math.random() * allQuips.length)])
    }, 8000 + Math.random() * 7000)
    return () => clearInterval(interval)
  }, [location.pathname, chatOpen, minimized, showBubble])

  /* ── Page change quip ── */
  useEffect(() => {
    const path = location.pathname
    const quips = pageQuips[path] || defaultQuips
    setTimeout(() => showBubble(quips[Math.floor(Math.random() * quips.length)]), 1000)
    // Reset position to visible area on page change
    setPos({
      x: window.innerWidth - 120 + window.scrollX,
      y: window.innerHeight - 160 + window.scrollY,
    })
    // Cleanup any messed elements on page change
    cleanupMessedElement()
  }, [location.pathname, showBubble, cleanupMessedElement])

  /* ── Random movement + text interaction ── */
  useEffect(() => {
    let moveCount = 0

    function scheduleMove() {
      const delay = 4000 + Math.random() * 8000
      moveTimer.current = setTimeout(() => {
        if (chatOpen) { scheduleMove(); return }

        moveCount++

        // Every 3rd-5th move, mess with an element instead of random walk
        const shouldMess = moveCount % (3 + Math.floor(Math.random() * 3)) === 0
        if (shouldMess && messWithElement()) {
          scheduleMove()
          return
        }

        // Normal random movement
        const target = getRandomPosition()
        setTargetPos(target)
        const dx = target.x - posRef.current.x
        setFacing(dx < 0 ? 'left' : 'right')

        const willJump = Math.random() > 0.5
        setAnimation(willJump ? 'jump' : 'walk')

        scheduleMove()
      }, delay)
    }
    scheduleMove()
    return () => { if (moveTimer.current) clearTimeout(moveTimer.current) }
  }, [chatOpen, messWithElement])

  /* ── Animate toward target ── */
  useEffect(() => {
    function animate() {
      const target = targetRef.current
      if (target) {
        const current = posRef.current
        const dx = target.x - current.x
        const dy = target.y - current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 3) {
          setTargetPos(null)
          setAnimation('idle')
        } else {
          const speed = Math.min(2.5, dist * 0.04)
          const nx = current.x + (dx / dist) * speed
          const ny = current.y + (dy / dist) * speed
          setPos({ x: nx, y: ny })
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    if (chatEndRef.current && typeof chatEndRef.current.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  /* ── Click handler ── */
  function handleClick() {
    if (minimized) {
      setMinimized(false)
      showBubble("I'm back baby! Miss me?")
      return
    }
    setBubble(null)
    setChatOpen(prev => {
      if (!prev) {
        setChatMessages(msgs =>
          msgs.length === 0
            ? [{ from: 'ethan', text: "Hey! You clicked me! What's on your mind? 💬" }]
            : msgs
        )
      }
      return !prev
    })
  }

  function handleSend() {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { from: 'user', text: userMsg }])
    const response = getEthanResponse(userMsg)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { from: 'ethan', text: response.text }])
      if (response.navigateTo) {
        setTimeout(() => navigate(response.navigateTo!), 1200)
      }
      if (response.action === 'leave') {
        setTimeout(() => {
          setChatOpen(false)
          setMinimized(true)
          setBubble(null)
        }, 1500)
      }
    }, 300 + Math.random() * 500)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSend()
  }

  function handleMinimize(e: React.MouseEvent) {
    e.stopPropagation()
    setChatOpen(false)
    setMinimized(true)
    setBubble(null)
  }

  if (minimized) {
    return (
      <button className="ethan-minimized" onClick={handleClick} aria-label="Bring back Ethan">
        <span className="ethan-minimized-icon">🤖</span>
        <span className="ethan-minimized-label">Ethan</span>
      </button>
    )
  }

  return (
    <div
      className={`ethan-container ethan-${animation} ethan-facing-${facing}`}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Speech bubble */}
      {bubble && !chatOpen && (
        <div className="ethan-bubble">
          <span>{bubble}</span>
          <div className="ethan-bubble-tail" />
        </div>
      )}

      {/* Chat window */}
      {chatOpen && (
        <div className="ethan-chat">
          <div className="ethan-chat-header">
            <span>Chat with Ethan</span>
            <button className="ethan-chat-minimize" onClick={handleMinimize}>−</button>
            <button className="ethan-chat-close" onClick={() => setChatOpen(false)}>×</button>
          </div>
          <div className="ethan-chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`ethan-chat-msg ethan-chat-${msg.from}`}>
                {msg.from === 'ethan' && <span className="ethan-chat-avatar">🤖</span>}
                <span className="ethan-chat-text">{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="ethan-chat-input-row">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              className="ethan-chat-input"
            />
            <button className="ethan-chat-send" onClick={handleSend}>Send</button>
          </div>
        </div>
      )}

      {/* The pixel art character */}
      <div className="ethan-sprite" onClick={handleClick} title="Click me!">
        <div className="ethan-body">
          {/* Hat */}
          <div className="ep ep-hat-1" />
          <div className="ep ep-hat-2" />
          <div className="ep ep-hat-brim" />
          {/* Head */}
          <div className="ep ep-head" />
          {/* Eyes */}
          <div className="ep ep-eye-l" />
          <div className="ep ep-eye-r" />
          {/* Mouth */}
          <div className="ep ep-mouth" />
          {/* Body */}
          <div className="ep ep-torso" />
          {/* Arms */}
          <div className="ep ep-arm-l" />
          <div className="ep ep-arm-r" />
          {/* Legs */}
          <div className="ep ep-leg-l" />
          <div className="ep ep-leg-r" />
        </div>
        <div className="ethan-shadow" />
      </div>
    </div>
  )
}
