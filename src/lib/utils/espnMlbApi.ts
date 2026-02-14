const BASE = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb'

export interface MlbGameOdds {
  spread: { team: string; line: string } | null
  moneyLine: { home: string; away: string } | null
  overUnder: string | null
  provider: string
}

export interface MlbGame {
  id: string
  status: {
    type: { name: string; completed: boolean }
    period: number
    displayClock: string
    detailText: string
  }
  homeTeam: MlbTeamInfo
  awayTeam: MlbTeamInfo
  startTime: string
  odds: MlbGameOdds | null
}

export interface MlbTeamInfo {
  id: string
  name: string
  abbreviation: string
  logo: string
  score: string
  record: string
}

export interface MlbPlayer {
  id: string
  fullName: string
  position: string
  team: { id: string; name: string; abbreviation: string; logo: string }
  headshot?: string
  jersey?: string
}

export interface MlbPlayerStatLine {
  playerId: string
  gameId: string
  stats: Record<string, string>
  opponent: string
  date: string
  gameStatus: string
}

export interface MlbPlayerGroup {
  id: string
  name: string
  playerIds: string[]
  players: MlbPlayer[]
  createdAt: number
}

function parseOdds(comp: any): MlbGameOdds | null {
  const oddsArr = comp?.odds
  if (!oddsArr || oddsArr.length === 0) return null
  const primary = oddsArr[0]

  let spread: MlbGameOdds['spread'] = null
  if (primary.spread !== undefined) {
    spread = {
      team: primary.spreadTeam?.abbreviation || primary.details || '',
      line: String(primary.spread),
    }
  }

  let moneyLine: MlbGameOdds['moneyLine'] = null
  if (primary.homeTeamOdds?.moneyLine || primary.awayTeamOdds?.moneyLine) {
    moneyLine = {
      home: String(primary.homeTeamOdds?.moneyLine || ''),
      away: String(primary.awayTeamOdds?.moneyLine || ''),
    }
  }

  return {
    spread,
    moneyLine,
    overUnder: primary.overUnder ? String(primary.overUnder) : null,
    provider: primary.provider?.name || '',
  }
}

function parseGame(event: any): MlbGame {
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
    odds: parseOdds(comp),
  }
}

export async function fetchMlbScoreboard(): Promise<MlbGame[]> {
  const res = await fetch(`${BASE}/scoreboard`)
  const data = await res.json()
  return (data.events || []).map(parseGame)
}

export async function searchMlbPlayers(query: string): Promise<MlbPlayer[]> {
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

export async function fetchMlbGameSummary(gameId: string): Promise<any> {
  const res = await fetch(`${BASE}/summary?event=${gameId}`)
  return res.json()
}

export function extractMlbPlayerStats(summary: any, playerId: string): Record<string, string> | null {
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

const GROUPS_KEY = 'mlb-command-center-groups'

export function loadMlbGroups(): MlbPlayerGroup[] {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]')
  } catch { return [] }
}

export function saveMlbGroups(groups: MlbPlayerGroup[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function isMlbGameLive(game: MlbGame): boolean {
  const name = game.status.type.name
  return name === 'STATUS_IN_PROGRESS' || name === 'STATUS_HALFTIME'
}

export function getMlbGameStatusText(game: MlbGame): string {
  if (isMlbGameLive(game)) {
    const inning = game.status.period
    const half = game.status.displayClock
    if (half) return `${half} ${inning}`
    return game.status.detailText || `Inning ${inning}`
  }
  if (game.status.type.completed) return 'Final'
  return game.status.detailText || 'Scheduled'
}

export function findMlbPlayerGames(games: MlbGame[], player: MlbPlayer): MlbGame[] {
  return games.filter(g =>
    g.homeTeam.id === player.team.id || g.awayTeam.id === player.team.id
  )
}
