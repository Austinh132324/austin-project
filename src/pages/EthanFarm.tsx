import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import '../styles/EthanFarm.css'

/* ── Waypoints Ethan walks between on his farm ── */
const WAYPOINTS = [
  { x: 50, y: 65, label: 'front-yard' },
  { x: 30, y: 55, label: 'barn' },
  { x: 15, y: 70, label: 'pig-pen' },
  { x: 42, y: 75, label: 'cow-pasture' },
  { x: 52, y: 80, label: 'chicken-coop' },
  { x: 70, y: 55, label: 'farmhouse' },
  { x: 62, y: 68, label: 'sheep-field' },
  { x: 80, y: 65, label: 'garden' },
  { x: 35, y: 68, label: 'hay-bales' },
  { x: 50, y: 50, label: 'hilltop' },
]

/* ── Things Ethan says at various locations ── */
const locationQuips: Record<string, string[]> = {
  'front-yard': [
    "Home sweet farm!",
    "What a beautiful day!",
    "Welcome to my farm!",
  ],
  'barn': [
    "The barn's looking good today!",
    "I painted this barn myself!",
    "Smells like... hard work.",
  ],
  'pig-pen': [
    "Hey little piggies!",
    "Oink oink to you too!",
    "These pigs eat better than I do.",
  ],
  'cow-pasture': [
    "Moooo! I mean... hello cows!",
    "Fresh milk coming right up!",
    "The cows are happy today.",
  ],
  'chicken-coop': [
    "Any eggs today, ladies?",
    "Bawk bawk bawk!",
    "Three eggs! Not bad!",
  ],
  'farmhouse': [
    "I built this house with my own hands!",
    "Time for some lemonade!",
    "There's no place like home.",
  ],
  'sheep-field': [
    "Baaaa! Fluffy friends!",
    "Wool season is coming!",
    "Who's a good sheep?",
  ],
  'garden': [
    "The flowers are blooming!",
    "I should water the garden...",
    "Nature is beautiful.",
  ],
  'hay-bales': [
    "Hay there! Get it?",
    "Stacking hay is a workout!",
    "These bales aren't gonna move themselves.",
  ],
  'hilltop': [
    "Great view from up here!",
    "I can see the whole farm!",
    "This is the life.",
  ],
}

const arrivalQuips = [
  "Howdy! Welcome to Ethan's Farm!",
  "Well, look who wandered onto my land!",
  "Yeehaw! Make yourself at home!",
]

export default function EthanFarm() {
  // Ethan position as % of viewport
  const [ethanPos, setEthanPos] = useState({ x: 50, y: 65 })
  const [targetWaypoint, setTargetWaypoint] = useState<number | null>(null)
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const [isWalking, setIsWalking] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const [houseHighlight, setHouseHighlight] = useState(false)
  const [chatInput, setChatInput] = useState('')

  const posRef = useRef(ethanPos)
  const targetRef = useRef(targetWaypoint)
  const animRef = useRef<number>(0)
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { posRef.current = ethanPos }, [ethanPos])
  useEffect(() => { targetRef.current = targetWaypoint }, [targetWaypoint])

  const showBubble = useCallback((text: string, duration = 3500) => {
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(null), duration)
  }, [])

  // Arrival quip
  useEffect(() => {
    const t = setTimeout(() => {
      showBubble(arrivalQuips[Math.floor(Math.random() * arrivalQuips.length)], 4000)
    }, 800)
    return () => clearTimeout(t)
  }, [showBubble])

  // Pick next waypoint periodically
  useEffect(() => {
    function scheduleMove() {
      const delay = 3000 + Math.random() * 5000
      moveTimer.current = setTimeout(() => {
        // Pick a random waypoint that isn't too close to current position
        const current = posRef.current
        const candidates = WAYPOINTS.filter(wp => {
          const dx = wp.x - current.x
          const dy = wp.y - current.y
          return Math.sqrt(dx * dx + dy * dy) > 8
        })
        if (candidates.length > 0) {
          const wp = candidates[Math.floor(Math.random() * candidates.length)]
          const idx = WAYPOINTS.indexOf(wp)
          setTargetWaypoint(idx)
          setFacing(wp.x < current.x ? 'left' : 'right')
          setIsWalking(true)
        }
        scheduleMove()
      }, delay)
    }

    // Start first move quickly
    moveTimer.current = setTimeout(() => {
      const wp = WAYPOINTS[Math.floor(Math.random() * WAYPOINTS.length)]
      const idx = WAYPOINTS.indexOf(wp)
      setTargetWaypoint(idx)
      setFacing(wp.x < posRef.current.x ? 'left' : 'right')
      setIsWalking(true)
      scheduleMove()
    }, 1500)

    return () => { if (moveTimer.current) clearTimeout(moveTimer.current) }
  }, [])

  // Animate toward target
  useEffect(() => {
    function animate() {
      const tIdx = targetRef.current
      if (tIdx !== null) {
        const target = WAYPOINTS[tIdx]
        const current = posRef.current
        const dx = target.x - current.x
        const dy = target.y - current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 1) {
          setTargetWaypoint(null)
          setIsWalking(false)
          // Say something about the location
          const quips = locationQuips[target.label]
          if (quips && Math.random() > 0.35) {
            setTimeout(() => {
              showBubble(quips[Math.floor(Math.random() * quips.length)])
            }, 300)
          }
        } else {
          const speed = Math.min(0.18, dist * 0.02)
          const nx = current.x + (dx / dist) * speed
          const ny = current.y + (dy / dist) * speed
          setEthanPos({ x: nx, y: ny })
        }
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [showBubble])

  // Navigate Ethan to the farmhouse
  const goToHouse = useCallback(() => {
    const farmhouseIdx = WAYPOINTS.findIndex(wp => wp.label === 'farmhouse')
    if (farmhouseIdx === -1) return
    const wp = WAYPOINTS[farmhouseIdx]
    setTargetWaypoint(farmhouseIdx)
    setFacing(wp.x < posRef.current.x ? 'left' : 'right')
    setIsWalking(true)
    setHouseHighlight(true)
    setTimeout(() => setHouseHighlight(false), 5000)
  }, [])

  // Handle chat submission
  const handleChatSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const question = chatInput.trim().toLowerCase()
    setChatInput('')
    if (!question) return

    if (question.includes('where') && (question.includes('house') || question.includes('home'))) {
      showBubble("My house? Right this way!", 2500)
      setTimeout(() => {
        goToHouse()
        showBubble("There's no place like home!", 4000)
      }, 1500)
    } else {
      const fallbacks = [
        "Hmm, not sure about that one!",
        "Try asking me where my house is!",
        "I only know about my farm...",
      ]
      showBubble(fallbacks[Math.floor(Math.random() * fallbacks.length)])
    }
  }, [chatInput, showBubble, goToHouse])

  // Cleanup
  useEffect(() => {
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    }
  }, [])

  return (
    <div className="farm-page">
      <SEO title="Ethan Farm" description="Virtual farm game" />
      {/* Sky */}
      <div className="farm-sky">
        <div className="farm-sun" />
        <div className="farm-cloud cloud-1" />
        <div className="farm-cloud cloud-2" />
        <div className="farm-cloud cloud-3" />
      </div>

      {/* Title */}
      <div className="farm-title">
        <h1>Ethan&apos;s Farm</h1>
        <p>A peaceful life on the land</p>
      </div>

      {/* Back */}
      <Link to="/" className="farm-back">
        &#8592; Back Home
      </Link>

      {/* Ground */}
      <div className="farm-ground">
        <div className="farm-hill-back" />
        <div className="farm-field" />
        <div className="farm-path" />

        {/* Fence */}
        <div className="farm-fence">
          <div className="fence-post" style={{ left: '0%' }} />
          <div className="fence-post" style={{ left: '20%' }} />
          <div className="fence-post" style={{ left: '40%' }} />
          <div className="fence-post" style={{ left: '60%' }} />
          <div className="fence-post" style={{ left: '80%' }} />
          <div className="fence-post" style={{ left: '100%' }} />
          <div className="fence-rail fence-rail-top" />
          <div className="fence-rail fence-rail-bottom" />
        </div>

        {/* Barn */}
        <div className="farm-barn">
          <div className="barn-roof" />
          <div className="barn-body" />
          <div className="barn-door" />
        </div>

        {/* Hay bales */}
        <div className="hay-bale hay-1" />
        <div className="hay-bale hay-2" />
        <div className="hay-bale hay-3" />
      </div>

      {/* Farmhouse */}
      <div className={`farmhouse${houseHighlight ? ' farmhouse-highlight' : ''}`}>
        <div className="farmhouse-roof-body" />
        <div className="farmhouse-body">
          <div className="farmhouse-door" />
          <div className="farmhouse-window farmhouse-window-l" />
          <div className="farmhouse-window farmhouse-window-r" />
        </div>
      </div>

      {/* Silo */}
      <div className="farm-silo">
        <div className="silo-top" />
        <div className="silo-body" />
      </div>

      {/* Trees */}
      <div className="farm-tree tree-1">
        <div className="tree-top" />
        <div className="tree-trunk" />
      </div>
      <div className="farm-tree tree-2">
        <div className="tree-top" />
        <div className="tree-trunk" />
      </div>
      <div className="farm-tree tree-3">
        <div className="tree-top" />
        <div className="tree-trunk" />
      </div>
      <div className="farm-tree tree-4">
        <div className="tree-top" />
        <div className="tree-trunk" />
      </div>

      {/* Animals */}
      {/* Cows */}
      <div className="animal-cow cow-1">
        <div className="cow-body" />
        <div className="cow-spots" />
        <div className="cow-head"><div className="cow-eye" /></div>
        <div className="cow-legs">
          <div className="cow-leg cow-leg-1" />
          <div className="cow-leg cow-leg-2" />
          <div className="cow-leg cow-leg-3" />
          <div className="cow-leg cow-leg-4" />
        </div>
        <div className="cow-tail" />
      </div>
      <div className="animal-cow cow-2">
        <div className="cow-body" />
        <div className="cow-spots" />
        <div className="cow-head"><div className="cow-eye" /></div>
        <div className="cow-legs">
          <div className="cow-leg cow-leg-1" />
          <div className="cow-leg cow-leg-2" />
          <div className="cow-leg cow-leg-3" />
          <div className="cow-leg cow-leg-4" />
        </div>
        <div className="cow-tail" />
      </div>

      {/* Chickens */}
      <div className="animal-chicken chicken-1">
        <div className="chicken-body" />
        <div className="chicken-head">
          <div className="chicken-eye" />
          <div className="chicken-beak" />
          <div className="chicken-comb" />
        </div>
        <div className="chicken-legs">
          <div className="chicken-leg-l" />
          <div className="chicken-leg-r" />
        </div>
      </div>
      <div className="animal-chicken chicken-2">
        <div className="chicken-body" />
        <div className="chicken-head">
          <div className="chicken-eye" />
          <div className="chicken-beak" />
          <div className="chicken-comb" />
        </div>
        <div className="chicken-legs">
          <div className="chicken-leg-l" />
          <div className="chicken-leg-r" />
        </div>
      </div>
      <div className="animal-chicken chicken-3">
        <div className="chicken-body" />
        <div className="chicken-head">
          <div className="chicken-eye" />
          <div className="chicken-beak" />
          <div className="chicken-comb" />
        </div>
        <div className="chicken-legs">
          <div className="chicken-leg-l" />
          <div className="chicken-leg-r" />
        </div>
      </div>

      {/* Pigs */}
      <div className="animal-pig pig-1">
        <div className="pig-body" />
        <div className="pig-head">
          <div className="pig-eye" />
          <div className="pig-snout" />
          <div className="pig-ear" />
        </div>
        <div className="pig-legs">
          <div className="pig-leg pig-leg-1" />
          <div className="pig-leg pig-leg-2" />
          <div className="pig-leg pig-leg-3" />
          <div className="pig-leg pig-leg-4" />
        </div>
        <div className="pig-tail" />
      </div>
      <div className="animal-pig pig-2">
        <div className="pig-body" />
        <div className="pig-head">
          <div className="pig-eye" />
          <div className="pig-snout" />
          <div className="pig-ear" />
        </div>
        <div className="pig-legs">
          <div className="pig-leg pig-leg-1" />
          <div className="pig-leg pig-leg-2" />
          <div className="pig-leg pig-leg-3" />
          <div className="pig-leg pig-leg-4" />
        </div>
        <div className="pig-tail" />
      </div>

      {/* Sheep */}
      <div className="animal-sheep sheep-1">
        <div className="sheep-body" />
        <div className="sheep-head"><div className="sheep-eye" /></div>
        <div className="sheep-legs">
          <div className="sheep-leg sheep-leg-1" />
          <div className="sheep-leg sheep-leg-2" />
          <div className="sheep-leg sheep-leg-3" />
          <div className="sheep-leg sheep-leg-4" />
        </div>
      </div>

      {/* Flowers */}
      <div className="farm-flower flower-1"><div className="flower-stem" /><div className="flower-petals" /></div>
      <div className="farm-flower flower-2"><div className="flower-stem" /><div className="flower-petals" /></div>
      <div className="farm-flower flower-3"><div className="flower-stem" /><div className="flower-petals" /></div>
      <div className="farm-flower flower-4"><div className="flower-stem" /><div className="flower-petals" /></div>
      <div className="farm-flower flower-5"><div className="flower-stem" /><div className="flower-petals" /></div>
      <div className="farm-flower flower-6"><div className="flower-stem" /><div className="flower-petals" /></div>

      {/* ── Ethan the Farmer ── */}
      <div
        className={`ethan-farmer ${isWalking ? 'walking' : ''} ${facing === 'left' ? 'facing-left' : ''}`}
        style={{
          left: `${ethanPos.x}%`,
          top: `${ethanPos.y}%`,
          transform: `translate(-50%, -50%)${facing === 'left' ? ' scaleX(-1)' : ''}`,
        }}
      >
        {bubble && (
          <div className="ethan-farm-bubble" style={facing === 'left' ? { transform: 'translateX(-50%) scaleX(-1)' } : undefined}>
            {bubble}
          </div>
        )}
        <div className="ef-hat" />
        <div className="ef-hat-brim" />
        <div className="ef-head" />
        <div className="ef-eye-l" />
        <div className="ef-eye-r" />
        <div className="ef-smile" />
        <div className="ef-strap-l" />
        <div className="ef-strap-r" />
        <div className="ef-body" />
        <div className="ef-arm-l" />
        <div className="ef-arm-r" />
        <div className="ef-leg-l" />
        <div className="ef-leg-r" />
        <div className="ef-boot-l" />
        <div className="ef-boot-r" />
        <div className="ef-shadow" />
      </div>

      {/* Chat input */}
      <form className="farm-chat" onSubmit={handleChatSubmit}>
        <input
          className="farm-chat-input"
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask Ethan something..."
        />
        <button className="farm-chat-send" type="submit">Ask</button>
      </form>

    </div>
  )
}
