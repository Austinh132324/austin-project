import { useState } from 'react'
import { getLeaderboard, getGlobalLeaderboard, LeaderboardEntry } from '../lib/utils/leaderboard'
import '../styles/Leaderboard.css'

interface LeaderboardProps {
  game: string
}

export default function Leaderboard({ game }: LeaderboardProps) {
  const [view, setView] = useState<'game' | 'global'>('game')
  const entries: LeaderboardEntry[] = getLeaderboard(game)
  const globalEntries = getGlobalLeaderboard()

  if (entries.length === 0 && globalEntries.length === 0) {
    return (
      <div className="lb-empty">No scores yet. Play a game to get on the board!</div>
    )
  }

  return (
    <div className="lb-container">
      <div className="lb-header">
        <h3 className="lb-title">Leaderboard</h3>
        <div className="lb-tabs">
          <button className={`lb-tab ${view === 'game' ? 'active' : ''}`} onClick={() => setView('game')}>
            This Game
          </button>
          <button className={`lb-tab ${view === 'global' ? 'active' : ''}`} onClick={() => setView('global')}>
            Global
          </button>
        </div>
      </div>

      {view === 'game' && (
        <div className="lb-list">
          {entries.length === 0 && <div className="lb-empty-small">No scores for this game yet.</div>}
          {entries.map((entry, i) => (
            <div key={i} className={`lb-entry${i < 3 ? ' top' : ''}`}>
              <span className="lb-rank">{i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`}</span>
              <span className="lb-name">{entry.name}</span>
              {entry.streak && entry.streak > 1 && (
                <span className="lb-streak" title={`${entry.streak} day streak`}>{entry.streak}d</span>
              )}
              <span className="lb-score">{entry.score}</span>
              <span className="lb-date">{entry.date}</span>
            </div>
          ))}
        </div>
      )}

      {view === 'global' && (
        <div className="lb-list">
          {globalEntries.length === 0 && <div className="lb-empty-small">No global data yet.</div>}
          {globalEntries.map((entry, i) => (
            <div key={i} className={`lb-entry${i < 3 ? ' top' : ''}`}>
              <span className="lb-rank">{i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`}</span>
              <span className="lb-name">{entry.name}</span>
              {entry.bestStreak > 1 && (
                <span className="lb-streak" title={`Best streak: ${entry.bestStreak} days`}>{entry.bestStreak}d</span>
              )}
              <span className="lb-score">{entry.totalScore}</span>
              <span className="lb-date">{entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
