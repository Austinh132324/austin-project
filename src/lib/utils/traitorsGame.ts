export type TraitorsRole = 'traitor' | 'faithful'

export type TraitorsPhase =
  | 'lobby'
  | 'breakfast'
  | 'mission'
  | 'round_table'
  | 'banishment'
  | 'night'
  | 'game_over'

export interface TraitorsPlayer {
  id: string
  name: string
  role: TraitorsRole
  alive: boolean
  shielded: boolean
}

export interface VoteResult {
  tally: Record<string, number>
  leaders: string[]
  winningId: string | null
}

export const PHASE_ORDER: TraitorsPhase[] = [
  'lobby',
  'breakfast',
  'mission',
  'round_table',
  'banishment',
  'night',
  'game_over',
]

export const PHASE_LABELS: Record<TraitorsPhase, string> = {
  lobby: 'Lobby',
  breakfast: 'Breakfast',
  mission: 'Mission',
  round_table: 'Round Table',
  banishment: 'Banishment',
  night: 'Night',
  game_over: 'Game Over',
}

export function createId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

export function createSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function suggestedTraitorCount(playerCount: number): number {
  if (playerCount >= 10) return 3
  if (playerCount >= 7) return 2
  return 1
}

export function canStartWithPlayerCount(playerCount: number): boolean {
  return playerCount >= 4
}

export function withAssignedRoles(players: TraitorsPlayer[], traitorCount: number): TraitorsPlayer[] {
  const shuffledIds = [...players.map((p) => p.id)]
  for (let i = shuffledIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffledIds[i]
    shuffledIds[i] = shuffledIds[j]
    shuffledIds[j] = tmp
  }

  const traitorIds = new Set(shuffledIds.slice(0, Math.max(1, Math.min(traitorCount, players.length - 1))))
  return players.map((p) => ({
    ...p,
    role: traitorIds.has(p.id) ? 'traitor' : 'faithful',
    alive: true,
    shielded: false,
  }))
}

export function getAlivePlayers(players: TraitorsPlayer[]): TraitorsPlayer[] {
  return players.filter((p) => p.alive)
}

export function countLivingRoles(players: TraitorsPlayer[]): { traitors: number; faithful: number } {
  return players.reduce(
    (acc, p) => {
      if (!p.alive) return acc
      if (p.role === 'traitor') acc.traitors += 1
      else acc.faithful += 1
      return acc
    },
    { traitors: 0, faithful: 0 }
  )
}

export function getWinner(players: TraitorsPlayer[]): TraitorsRole | null {
  const counts = countLivingRoles(players)
  if (counts.traitors === 0) return 'faithful'
  if (counts.traitors >= counts.faithful) return 'traitor'
  return null
}

export function tallyVotes(votes: Record<string, string>, allowedVoters: string[]): VoteResult {
  const tally: Record<string, number> = {}
  allowedVoters.forEach((voterId) => {
    const targetId = votes[voterId]
    if (!targetId) return
    tally[targetId] = (tally[targetId] || 0) + 1
  })

  const max = Math.max(0, ...Object.values(tally))
  const leaders = max > 0 ? Object.keys(tally).filter((id) => tally[id] === max) : []
  return {
    tally,
    leaders,
    winningId: leaders.length === 1 ? leaders[0] : null,
  }
}

export function nextPlayablePhase(phase: TraitorsPhase): TraitorsPhase {
  switch (phase) {
    case 'lobby':
      return 'breakfast'
    case 'breakfast':
      return 'mission'
    case 'mission':
      return 'round_table'
    case 'round_table':
      return 'banishment'
    case 'banishment':
      return 'night'
    case 'night':
      return 'breakfast'
    default:
      return 'game_over'
  }
}
