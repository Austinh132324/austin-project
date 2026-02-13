export interface LeaderboardEntry {
  name: string
  score: number
  date: string
}

const MAX_ENTRIES = 10

function getKey(game: string): string {
  return `leaderboard-${game}`
}

export function getLeaderboard(game: string): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(getKey(game)) || '[]')
  } catch { return [] }
}

export function addScore(game: string, name: string, score: number): LeaderboardEntry[] {
  const entries = getLeaderboard(game)
  entries.push({ name, score, date: new Date().toLocaleDateString() })
  entries.sort((a, b) => b.score - a.score)
  const trimmed = entries.slice(0, MAX_ENTRIES)
  localStorage.setItem(getKey(game), JSON.stringify(trimmed))
  return trimmed
}

export function isHighScore(game: string, score: number): boolean {
  const entries = getLeaderboard(game)
  if (entries.length < MAX_ENTRIES) return score > 0
  return score > entries[entries.length - 1].score
}
