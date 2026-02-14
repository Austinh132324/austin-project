export interface LeaderboardEntry {
  name: string
  score: number
  date: string
  streak?: number
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
  const streak = getPlayerStreak(game, name) + 1
  entries.push({ name, score, date: new Date().toLocaleDateString(), streak })
  entries.sort((a, b) => b.score - a.score)
  const trimmed = entries.slice(0, MAX_ENTRIES)
  localStorage.setItem(getKey(game), JSON.stringify(trimmed))
  updatePlayerStreak(game, name, streak)
  return trimmed
}

export function isHighScore(game: string, score: number): boolean {
  const entries = getLeaderboard(game)
  if (entries.length < MAX_ENTRIES) return score > 0
  return score > entries[entries.length - 1].score
}

// Global leaderboard across all games
export function getGlobalLeaderboard(): { name: string; totalScore: number; gamesPlayed: number; bestStreak: number }[] {
  const games = ['snake', 'tetris', 'checkers', 'tictactoe']
  const playerMap: Record<string, { totalScore: number; gamesPlayed: number; bestStreak: number }> = {}

  for (const game of games) {
    const entries = getLeaderboard(game)
    for (const entry of entries) {
      if (!playerMap[entry.name]) {
        playerMap[entry.name] = { totalScore: 0, gamesPlayed: 0, bestStreak: 0 }
      }
      playerMap[entry.name].totalScore += entry.score
      playerMap[entry.name].gamesPlayed++
      if ((entry.streak || 0) > playerMap[entry.name].bestStreak) {
        playerMap[entry.name].bestStreak = entry.streak || 0
      }
    }
  }

  return Object.entries(playerMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, MAX_ENTRIES)
}

// Streak tracking
function getStreakKey(game: string, name: string): string {
  return `streak-${game}-${name}`
}

function getPlayerStreak(game: string, name: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(getStreakKey(game, name)) || '{}')
    const today = new Date().toLocaleDateString()
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()
    if (data.lastDate === today || data.lastDate === yesterday) {
      return data.streak || 0
    }
    return 0
  } catch { return 0 }
}

function updatePlayerStreak(game: string, name: string, streak: number) {
  localStorage.setItem(getStreakKey(game, name), JSON.stringify({
    streak,
    lastDate: new Date().toLocaleDateString(),
  }))
}

// Player profile
export function getPlayerProfile(name: string): { games: Record<string, { highScore: number; plays: number }>; totalScore: number; bestStreak: number } {
  const games = ['snake', 'tetris', 'checkers', 'tictactoe']
  const profile: { games: Record<string, { highScore: number; plays: number }>; totalScore: number; bestStreak: number } = {
    games: {},
    totalScore: 0,
    bestStreak: 0,
  }

  for (const game of games) {
    const entries = getLeaderboard(game).filter(e => e.name === name)
    if (entries.length > 0) {
      const highScore = Math.max(...entries.map(e => e.score))
      const bestStreak = Math.max(...entries.map(e => e.streak || 0))
      profile.games[game] = { highScore, plays: entries.length }
      profile.totalScore += highScore
      if (bestStreak > profile.bestStreak) profile.bestStreak = bestStreak
    }
  }

  return profile
}
