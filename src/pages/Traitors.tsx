import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import {
  PHASE_LABELS,
  canStartWithPlayerCount,
  countLivingRoles,
  createId,
  createSessionCode,
  getAlivePlayers,
  getWinner,
  suggestedTraitorCount,
  tallyVotes,
  withAssignedRoles,
  type TraitorsPhase,
  type TraitorsPlayer,
  type TraitorsRole,
} from '../lib/utils/traitorsGame'
import '../styles/Traitors.css'

interface Phase {
  id: string
  icon: string
  title: string
  subtitle: string
  desc: string
  presets: number[]
  defaultTime: number
  ringColor: string
  accentColor: string
}

const PHASES: Phase[] = [
  {
    id: 'roundtable',
    icon: '🕯️',
    title: 'Round Table',
    subtitle: 'Deliberation',
    desc: 'Time for all players to debate and decide who to banish from the castle.',
    presets: [5, 10, 15],
    defaultTime: 10 * 60,
    accentColor: '#c9a84c',
    ringColor: '#e8c56a',
  },
  {
    id: 'banishment',
    icon: '⚔️',
    title: 'Banishment',
    subtitle: 'Final Verdict',
    desc: 'Countdown to the moment a player is banished. Are they Faithful or Traitor?',
    presets: [1, 2, 3],
    defaultTime: 60,
    accentColor: '#c0392b',
    ringColor: '#e74c3c',
  },
  {
    id: 'mission',
    icon: '🏰',
    title: 'The Mission',
    subtitle: 'Challenge',
    desc: 'Complete the mission before time runs out to add gold to the prize pot.',
    presets: [5, 10, 20],
    defaultTime: 10 * 60,
    accentColor: '#2980b9',
    ringColor: '#5dade2',
  },
  {
    id: 'murder',
    icon: '🗡️',
    title: 'Murder Council',
    subtitle: 'Traitors Only',
    desc: 'Traitors secretly convene to choose their next victim for the night.',
    presets: [2, 3, 5],
    defaultTime: 3 * 60,
    accentColor: '#8e44ad',
    ringColor: '#a569bd',
  },
  {
    id: 'shield',
    icon: '🛡️',
    title: 'Shield Decision',
    subtitle: 'Protection',
    desc: 'Claim a shield to protect yourself from the traitors lurking in the shadows.',
    presets: [1, 2, 3],
    defaultTime: 60,
    accentColor: '#27ae60',
    ringColor: '#52be80',
  },
]

type TimerState = {
  timeLeft: number
  total: number
  running: boolean
  done: boolean
  customMin: string
}

interface ShowEvent {
  id: string
  title: string
  detail: string
  phase: TraitorsPhase
  round: number
  ts: number
}

const TIMERS_STORAGE_KEY = 'traitors-timers-v1'
const SOUND_STORAGE_KEY = 'traitors-sound-v1'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext

function playToll() {
  try {
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 200
    gain.gain.setValueAtTime(0.6, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 3)

    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2); gain2.connect(ctx.destination)
    osc2.type = 'sine'; osc2.frequency.value = 300
    gain2.gain.setValueAtTime(0.2, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
    osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 2)

    setTimeout(() => {
      try {
        const ctx2 = new AudioCtx()
        const osc3 = ctx2.createOscillator()
        const gain3 = ctx2.createGain()
        osc3.connect(gain3); gain3.connect(ctx2.destination)
        osc3.type = 'sine'; osc3.frequency.value = 180
        gain3.gain.setValueAtTime(0.4, ctx2.currentTime)
        gain3.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 3)
        osc3.start(ctx2.currentTime); osc3.stop(ctx2.currentTime + 3)
      } catch (_) {}
    }, 1400)
  } catch (_) {}
}

function playTick() {
  try {
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'square'; osc.frequency.value = 880
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.07)
  } catch (_) {}
}

function fmt(timeLeft: number) {
  const m = Math.floor(timeLeft / 60)
  const s = timeLeft % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getDefaultTimers(): Record<string, TimerState> {
  const initial: Record<string, TimerState> = {}
  PHASES.forEach((p) => {
    initial[p.id] = { timeLeft: p.defaultTime, total: p.defaultTime, running: false, done: false, customMin: '' }
  })
  return initial
}

function getInitialTimers(): Record<string, TimerState> {
  const defaults = getDefaultTimers()
  try {
    const raw = localStorage.getItem(TIMERS_STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Record<string, Partial<TimerState>>

    PHASES.forEach((phase) => {
      const next = parsed[phase.id]
      if (!next) return

      const total = typeof next.total === 'number' && Number.isFinite(next.total) && next.total > 0
        ? Math.round(next.total)
        : defaults[phase.id].total
      const nextTime = typeof next.timeLeft === 'number' && Number.isFinite(next.timeLeft)
        ? Math.round(next.timeLeft)
        : total
      const timeLeft = Math.max(0, Math.min(total, nextTime))

      defaults[phase.id] = {
        timeLeft,
        total,
        running: false,
        done: timeLeft === 0,
        customMin: typeof next.customMin === 'string' ? next.customMin : '',
      }
    })
  } catch {
    return defaults
  }

  return defaults
}

function getInitialSound(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_STORAGE_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

function roleLabel(role: TraitorsRole): string {
  return role === 'traitor' ? 'Traitor' : 'Faithful'
}

export default function Traitors() {
  const [timers, setTimers] = useState<Record<string, TimerState>>(getInitialTimers)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(getInitialSound)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({})
  const soundEnabledRef = useRef(soundEnabled)

  // Game Director state
  const [sessionCode, setSessionCode] = useState(() => createSessionCode())
  const [newPlayerName, setNewPlayerName] = useState('')
  const [players, setPlayers] = useState<TraitorsPlayer[]>([])
  const [traitorCount, setTraitorCount] = useState(2)
  const [phase, setPhase] = useState<TraitorsPhase>('lobby')
  const [round, setRound] = useState(1)
  const [prizePot, setPrizePot] = useState(0)
  const [winner, setWinner] = useState<TraitorsRole | null>(null)
  const [events, setEvents] = useState<ShowEvent[]>([])
  const [roleVisibility, setRoleVisibility] = useState<Record<string, boolean>>({})

  const [missionAmount, setMissionAmount] = useState(5000)
  const [shieldTargetId, setShieldTargetId] = useState('')

  const [roundVotes, setRoundVotes] = useState<Record<string, string>>({})
  const [roundLeaders, setRoundLeaders] = useState<string[]>([])
  const [roundTieBreakId, setRoundTieBreakId] = useState('')

  const [banishmentId, setBanishmentId] = useState<string | null>(null)
  const [banishmentRevealed, setBanishmentRevealed] = useState(false)

  const [nightVotes, setNightVotes] = useState<Record<string, string>>({})
  const [nightLeaders, setNightLeaders] = useState<string[]>([])
  const [nightTieBreakId, setNightTieBreakId] = useState('')
  const [nightTargetId, setNightTargetId] = useState<string | null>(null)
  const [breakfastMessage, setBreakfastMessage] = useState('')

  const [recruitUsed, setRecruitUsed] = useState(false)
  const [recruitTargetId, setRecruitTargetId] = useState('')
  const [recruitOutcome, setRecruitOutcome] = useState<'accepted' | 'rejected'>('accepted')

  useEffect(() => {
    const hashQuery = window.location.hash.split('?')[1]
    if (!hashQuery) return
    const params = new URLSearchParams(hashQuery)
    const joinCode = params.get('join') || params.get('code')
    if (joinCode) setSessionCode(joinCode.toUpperCase().slice(0, 10))
  }, [])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    if (players.length <= 1) {
      setTraitorCount(1)
      return
    }
    setTraitorCount((prev) => {
      const suggested = suggestedTraitorCount(players.length)
      return Math.max(1, Math.min(players.length - 1, prev || suggested))
    })
  }, [players.length])

  useEffect(() => {
    try {
      const pausedTimers: Record<string, TimerState> = {}
      Object.keys(timers).forEach((id) => {
        pausedTimers[id] = { ...timers[id], running: false }
      })
      localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(pausedTimers))
    } catch {
      // Ignore persistence errors.
    }
  }, [timers])

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled))
    } catch {
      // Ignore persistence errors.
    }
  }, [soundEnabled])

  // Cursor auto-hide after 3s of inactivity
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const showCursor = () => {
      document.body.style.cursor = 'default'
      clearTimeout(timeout)
      timeout = setTimeout(() => { document.body.style.cursor = 'none' }, 3000)
    }
    document.addEventListener('mousemove', showCursor)
    return () => {
      document.removeEventListener('mousemove', showCursor)
      document.body.style.cursor = 'default'
      clearTimeout(timeout)
    }
  }, [])

  // Prevent body scroll in focus mode
  useEffect(() => {
    document.body.style.overflow = focusedId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [focusedId])

  const alivePlayers = useMemo(() => getAlivePlayers(players), [players])
  const livingTraitors = useMemo(() => alivePlayers.filter((p) => p.role === 'traitor'), [alivePlayers])
  const livingFaithful = useMemo(() => alivePlayers.filter((p) => p.role === 'faithful'), [alivePlayers])
  const livingCounts = useMemo(() => countLivingRoles(players), [players])

  const addEvent = useCallback((title: string, detail: string, phaseOverride?: TraitorsPhase, roundOverride?: number) => {
    setEvents((prev) => [{
      id: createId('event'),
      title,
      detail,
      phase: phaseOverride ?? phase,
      round: roundOverride ?? round,
      ts: Date.now(),
    }, ...prev].slice(0, 180))
  }, [phase, round])

  const revealAllRoles = useCallback((cast: TraitorsPlayer[]) => {
    const next: Record<string, boolean> = {}
    cast.forEach((p) => { next[p.id] = true })
    setRoleVisibility(next)
  }, [])

  const evaluateWin = useCallback((cast: TraitorsPlayer[]) => {
    const result = getWinner(cast)
    if (!result) return false
    setWinner(result)
    setPhase('game_over')
    addEvent('Game Over', `${roleLabel(result)} win the game.`, 'game_over')
    revealAllRoles(cast)
    return true
  }, [addEvent, revealAllRoles])

  const clearTimerInterval = useCallback((id: string) => {
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id])
      delete intervalRefs.current[id]
    }
  }, [])

  const startTimerInterval = useCallback((id: string) => {
    if (intervalRefs.current[id]) return
    intervalRefs.current[id] = setInterval(() => {
      setTimers(curr => {
        const timer = curr[id]
        if (!timer || !timer.running) return curr

        if (timer.timeLeft <= 1) {
          clearTimerInterval(id)
          if (soundEnabledRef.current) playToll()
          return { ...curr, [id]: { ...timer, timeLeft: 0, running: false, done: true } }
        }

        if (timer.timeLeft <= 10 && soundEnabledRef.current) playTick()
        return { ...curr, [id]: { ...timer, timeLeft: timer.timeLeft - 1 } }
      })
    }, 1000)
  }, [clearTimerInterval])

  const toggleTimer = useCallback((id: string) => {
    setTimers(prev => {
      const t = prev[id]
      if (t.done || t.timeLeft === 0) return prev
      if (t.running) {
        clearTimerInterval(id)
        return { ...prev, [id]: { ...t, running: false } }
      }
      startTimerInterval(id)
      return { ...prev, [id]: { ...t, running: true } }
    })
  }, [clearTimerInterval, startTimerInterval])

  const resetTimer = useCallback((id: string, newTotal?: number) => {
    clearTimerInterval(id)
    setTimers(prev => {
      const total = newTotal ?? prev[id].total
      return { ...prev, [id]: { ...prev[id], timeLeft: total, total, running: false, done: false } }
    })
  }, [clearTimerInterval])

  const setPreset = useCallback((id: string, minutes: number) => {
    clearTimerInterval(id)
    setTimers(prev => {
      const total = minutes * 60
      return { ...prev, [id]: { ...prev[id], timeLeft: total, total, running: false, done: false, customMin: '' } }
    })
  }, [clearTimerInterval])

  const handleCustomChange = useCallback((id: string, value: string) => {
    setTimers(prev => ({ ...prev, [id]: { ...prev[id], customMin: value } }))
  }, [])

  const applyCustom = useCallback((id: string) => {
    setTimers(prev => {
      const mins = parseFloat(prev[id].customMin)
      if (isNaN(mins) || mins <= 0 || mins > 999) return prev
      const total = Math.round(mins * 60)
      clearTimerInterval(id)
      return { ...prev, [id]: { ...prev[id], timeLeft: total, total, running: false, done: false } }
    })
  }, [clearTimerInterval])

  const toggleAllTimers = useCallback(() => {
    setTimers(prev => {
      const shouldPause = PHASES.some((phaseMeta) => prev[phaseMeta.id].running)
      const next: Record<string, TimerState> = { ...prev }

      PHASES.forEach((phaseMeta) => {
        const timer = prev[phaseMeta.id]
        if (shouldPause) {
          if (timer.running) clearTimerInterval(phaseMeta.id)
          next[phaseMeta.id] = { ...timer, running: false }
          return
        }

        if (!timer.running && !timer.done && timer.timeLeft > 0) {
          startTimerInterval(phaseMeta.id)
          next[phaseMeta.id] = { ...timer, running: true }
        }
      })

      return next
    })
  }, [clearTimerInterval, startTimerInterval])

  const resetAllTimers = useCallback(() => {
    setTimers(prev => {
      const next: Record<string, TimerState> = { ...prev }
      PHASES.forEach((phaseMeta) => {
        clearTimerInterval(phaseMeta.id)
        const total = prev[phaseMeta.id].total
        next[phaseMeta.id] = { ...prev[phaseMeta.id], timeLeft: total, total, running: false, done: false }
      })
      return next
    })
  }, [clearTimerInterval])

  const addPlayer = useCallback(() => {
    const name = newPlayerName.trim()
    if (!name || phase !== 'lobby') return
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return

    const player: TraitorsPlayer = {
      id: createId('player'),
      name,
      role: 'faithful',
      alive: true,
      shielded: false,
    }

    setPlayers((prev) => [...prev, player])
    setNewPlayerName('')
  }, [newPlayerName, phase, players])

  const removePlayer = useCallback((id: string) => {
    if (phase !== 'lobby') return
    setPlayers((prev) => prev.filter((p) => p.id !== id))
  }, [phase])

  const resetMatchKeepCast = useCallback(() => {
    const resetCast = players.map((p) => ({ ...p, role: 'faithful' as const, alive: true, shielded: false }))
    setPlayers(resetCast)
    setPhase('lobby')
    setRound(1)
    setPrizePot(0)
    setWinner(null)
    setEvents([])
    setRoleVisibility({})
    setMissionAmount(5000)
    setShieldTargetId('')
    setRoundVotes({})
    setRoundLeaders([])
    setRoundTieBreakId('')
    setBanishmentId(null)
    setBanishmentRevealed(false)
    setNightVotes({})
    setNightLeaders([])
    setNightTieBreakId('')
    setNightTargetId(null)
    setBreakfastMessage('')
    setRecruitUsed(false)
    setRecruitTargetId('')
    setRecruitOutcome('accepted')
  }, [players])

  const startGame = useCallback(() => {
    if (!canStartWithPlayerCount(players.length)) return
    const assigned = withAssignedRoles(players, traitorCount)
    setPlayers(assigned)
    setPhase('breakfast')
    setRound(1)
    setPrizePot(0)
    setWinner(null)
    setEvents([])
    setRoleVisibility({})
    setMissionAmount(5000)
    setShieldTargetId('')
    setRoundVotes({})
    setRoundLeaders([])
    setRoundTieBreakId('')
    setBanishmentId(null)
    setBanishmentRevealed(false)
    setNightVotes({})
    setNightLeaders([])
    setNightTieBreakId('')
    setNightTargetId(null)
    setBreakfastMessage('The host enters breakfast. Who made it through the night?')
    setRecruitUsed(false)
    setRecruitTargetId('')
    setRecruitOutcome('accepted')
    addEvent('Game Started', `${assigned.length} players entered the castle.`, 'breakfast', 1)
  }, [addEvent, players, traitorCount])

  const startMissionPhase = useCallback(() => {
    if (phase !== 'breakfast') return
    setPhase('mission')
    setMissionAmount(5000)
    setShieldTargetId('')
    addEvent('Mission Begins', 'Players head out to build the prize pot.', 'mission')
  }, [addEvent, phase])

  const resolveMission = useCallback((success: boolean) => {
    if (phase !== 'mission') return

    const updated = players.map((p) => ({ ...p, shielded: shieldTargetId === p.id && p.alive }))
    setPlayers(updated)

    if (success) {
      setPrizePot((prev) => prev + Math.max(0, missionAmount))
    }

    const shieldName = shieldTargetId
      ? updated.find((p) => p.id === shieldTargetId)?.name || 'Unknown'
      : 'No one'

    addEvent(
      success ? 'Mission Succeeded' : 'Mission Failed',
      `${success ? 'Added' : 'Missed'} $${missionAmount.toLocaleString()} · Shield: ${shieldName}`,
      'mission'
    )

    setRoundVotes({})
    setRoundLeaders([])
    setRoundTieBreakId('')
    setBanishmentId(null)
    setBanishmentRevealed(false)
    setPhase('round_table')
  }, [addEvent, missionAmount, phase, players, shieldTargetId])

  const lockRoundTable = useCallback(() => {
    if (phase !== 'round_table') return
    const voterIds = alivePlayers.map((p) => p.id)
    const allVoted = voterIds.every((id) => !!roundVotes[id])
    if (!allVoted) return

    const result = tallyVotes(roundVotes, voterIds)
    setRoundLeaders(result.leaders)

    if (result.winningId) {
      setBanishmentId(result.winningId)
      setBanishmentRevealed(false)
      setPhase('banishment')
      const name = alivePlayers.find((p) => p.id === result.winningId)?.name || 'Unknown'
      addEvent('Round Table Locked', `${name} received the most votes.`, 'round_table')
      return
    }

    if (result.leaders.length > 1) {
      setRoundTieBreakId(result.leaders[0])
      addEvent('Round Table Tie', `${result.leaders.length} players tied. Host tie-break needed.`, 'round_table')
    }
  }, [addEvent, alivePlayers, phase, roundVotes])

  const applyRoundTieBreak = useCallback(() => {
    if (phase !== 'round_table' || !roundTieBreakId) return
    setBanishmentId(roundTieBreakId)
    setBanishmentRevealed(false)
    setPhase('banishment')
    const name = alivePlayers.find((p) => p.id === roundTieBreakId)?.name || 'Unknown'
    addEvent('Host Tie-Break', `${name} was selected for banishment.`, 'round_table')
  }, [addEvent, alivePlayers, phase, roundTieBreakId])

  const revealBanishment = useCallback(() => {
    if (phase !== 'banishment' || !banishmentId || banishmentRevealed) return

    const target = players.find((p) => p.id === banishmentId)
    if (!target || !target.alive) return

    const updated = players.map((p) => p.id === banishmentId ? { ...p, alive: false, shielded: false } : p)
    setPlayers(updated)
    setBanishmentRevealed(true)
    addEvent('Banishment Reveal', `${target.name} was banished and revealed as ${roleLabel(target.role)}.`, 'banishment')

    evaluateWin(updated)
  }, [addEvent, banishmentId, banishmentRevealed, evaluateWin, phase, players])

  const beginNight = useCallback(() => {
    if (phase !== 'banishment' || !banishmentRevealed || winner) return
    setPhase('night')
    setNightVotes({})
    setNightLeaders([])
    setNightTieBreakId('')
    setNightTargetId(null)
    addEvent('Night Falls', 'Traitors gather in secret for the murder council.', 'night')
  }, [addEvent, banishmentRevealed, phase, winner])

  const applyRecruitTwist = useCallback(() => {
    if (phase !== 'night' || recruitUsed || !recruitTargetId) return
    const target = players.find((p) => p.id === recruitTargetId && p.alive && p.role === 'faithful')
    if (!target) return

    if (recruitOutcome === 'accepted') {
      const updated = players.map((p) => p.id === recruitTargetId ? { ...p, role: 'traitor' as const } : p)
      setPlayers(updated)
      addEvent('Recruit Twist', `${target.name} accepted the offer and joined the traitors.`, 'night')
      setRecruitUsed(true)
      setRecruitTargetId('')
      evaluateWin(updated)
      return
    }

    addEvent('Blackmail Twist', `${target.name} rejected recruitment. Tension rises in the castle.`, 'night')
    setRecruitUsed(true)
    setRecruitTargetId('')
  }, [addEvent, evaluateWin, phase, players, recruitOutcome, recruitTargetId, recruitUsed])

  const lockNightVotes = useCallback(() => {
    if (phase !== 'night') return

    const traitorIds = livingTraitors.map((p) => p.id)
    const allVoted = traitorIds.every((id) => !!nightVotes[id])
    if (!allVoted) return

    const result = tallyVotes(nightVotes, traitorIds)
    setNightLeaders(result.leaders)

    if (result.winningId) {
      setNightTargetId(result.winningId)
      const name = players.find((p) => p.id === result.winningId)?.name || 'Unknown'
      addEvent('Murder Vote Locked', `${name} has been selected by the traitors.`, 'night')
      return
    }

    if (result.leaders.length > 1) {
      setNightTieBreakId(result.leaders[0])
      addEvent('Murder Vote Tie', `${result.leaders.length} tied targets. Host tie-break needed.`, 'night')
    }
  }, [addEvent, livingTraitors, nightVotes, phase, players])

  const applyNightTieBreak = useCallback(() => {
    if (phase !== 'night' || !nightTieBreakId) return
    setNightTargetId(nightTieBreakId)
    const name = players.find((p) => p.id === nightTieBreakId)?.name || 'Unknown'
    addEvent('Night Tie-Break', `${name} became the final murder target.`, 'night')
  }, [addEvent, nightTieBreakId, phase, players])

  const resolveNight = useCallback(() => {
    if (phase !== 'night' || !nightTargetId) return

    const target = players.find((p) => p.id === nightTargetId && p.alive)
    if (!target) return

    let updated = players.map((p) => ({ ...p, shielded: false }))

    if (target.shielded) {
      const msg = `${target.name} was targeted, but the shield blocked the murder.`
      setBreakfastMessage(msg)
      addEvent('Night Outcome', msg, 'night')
    } else {
      updated = updated.map((p) => p.id === nightTargetId ? { ...p, alive: false } : p)
      const msg = `${target.name} was murdered during the night.`
      setBreakfastMessage(msg)
      addEvent('Night Outcome', `${msg} They were ${roleLabel(target.role)}.`, 'night')
    }

    setPlayers(updated)
    setRound((prev) => prev + 1)
    setPhase('breakfast')
    setRoundVotes({})
    setRoundLeaders([])
    setRoundTieBreakId('')
    setBanishmentId(null)
    setBanishmentRevealed(false)
    setNightVotes({})
    setNightLeaders([])
    setNightTieBreakId('')
    setNightTargetId(null)

    evaluateWin(updated)
  }, [addEvent, evaluateWin, nightTargetId, phase, players])

  const copyJoinLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#/tools/traitors?join=${sessionCode}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // no-op
    }
  }, [sessionCode])

  // Keyboard shortcuts in focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!focusedId) return
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); toggleTimer(focusedId) }
      if (e.code === 'KeyR') resetTimer(focusedId)
      if (e.code === 'KeyM') setSoundEnabled(prev => !prev)
      if (e.code === 'Escape') setFocusedId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [focusedId, toggleTimer, resetTimer])

  useEffect(() => {
    const refs = intervalRefs.current
    return () => { Object.values(refs).forEach(clearInterval) }
  }, [])

  const hasRunningTimers = PHASES.some(phaseMeta => timers[phaseMeta.id].running)
  const hasStartableTimers = PHASES.some((phaseMeta) => {
    const timer = timers[phaseMeta.id]
    return !timer.done && timer.timeLeft > 0
  })

  const shareUrl = `${window.location.origin}${window.location.pathname}#/tools/traitors?join=${sessionCode}`

  return (
    <div className="traitors-page">
      <SEO title="The Traitors – Round Table" description="Themed countdown timers for The Traitors game night" />

      {/* ---- FOCUS OVERLAY ---- */}
      {focusedId && (() => {
        const phaseMeta = PHASES.find(p => p.id === focusedId)!
        const timer = timers[focusedId]
        const isWarning = timer.timeLeft <= 30 && timer.timeLeft > 10 && timer.running
        const isUrgent = timer.timeLeft <= 10 && timer.running && !timer.done
        const ringColor = timer.done ? '#e74c3c' : isUrgent ? '#e74c3c' : isWarning ? '#e67e22' : phaseMeta.ringColor
        const size = 300
        const r = size * 0.43
        const circ = 2 * Math.PI * r
        const offset = circ * (timer.total > 0 ? timer.timeLeft / timer.total : 0)

        return (
          <div
            className={`traitors-focus${timer.running ? ' running' : ''}${timer.done ? ' done' : ''}${isWarning ? ' warning' : ''}${isUrgent ? ' urgent' : ''}`}
            style={{ '--timer-accent': phaseMeta.accentColor, '--timer-ring': phaseMeta.ringColor } as React.CSSProperties}
          >
            <button className="traitors-focus-close" onClick={() => setFocusedId(null)} title="Close (Esc)">✕</button>

            <div className="traitors-focus-phase">
              <span className="traitors-focus-icon">{phaseMeta.icon}</span>
              <span className="traitors-focus-phase-name">{phaseMeta.title}</span>
              <span className="traitors-focus-phase-sub">{phaseMeta.subtitle}</span>
            </div>

            <div className="traitors-focus-ring-wrap">
              <svg className="traitors-focus-ring" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
                />
              </svg>
              <div className={`traitors-focus-time${timer.done ? ' times-up' : ''}${isUrgent ? ' urgent' : ''}${isWarning ? ' warning' : ''}`}>
                {timer.done ? "TIME'S UP" : fmt(timer.timeLeft)}
              </div>
            </div>

            <div className="traitors-focus-controls">
              <button className="traitors-btn start" onClick={() => toggleTimer(focusedId)} disabled={timer.done}>
                {timer.running ? 'Pause' : 'Start'}
              </button>
              <button className="traitors-btn reset" onClick={() => resetTimer(focusedId)}>Reset</button>
            </div>

            <div className="traitors-focus-hints">
              Space · Start/Pause &nbsp;·&nbsp; R · Reset &nbsp;·&nbsp; M · Sound &nbsp;·&nbsp; Esc · Close
            </div>
          </div>
        )
      })()}

      {/* ---- HEADER ---- */}
      <div className="traitors-header">
        <Link to="/tools" className="traitors-back">← Tools</Link>
        <div className="traitors-title-block">
          <span className="traitors-crown">👑</span>
          <h1 className="traitors-title">The Traitors</h1>
          <p className="traitors-subtitle">Show Director + Round Table Countdowns</p>
        </div>
        <div className="traitors-header-controls">
          <button className="traitors-header-btn" onClick={toggleAllTimers} disabled={!hasRunningTimers && !hasStartableTimers}>
            {hasRunningTimers ? 'Pause All' : 'Start All'}
          </button>
          <button className="traitors-header-btn" onClick={resetAllTimers}>
            Reset All
          </button>
          <button
            className={`traitors-header-btn${soundEnabled ? ' active' : ''}`}
            onClick={() => setSoundEnabled(prev => !prev)}
          >
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </div>
      </div>

      {/* ---- GAME DIRECTOR ---- */}
      <section className="traitors-director-wrap">
        <div className="traitors-director-grid">
          <article className="traitors-director-card">
            <h2>Session</h2>
            <div className="traitors-director-kpis">
              <div><span>Code</span><strong>{sessionCode}</strong></div>
              <div><span>Round</span><strong>{round}</strong></div>
              <div><span>Phase</span><strong>{PHASE_LABELS[phase]}</strong></div>
              <div><span>Prize Pot</span><strong>${prizePot.toLocaleString()}</strong></div>
            </div>
            <div className="traitors-director-share">
              <input value={shareUrl} readOnly aria-label="Join URL" />
              <button onClick={copyJoinLink}>Copy</button>
              <button onClick={() => setSessionCode(createSessionCode())}>New Code</button>
            </div>
            <div className="traitors-director-lobby-row">
              <input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Add player"
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                disabled={phase !== 'lobby'}
              />
              <button onClick={addPlayer} disabled={phase !== 'lobby'}>Add</button>
            </div>
            <div className="traitors-director-lobby-row">
              <label htmlFor="traitorCount">Traitors</label>
              <select
                id="traitorCount"
                value={traitorCount}
                disabled={phase !== 'lobby' || players.length < 2}
                onChange={(e) => setTraitorCount(parseInt(e.target.value, 10) || 1)}
              >
                {Array.from({ length: Math.max(1, players.length - 1) }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button onClick={startGame} disabled={!canStartWithPlayerCount(players.length) || phase !== 'lobby'}>
                Start Game
              </button>
              <button onClick={resetMatchKeepCast}>Reset Match</button>
            </div>
            <p className="traitors-director-note">
              Host mode is live now. Players can join by name and the host controls show flow from one screen.
            </p>
          </article>

          <article className="traitors-director-card">
            <h2>Cast</h2>
            {players.length === 0 && <p className="traitors-director-empty">No players yet. Add your cast to begin.</p>}
            <div className="traitors-cast-list">
              {players.map((p) => {
                const reveal = !!roleVisibility[p.id] || phase === 'game_over'
                return (
                  <div key={p.id} className={`traitors-cast-row${!p.alive ? ' out' : ''}`}>
                    <div>
                      <strong>{p.name}</strong>
                      <span>{p.alive ? 'Alive' : 'Eliminated'}{p.shielded ? ' · Shielded' : ''}</span>
                    </div>
                    <div className="traitors-cast-actions">
                      <span className={`role-badge ${reveal ? p.role : 'hidden'}`}>
                        {reveal ? roleLabel(p.role) : 'Hidden'}
                      </span>
                      {phase !== 'lobby' && phase !== 'game_over' && (
                        <button onClick={() => setRoleVisibility((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}>
                          {reveal ? 'Hide' : 'Reveal'}
                        </button>
                      )}
                      {phase === 'lobby' && (
                        <button onClick={() => removePlayer(p.id)}>Remove</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="traitors-director-summary">
              <span>Living Faithful: {livingCounts.faithful}</span>
              <span>Living Traitors: {livingCounts.traitors}</span>
              {winner && <span className="winner-pill">Winner: {roleLabel(winner)}</span>}
            </div>
          </article>
        </div>

        <article className="traitors-director-card full">
          <h2>Phase Engine</h2>

          {phase === 'lobby' && (
            <p className="traitors-director-note">
              Flow enforced: Breakfast → Mission → Round Table → Banishment → Night. Start once your cast is ready.
            </p>
          )}

          {phase === 'breakfast' && (
            <div className="traitors-phase-panel">
              <p>{breakfastMessage || 'A new day begins in the castle.'}</p>
              <button onClick={startMissionPhase}>Begin Mission</button>
            </div>
          )}

          {phase === 'mission' && (
            <div className="traitors-phase-panel">
              <div className="traitors-form-grid">
                <label>
                  Mission Amount
                  <input
                    type="number"
                    value={missionAmount}
                    min={0}
                    step={500}
                    onChange={(e) => setMissionAmount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  />
                </label>
                <label>
                  Shield Holder
                  <select value={shieldTargetId} onChange={(e) => setShieldTargetId(e.target.value)}>
                    <option value="">No shield</option>
                    {alivePlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="traitors-btn-row">
                <button onClick={() => resolveMission(true)}>Mission Success</button>
                <button className="muted" onClick={() => resolveMission(false)}>Mission Failed</button>
              </div>
            </div>
          )}

          {phase === 'round_table' && (
            <div className="traitors-phase-panel">
              <div className="traitors-vote-grid">
                {alivePlayers.map((voter) => (
                  <label key={voter.id}>
                    {voter.name}
                    <select
                      value={roundVotes[voter.id] || ''}
                      onChange={(e) => setRoundVotes((prev) => ({ ...prev, [voter.id]: e.target.value }))}
                    >
                      <option value="">Select vote target</option>
                      {alivePlayers.filter((p) => p.id !== voter.id).map((target) => (
                        <option key={target.id} value={target.id}>{target.name}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <div className="traitors-btn-row">
                <button onClick={lockRoundTable}>Lock Round Table Votes</button>
              </div>
              {roundLeaders.length > 1 && (
                <div className="traitors-tie-panel">
                  <p>Tie detected. Host tie-break required.</p>
                  <select value={roundTieBreakId} onChange={(e) => setRoundTieBreakId(e.target.value)}>
                    {roundLeaders.map((id) => {
                      const p = players.find((x) => x.id === id)
                      return <option key={id} value={id}>{p?.name || id}</option>
                    })}
                  </select>
                  <button onClick={applyRoundTieBreak}>Apply Tie-Break</button>
                </div>
              )}
            </div>
          )}

          {phase === 'banishment' && (
            <div className="traitors-phase-panel">
              {!banishmentId && <p>No banishment candidate selected yet.</p>}
              {banishmentId && (
                <>
                  <p>
                    Candidate: <strong>{players.find((p) => p.id === banishmentId)?.name || 'Unknown'}</strong>
                  </p>
                  {!banishmentRevealed && <button onClick={revealBanishment}>Reveal Banishment</button>}
                  {banishmentRevealed && !winner && <button onClick={beginNight}>Proceed To Night</button>}
                </>
              )}
            </div>
          )}

          {phase === 'night' && (
            <div className="traitors-phase-panel">
              <div className="traitors-vote-grid">
                {livingTraitors.map((traitor) => (
                  <label key={traitor.id}>
                    {traitor.name} (Traitor vote)
                    <select
                      value={nightVotes[traitor.id] || ''}
                      onChange={(e) => setNightVotes((prev) => ({ ...prev, [traitor.id]: e.target.value }))}
                    >
                      <option value="">Select murder target</option>
                      {livingFaithful.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name}{target.shielded ? ' (Shielded)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="traitors-btn-row">
                <button onClick={lockNightVotes}>Lock Night Votes</button>
              </div>

              {nightLeaders.length > 1 && (
                <div className="traitors-tie-panel">
                  <p>Night tie detected. Host tie-break required.</p>
                  <select value={nightTieBreakId} onChange={(e) => setNightTieBreakId(e.target.value)}>
                    {nightLeaders.map((id) => {
                      const p = players.find((x) => x.id === id)
                      return <option key={id} value={id}>{p?.name || id}</option>
                    })}
                  </select>
                  <button onClick={applyNightTieBreak}>Apply Night Tie-Break</button>
                </div>
              )}

              {!recruitUsed && (
                <div className="traitors-twist-panel">
                  <h3>Recruit / Blackmail Twist</h3>
                  <div className="traitors-form-grid">
                    <label>
                      Target
                      <select value={recruitTargetId} onChange={(e) => setRecruitTargetId(e.target.value)}>
                        <option value="">Select faithful target</option>
                        {livingFaithful.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Outcome
                      <select value={recruitOutcome} onChange={(e) => setRecruitOutcome(e.target.value as 'accepted' | 'rejected')}>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>
                  </div>
                  <button onClick={applyRecruitTwist} disabled={!recruitTargetId}>Apply Twist</button>
                </div>
              )}

              {nightTargetId && (
                <div className="traitors-target-banner">
                  Final target: <strong>{players.find((p) => p.id === nightTargetId)?.name || 'Unknown'}</strong>
                </div>
              )}

              <div className="traitors-btn-row">
                <button onClick={resolveNight} disabled={!nightTargetId}>Resolve Night</button>
              </div>
            </div>
          )}

          {phase === 'game_over' && (
            <div className="traitors-phase-panel">
              <p className="winner-callout">{winner ? `${roleLabel(winner)} win the castle.` : 'Game over.'}</p>
              <button onClick={resetMatchKeepCast}>Reset Match</button>
            </div>
          )}
        </article>

        <article className="traitors-director-card full">
          <h2>Episode Recap Timeline</h2>
          {events.length === 0 && <p className="traitors-director-empty">No events yet.</p>}
          <div className="traitors-recap-list">
            {events.map((event) => (
              <div key={event.id} className="traitors-recap-item">
                <div className="traitors-recap-top">
                  <strong>{event.title}</strong>
                  <span>Round {event.round} · {PHASE_LABELS[event.phase]}</span>
                </div>
                <p>{event.detail}</p>
                <time>{new Date(event.ts).toLocaleTimeString()}</time>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ---- TIMER CARDS ---- */}
      <div className="traitors-grid">
        {PHASES.map(phaseMeta => {
          const timer = timers[phaseMeta.id]
          const isWarning = timer.timeLeft <= 30 && timer.timeLeft > 10 && timer.running
          const isUrgent = timer.timeLeft <= 10 && timer.running && !timer.done
          const ringColor = timer.done ? '#e74c3c' : isUrgent ? '#e74c3c' : isWarning ? '#e67e22' : phaseMeta.ringColor
          const radius = 76
          const circumference = 2 * Math.PI * radius
          const offset = circumference * (timer.total > 0 ? timer.timeLeft / timer.total : 0)

          return (
            <div
              key={phaseMeta.id}
              className={`traitors-card${timer.running ? ' running' : ''}${timer.done ? ' done' : ''}${isWarning ? ' warning' : ''}${isUrgent ? ' urgent' : ''}`}
              style={{ '--timer-accent': phaseMeta.accentColor, '--timer-ring': phaseMeta.ringColor } as React.CSSProperties}
            >
              <div className="traitors-card-header">
                <span className="traitors-phase-icon">{phaseMeta.icon}</span>
                <div className="traitors-phase-info">
                  <div className="traitors-phase-title">{phaseMeta.title}</div>
                  <div className="traitors-phase-sub">{phaseMeta.subtitle}</div>
                </div>
                <div className="traitors-card-actions">
                  {timer.running && <span className="traitors-live-dot" />}
                  <button
                    className="traitors-expand-btn"
                    onClick={() => setFocusedId(phaseMeta.id)}
                    title="Full screen"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4.5V1h3.5M8.5 1H12v3.5M12 8.5V12H8.5M4.5 12H1V8.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="traitors-phase-desc">{phaseMeta.desc}</p>

              <div className="traitors-ring-wrap">
                <svg className="traitors-ring" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 90 90)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
                  />
                </svg>
                <div className={`traitors-time${timer.done ? ' times-up' : ''}${isUrgent ? ' urgent' : ''}${isWarning ? ' warning' : ''}`}>
                  {timer.done ? "TIME'S UP" : fmt(timer.timeLeft)}
                </div>
              </div>

              <div className="traitors-presets">
                {phaseMeta.presets.map(min => (
                  <button
                    key={min}
                    className={`traitors-preset-btn${timer.total === min * 60 ? ' active' : ''}`}
                    onClick={() => setPreset(phaseMeta.id, min)}
                  >
                    {min}m
                  </button>
                ))}
                <div className="traitors-custom-wrap">
                  <input
                    type="number"
                    className="traitors-custom-input"
                    placeholder="min"
                    min="0.5"
                    max="999"
                    value={timer.customMin}
                    onChange={e => handleCustomChange(phaseMeta.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyCustom(phaseMeta.id)}
                  />
                  <button className="traitors-custom-go" onClick={() => applyCustom(phaseMeta.id)}>Set</button>
                </div>
              </div>

              <div className="traitors-controls">
                <button className="traitors-btn start" onClick={() => toggleTimer(phaseMeta.id)} disabled={timer.done}>
                  {timer.running ? 'Pause' : 'Start'}
                </button>
                <button className="traitors-btn reset" onClick={() => resetTimer(phaseMeta.id)}>Reset</button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="traitors-footer">
        May the faithful prevail... or may the traitors triumph.
      </p>
    </div>
  )
}
