/**
 * The Odds API integration for player props and betting odds.
 * Free tier: 500 requests/month at https://the-odds-api.com
 */

const ODDS_BASE = 'https://api.the-odds-api.com/v4'

const API_KEY_STORAGE = 'odds-api-key'

export function getOddsApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || ''
}

export function setOddsApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export interface PlayerProp {
  market: string          // e.g. "player_points", "player_rebounds"
  playerName: string
  description: string     // readable label
  line: number
  overOdds: number        // American odds
  underOdds: number
  overConfidence: number  // implied probability 0–100
  underConfidence: number
  bookmaker: string
}

export interface GameOddsData {
  id: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  bookmakers: BookmakerOdds[]
}

export interface BookmakerOdds {
  name: string
  spreads: { team: string; point: number; price: number }[]
  moneyline: { team: string; price: number }[]
  totals: { name: string; point: number; price: number }[]
}

// Convert American odds to implied probability (0–100)
export function oddsToConfidence(americanOdds: number): number {
  if (americanOdds === 0) return 50
  if (americanOdds > 0) {
    return Math.round((100 / (americanOdds + 100)) * 100)
  }
  const abs = Math.abs(americanOdds)
  return Math.round((abs / (abs + 100)) * 100)
}

// Readable market labels
const MARKET_LABELS: Record<string, string> = {
  player_points: 'Points',
  player_rebounds: 'Rebounds',
  player_assists: 'Assists',
  player_threes: '3-Pointers',
  player_blocks: 'Blocks',
  player_steals: 'Steals',
  player_points_rebounds_assists: 'Pts+Reb+Ast',
  player_points_rebounds: 'Pts+Reb',
  player_points_assists: 'Pts+Ast',
  player_rebounds_assists: 'Reb+Ast',
  player_turnovers: 'Turnovers',
  player_double_double: 'Double-Double',
  // MLB props
  player_hits: 'Hits',
  player_total_bases: 'Total Bases',
  player_home_runs: 'Home Runs',
  player_rbis: 'RBIs',
  player_runs: 'Runs',
  player_stolen_bases: 'Stolen Bases',
  player_strikeouts: 'Strikeouts',
  player_hits_runs_rbis: 'H+R+RBI',
  pitcher_strikeouts: 'Pitcher K\'s',
  pitcher_outs: 'Pitcher Outs',
  pitcher_hits_allowed: 'Hits Allowed',
  pitcher_walks: 'Walks Allowed',
  pitcher_earned_runs: 'Earned Runs',
  // NFL props
  player_pass_yds: 'Pass Yards',
  player_pass_tds: 'Pass TDs',
  player_pass_completions: 'Completions',
  player_rush_yds: 'Rush Yards',
  player_rush_attempts: 'Rush Attempts',
  player_reception_yds: 'Rec Yards',
  player_receptions: 'Receptions',
  player_anytime_td: 'Anytime TD',
}

function getMarketLabel(market: string): string {
  return MARKET_LABELS[market] || market.replace(/^player_|^pitcher_/, '').replace(/_/g, ' ')
}

// Sport keys for The Odds API
export const SPORT_KEY_NBA = 'basketball_nba'
export const SPORT_KEY_MLB = 'baseball_mlb'
export const SPORT_KEY_NFL = 'americanfootball_nfl'

// Prop market keys to fetch
const NBA_PROP_MARKETS = [
  'player_points', 'player_rebounds', 'player_assists',
  'player_threes', 'player_blocks', 'player_steals',
  'player_points_rebounds_assists',
]

const MLB_PROP_MARKETS = [
  'player_hits', 'player_total_bases', 'player_home_runs',
  'player_rbis', 'player_strikeouts', 'pitcher_strikeouts',
  'player_stolen_bases',
]

const NFL_PROP_MARKETS = [
  'player_pass_yds', 'player_pass_tds', 'player_pass_completions',
  'player_rush_yds', 'player_rush_attempts',
  'player_reception_yds', 'player_receptions',
  'player_anytime_td',
]

export function getPropMarkets(sport: string): string[] {
  if (sport === SPORT_KEY_MLB) return MLB_PROP_MARKETS
  if (sport === SPORT_KEY_NFL) return NFL_PROP_MARKETS
  return NBA_PROP_MARKETS
}

// Fetch game odds (spreads, moneyline, totals) from The Odds API
export async function fetchGameOdds(sportKey: string): Promise<GameOddsData[]> {
  const key = getOddsApiKey()
  if (!key) return []

  const url = `${ODDS_BASE}/sports/${sportKey}/odds/?apiKey=${key}&regions=us&markets=spreads,h2h,totals&oddsFormat=american`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
  const data = await res.json()

  return (data || []).map((event: any) => ({
    id: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    commenceTime: event.commence_time,
    bookmakers: (event.bookmakers || []).slice(0, 3).map((bk: any) => {
      const markets = bk.markets || []
      const spreads = markets.find((m: any) => m.key === 'spreads')
      const h2h = markets.find((m: any) => m.key === 'h2h')
      const totals = markets.find((m: any) => m.key === 'totals')
      return {
        name: bk.title,
        spreads: (spreads?.outcomes || []).map((o: any) => ({ team: o.name, point: o.point, price: o.price })),
        moneyline: (h2h?.outcomes || []).map((o: any) => ({ team: o.name, price: o.price })),
        totals: (totals?.outcomes || []).map((o: any) => ({ name: o.name, point: o.point, price: o.price })),
      }
    }),
  }))
}

// Fetch player props for a specific game event
export async function fetchPlayerProps(
  sportKey: string,
  eventId: string,
  markets: string[]
): Promise<PlayerProp[]> {
  const key = getOddsApiKey()
  if (!key) return []

  const marketsParam = markets.join(',')
  const url = `${ODDS_BASE}/sports/${sportKey}/events/${eventId}/odds?apiKey=${key}&regions=us&markets=${marketsParam}&oddsFormat=american`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
  const data = await res.json()

  const props: PlayerProp[] = []
  const seen = new Set<string>()

  for (const bk of data.bookmakers || []) {
    for (const market of bk.markets || []) {
      const outcomes = market.outcomes || []
      // Group outcomes by player name (over/under pairs)
      const playerMap = new Map<string, { over?: any; under?: any }>()
      for (const o of outcomes) {
        const name = o.description || o.name
        if (!playerMap.has(name)) playerMap.set(name, {})
        const entry = playerMap.get(name)!
        if (o.name === 'Over') entry.over = o
        else if (o.name === 'Under') entry.under = o
      }

      for (const [playerName, pair] of playerMap) {
        if (!pair.over || !pair.under) continue
        const dedup = `${playerName}-${market.key}`
        if (seen.has(dedup)) continue
        seen.add(dedup)

        const overOdds = pair.over.price || 0
        const underOdds = pair.under.price || 0

        props.push({
          market: market.key,
          playerName,
          description: getMarketLabel(market.key),
          line: pair.over.point ?? 0,
          overOdds,
          underOdds,
          overConfidence: oddsToConfidence(overOdds),
          underConfidence: oddsToConfidence(underOdds),
          bookmaker: bk.title,
        })
      }
    }
    // Only use first bookmaker to avoid duplicates
    break
  }

  return props
}

// Fetch upcoming events for a sport (to get event IDs for props)
export async function fetchOddsEvents(sportKey: string): Promise<{ id: string; homeTeam: string; awayTeam: string; commenceTime: string }[]> {
  const key = getOddsApiKey()
  if (!key) return []

  const url = `${ODDS_BASE}/sports/${sportKey}/events?apiKey=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Odds API error: ${res.status}`)
  const data = await res.json()

  return (data || []).map((e: any) => ({
    id: e.id,
    homeTeam: e.home_team,
    awayTeam: e.away_team,
    commenceTime: e.commence_time,
  }))
}
