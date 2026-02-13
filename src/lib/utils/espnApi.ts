const BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'

export interface Game {
  id: string
  status: {
    type: { name: string; completed: boolean }
    period: number
    displayClock: string
    detailText: string
  }
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  startTime: string
}

export interface TeamInfo {
  id: string
  name: string
  abbreviation: string
  logo: string
  score: string
  record: string
}

export interface Player {
  id: string
  fullName: string
  position: string
  team: { id: string; name: string; abbreviation: string; logo: string }
  headshot?: string
  jersey?: string
}

export interface PlayerStatLine {
  playerId: string
  gameId: string
  stats: Record<string, string>
  opponent: string
  date: string
  gameStatus: string
}

export interface PlayerGroup {
  id: string
  name: string
  playerIds: string[]
  players: Player[]
  createdAt: number
}

function parseGame(event: any): Game {
  const comp = event.competitions?.[0]
  const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')
  const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')
  return {
    id: event.id,
    status: {
      type: { name: event.status?.type?.name || '', completed: event.status?.type?.completed || false },
      period: event.status?.period || 0,
      displayClock: event.status?.displayClock || '',
      detailText: event.status?.type?.shortDetail || event.status?.type?.detail || '',
    },
    homeTeam: {
      id: home?.team?.id || '',
      name: home?.team?.displayName || home?.team?.name || '',
      abbreviation: home?.team?.abbreviation || '',
      logo: home?.team?.logo || '',
      score: home?.score || '0',
      record: home?.records?.[0]?.summary || '',
    },
    awayTeam: {
      id: away?.team?.id || '',
      name: away?.team?.displayName || away?.team?.name || '',
      abbreviation: away?.team?.abbreviation || '',
      logo: away?.team?.logo || '',
      score: away?.score || '0',
      record: away?.records?.[0]?.summary || '',
    },
    startTime: event.date || '',
  }
}

export async function fetchScoreboard(): Promise<Game[]> {
  const res = await fetch(`${BASE}/scoreboard`)
  const data = await res.json()
  return (data.events || []).map(parseGame)
}

export async function fetchPlayers(page = 1, limit = 500): Promise<{ players: Player[]; total: number }> {
  const res = await fetch(`${BASE}/athletes?limit=${limit}&page=${page}`)
  const data = await res.json()
  const athletes = data.athletes || data.items || []
  const total = data.count || data.resultCount || athletes.length

  const players: Player[] = athletes.map((a: any) => ({
    id: a.id,
    fullName: a.fullName || a.displayName || '',
    position: a.position?.abbreviation || a.position?.name || '',
    team: {
      id: a.team?.id || '',
      name: a.team?.displayName || a.team?.name || '',
      abbreviation: a.team?.abbreviation || '',
      logo: a.team?.logo || '',
    },
    headshot: a.headshot?.href || '',
    jersey: a.jersey || '',
  }))

  return { players, total }
}

export async function searchPlayers(query: string): Promise<Player[]> {
  const res = await fetch(`${BASE}/athletes?limit=50&search=${encodeURIComponent(query)}`)
  const data = await res.json()
  const athletes = data.athletes || data.items || []

  return athletes.map((a: any) => ({
    id: a.id,
    fullName: a.fullName || a.displayName || '',
    position: a.position?.abbreviation || a.position?.name || '',
    team: {
      id: a.team?.id || '',
      name: a.team?.displayName || a.team?.name || '',
      abbreviation: a.team?.abbreviation || '',
      logo: a.team?.logo || '',
    },
    headshot: a.headshot?.href || '',
    jersey: a.jersey || '',
  }))
}

export async function fetchGameSummary(gameId: string): Promise<any> {
  const res = await fetch(`${BASE}/summary?event=${gameId}`)
  return res.json()
}

export function extractPlayerStats(summary: any, playerId: string): Record<string, string> | null {
  const boxscore = summary?.boxscore
  if (!boxscore?.players) return null

  for (const team of boxscore.players) {
    for (const statGroup of team.statistics || []) {
      const headers = statGroup.labels || []
      for (const athlete of statGroup.athletes || []) {
        if (String(athlete.athlete?.id) === String(playerId)) {
          const stats: Record<string, string> = {}
          ;(athlete.stats || []).forEach((val: string, i: number) => {
            if (headers[i]) stats[headers[i]] = val
          })
          return stats
        }
      }
    }
  }
  return null
}

const GROUPS_KEY = 'nba-command-center-groups'

export function loadGroups(): PlayerGroup[] {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]')
  } catch { return [] }
}

export function saveGroups(groups: PlayerGroup[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function isGameLive(game: Game): boolean {
  const name = game.status.type.name
  return name === 'STATUS_IN_PROGRESS' || name === 'STATUS_HALFTIME'
}

export function getGameStatusText(game: Game): string {
  if (isGameLive(game)) {
    if (game.status.type.name === 'STATUS_HALFTIME') return 'Halftime'
    const q = game.status.period
    const clock = game.status.displayClock
    return `Q${q} ${clock}`
  }
  if (game.status.type.completed) return 'Final'
  return game.status.detailText || 'Scheduled'
}

export function findPlayerGames(games: Game[], player: Player): Game[] {
  return games.filter(g =>
    g.homeTeam.id === player.team.id || g.awayTeam.id === player.team.id
  )
}
