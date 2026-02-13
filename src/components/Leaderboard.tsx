import { getLeaderboard, LeaderboardEntry } from '../lib/utils/leaderboard'
import '../styles/Leaderboard.css'

interface LeaderboardProps {
  game: string
}

export default function Leaderboard({ game }: LeaderboardProps) {
  const entries: LeaderboardEntry[] = getLeaderboard(game)

  if (entries.length === 0) {
    return (
      <div className="lb-empty">No scores yet. Play a game to get on the board!</div>
    )
  }

  return (
    <div className="lb-container">
      <h3 className="lb-title">Leaderboard</h3>
      <div className="lb-list">
        {entries.map((entry, i) => (
          <div key={i} className={`lb-entry${i < 3 ? ' top' : ''}`}>
            <span className="lb-rank">{i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`}</span>
            <span className="lb-name">{entry.name}</span>
            <span className="lb-score">{entry.score}</span>
            <span className="lb-date">{entry.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
