import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchScoreboard,
  searchPlayers,
  fetchGameSummary,
  extractPlayerStats,
  loadGroups,
  saveGroups,
  isGameLive,
  getGameStatusText,
  findPlayerGames,
  type Game,
  type Player,
  type PlayerGroup,
} from '../lib/utils/espnApi'
import '../styles/NBACommandCenter.css'

const REFRESH_INTERVAL = 30_000

export default function NBACommandCenter() {
  const [games, setGames] = useState<Game[]>([])
  const [groups, setGroups] = useState<PlayerGroup[]>(loadGroups)
  const [activeView, setActiveView] = useState<'scoreboard' | 'groups' | 'group-detail'>('scoreboard')
  const [selectedGroup, setSelectedGroup] = useState<PlayerGroup | null>(null)
  const [playerStats, setPlayerStats] = useState<Record<string, Record<string, string>>>({})

  // search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // group creation state
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupPlayers, setNewGroupPlayers] = useState<Player[]>([])

  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshData = useCallback(async () => {
    try {
      const data = await fetchScoreboard()
      setGames(data)
      setLastUpdated(new Date())
    } catch {
      // silent fail on auto-refresh
    } finally {
      setLoading(false)
    }
  }, [])

  // auto-refresh every 30s
  useEffect(() => {
    refreshData()
    intervalRef.current = setInterval(refreshData, REFRESH_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [refreshData])

  // persist groups
  useEffect(() => { saveGroups(groups) }, [groups])

  // load stats when viewing a group detail
  useEffect(() => {
    if (activeView !== 'group-detail' || !selectedGroup || games.length === 0) return

    const loadStats = async () => {
      const statsMap: Record<string, Record<string, string>> = {}
      for (const player of selectedGroup.players) {
        const playerGames = findPlayerGames(games, player)
        for (const game of playerGames) {
          try {
            const summary = await fetchGameSummary(game.id)
            const stats = extractPlayerStats(summary, player.id)
            if (stats) { statsMap[player.id] = stats; break }
          } catch { /* skip */ }
        }
      }
      setPlayerStats(statsMap)
    }
    loadStats()
  }, [activeView, selectedGroup, games])

  // debounced player search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchPlayers(query)
        setSearchResults(results)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 400)
  }, [])

  const addPlayerToNewGroup = (player: Player) => {
    if (newGroupPlayers.find(p => p.id === player.id)) return
    setNewGroupPlayers(prev => [...prev, player])
  }

  const removePlayerFromNewGroup = (playerId: string) => {
    setNewGroupPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  const saveNewGroup = () => {
    if (!newGroupName.trim() || newGroupPlayers.length === 0) return
    const group: PlayerGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      playerIds: newGroupPlayers.map(p => p.id),
      players: newGroupPlayers,
      createdAt: Date.now(),
    }
    setGroups(prev => [...prev, group])
    setNewGroupName('')
    setNewGroupPlayers([])
    setCreatingGroup(false)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const deleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null)
      setActiveView('groups')
    }
  }

  const openGroupDetail = (group: PlayerGroup) => {
    setSelectedGroup(group)
    setPlayerStats({})
    setActiveView('group-detail')
  }

  const manualRefresh = () => {
    setLoading(true)
    refreshData()
  }

  const liveGames = games.filter(isGameLive)
  const scheduledGames = games.filter(g => !isGameLive(g) && !g.status.type.completed)
  const completedGames = games.filter(g => g.status.type.completed)

  return (
    <div className="nba-page">
      <div className="nba-top-bar">
        <Link to="/tools" className="nba-back-link">&larr; Tools</Link>
        <h1 className="nba-title">NBA Command Center</h1>
      </div>

      {/* Refresh bar */}
      <div className="nba-refresh-bar">
        <div className="nba-last-updated">
          {lastUpdated && <>Updated {lastUpdated.toLocaleTimeString()}</>}
          <span className="nba-auto-label">Auto-refresh 30s</span>
        </div>
        <button className="nba-refresh-btn" onClick={manualRefresh} disabled={loading}>
          <span className={`nba-refresh-icon ${loading ? 'spinning' : ''}`}>&#x21bb;</span>
          Refresh
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="nba-tabs">
        <button className={`nba-tab ${activeView === 'scoreboard' ? 'active' : ''}`} onClick={() => setActiveView('scoreboard')}>
          Scoreboard {liveGames.length > 0 && <span className="nba-live-badge">{liveGames.length} LIVE</span>}
        </button>
        <button className={`nba-tab ${activeView === 'groups' || activeView === 'group-detail' ? 'active' : ''}`} onClick={() => setActiveView('groups')}>
          My Groups ({groups.length})
        </button>
      </div>

      {/* ========== SCOREBOARD VIEW ========== */}
      {activeView === 'scoreboard' && (
        <div className="nba-scoreboard">
          {loading && games.length === 0 && (
            <div className="nba-loading">
              <div className="nba-spinner" />
              <p>Loading games...</p>
            </div>
          )}

          {!loading && games.length === 0 && (
            <div className="nba-empty">
              <p>No games scheduled for today.</p>
            </div>
          )}

          {liveGames.length > 0 && (
            <div className="nba-section">
              <h2 className="nba-section-title">
                <span className="nba-pulse-dot" />Live Now
              </h2>
              <div className="nba-games-grid">
                {liveGames.map(game => <GameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}

          {scheduledGames.length > 0 && (
            <div className="nba-section">
              <h2 className="nba-section-title">Upcoming</h2>
              <div className="nba-games-grid">
                {scheduledGames.map(game => <GameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}

          {completedGames.length > 0 && (
            <div className="nba-section">
              <h2 className="nba-section-title">Completed</h2>
              <div className="nba-games-grid">
                {completedGames.map(game => <GameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== GROUPS VIEW ========== */}
      {activeView === 'groups' && (
        <div className="nba-groups">
          <div className="nba-groups-header">
            <h2>Player Groups</h2>
            <button className="nba-create-btn" onClick={() => { setCreatingGroup(true); setShowSearch(true) }}>
              + New Group
            </button>
          </div>

          {creatingGroup && (
            <div className="nba-create-group-panel">
              <div className="nba-create-group-top">
                <input
                  className="nba-group-name-input"
                  placeholder="Group name..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  autoFocus
                />
                <div className="nba-create-actions">
                  <button className="nba-save-btn" onClick={saveNewGroup} disabled={!newGroupName.trim() || newGroupPlayers.length === 0}>
                    Save Group
                  </button>
                  <button className="nba-cancel-btn" onClick={() => { setCreatingGroup(false); setShowSearch(false); setNewGroupPlayers([]); setNewGroupName(''); setSearchQuery(''); setSearchResults([]) }}>
                    Cancel
                  </button>
                </div>
              </div>

              {/* Selected players for new group */}
              {newGroupPlayers.length > 0 && (
                <div className="nba-selected-players">
                  {newGroupPlayers.map(p => (
                    <div key={p.id} className="nba-selected-chip">
                      {p.headshot && <img src={p.headshot} alt="" className="nba-chip-avatar" />}
                      <span>{p.fullName}</span>
                      <button className="nba-chip-remove" onClick={() => removePlayerFromNewGroup(p.id)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Player search */}
              {showSearch && (
                <div className="nba-search-panel">
                  <input
                    className="nba-search-input"
                    placeholder="Search NBA players..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                  />
                  {searching && <div className="nba-search-loading">Searching...</div>}
                  {searchResults.length > 0 && (
                    <div className="nba-search-results">
                      {searchResults.map(player => (
                        <button
                          key={player.id}
                          className={`nba-search-result ${newGroupPlayers.find(p => p.id === player.id) ? 'added' : ''}`}
                          onClick={() => addPlayerToNewGroup(player)}
                          disabled={!!newGroupPlayers.find(p => p.id === player.id)}
                        >
                          <div className="nba-result-avatar">
                            {player.headshot
                              ? <img src={player.headshot} alt="" />
                              : <div className="nba-avatar-placeholder">{player.fullName.charAt(0)}</div>}
                          </div>
                          <div className="nba-result-info">
                            <div className="nba-result-name">{player.fullName}</div>
                            <div className="nba-result-meta">
                              {player.position && <span>{player.position}</span>}
                              {player.team.abbreviation && <span> · {player.team.abbreviation}</span>}
                              {player.jersey && <span> #{player.jersey}</span>}
                            </div>
                          </div>
                          {newGroupPlayers.find(p => p.id === player.id)
                            ? <span className="nba-result-added">Added</span>
                            : <span className="nba-result-add">+ Add</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && searchQuery && searchResults.length === 0 && (
                    <div className="nba-search-empty">No players found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Group list */}
          {groups.length === 0 && !creatingGroup && (
            <div className="nba-empty">
              <p>No groups yet. Create one to start tracking players!</p>
            </div>
          )}

          <div className="nba-groups-list">
            {groups.map(group => (
              <div key={group.id} className="nba-group-card" onClick={() => openGroupDetail(group)}>
                <div className="nba-group-card-top">
                  <h3>{group.name}</h3>
                  <button className="nba-group-delete" onClick={e => { e.stopPropagation(); deleteGroup(group.id) }}>&times;</button>
                </div>
                <div className="nba-group-players-preview">
                  {group.players.slice(0, 5).map(p => (
                    <div key={p.id} className="nba-group-player-mini">
                      {p.headshot
                        ? <img src={p.headshot} alt="" className="nba-mini-avatar" />
                        : <div className="nba-mini-placeholder">{p.fullName.charAt(0)}</div>}
                    </div>
                  ))}
                  {group.players.length > 5 && (
                    <div className="nba-group-more">+{group.players.length - 5}</div>
                  )}
                </div>
                <div className="nba-group-count">{group.players.length} player{group.players.length !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== GROUP DETAIL VIEW ========== */}
      {activeView === 'group-detail' && selectedGroup && (
        <div className="nba-group-detail">
          <button className="nba-detail-back" onClick={() => setActiveView('groups')}>&larr; Back to Groups</button>
          <h2 className="nba-detail-title">{selectedGroup.name}</h2>

          <div className="nba-detail-players">
            {selectedGroup.players.map(player => {
              const playerGames = findPlayerGames(games, player)
              const liveGame = playerGames.find(isGameLive)
              const nextGame = playerGames.find(g => !isGameLive(g) && !g.status.type.completed)
              const stats = playerStats[player.id]

              return (
                <div key={player.id} className={`nba-detail-card ${liveGame ? 'is-live' : ''}`}>
                  <div className="nba-detail-card-header">
                    <div className="nba-detail-player-info">
                      <div className="nba-detail-avatar">
                        {player.headshot
                          ? <img src={player.headshot} alt="" />
                          : <div className="nba-avatar-placeholder-lg">{player.fullName.charAt(0)}</div>}
                      </div>
                      <div>
                        <div className="nba-detail-player-name">{player.fullName}</div>
                        <div className="nba-detail-player-meta">
                          {player.position} · {player.team.abbreviation}
                          {player.jersey && ` #${player.jersey}`}
                        </div>
                      </div>
                    </div>

                    {liveGame && (
                      <div className="nba-live-indicator">
                        <span className="nba-pulse-dot" />
                        <span className="nba-live-text">LIVE</span>
                        <span className="nba-live-clock">{getGameStatusText(liveGame)}</span>
                      </div>
                    )}
                  </div>

                  {/* Live game score */}
                  {liveGame && (
                    <div className="nba-detail-game-score">
                      <div className="nba-score-team">
                        {liveGame.awayTeam.logo && <img src={liveGame.awayTeam.logo} alt="" className="nba-score-logo" />}
                        <span className="nba-score-abbr">{liveGame.awayTeam.abbreviation}</span>
                        <span className="nba-score-val">{liveGame.awayTeam.score}</span>
                      </div>
                      <span className="nba-score-vs">vs</span>
                      <div className="nba-score-team">
                        {liveGame.homeTeam.logo && <img src={liveGame.homeTeam.logo} alt="" className="nba-score-logo" />}
                        <span className="nba-score-abbr">{liveGame.homeTeam.abbreviation}</span>
                        <span className="nba-score-val">{liveGame.homeTeam.score}</span>
                      </div>
                    </div>
                  )}

                  {/* Player stat line */}
                  {stats && (
                    <div className="nba-detail-stats">
                      <h4>Stat Line</h4>
                      <div className="nba-stats-grid">
                        {Object.entries(stats).map(([label, value]) => (
                          <div key={label} className="nba-stat-item">
                            <span className="nba-stat-label">{label}</span>
                            <span className="nba-stat-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next game */}
                  {!liveGame && nextGame && (
                    <div className="nba-detail-next-game">
                      <h4>Next Game</h4>
                      <div className="nba-next-matchup">
                        <span>{nextGame.awayTeam.abbreviation}</span>
                        <span className="nba-next-at">@</span>
                        <span>{nextGame.homeTeam.abbreviation}</span>
                        <span className="nba-next-time">{getGameStatusText(nextGame)}</span>
                      </div>
                    </div>
                  )}

                  {!liveGame && !nextGame && !stats && (
                    <div className="nba-detail-no-game">No game data available today</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function GameCard({ game }: { game: Game }) {
  const live = isGameLive(game)
  return (
    <div className={`nba-game-card ${live ? 'is-live' : ''} ${game.status.type.completed ? 'is-final' : ''}`}>
      {live && (
        <div className="nba-game-live-bar">
          <span className="nba-pulse-dot" />
          <span>{getGameStatusText(game)}</span>
        </div>
      )}
      {!live && (
        <div className="nba-game-status-bar">{getGameStatusText(game)}</div>
      )}
      <div className="nba-game-teams">
        <div className="nba-game-team">
          {game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="nba-team-logo" />}
          <div className="nba-team-info">
            <span className="nba-team-name">{game.awayTeam.abbreviation}</span>
            <span className="nba-team-record">{game.awayTeam.record}</span>
          </div>
          <span className="nba-team-score">{game.awayTeam.score}</span>
        </div>
        <div className="nba-game-team">
          {game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="nba-team-logo" />}
          <div className="nba-team-info">
            <span className="nba-team-name">{game.homeTeam.abbreviation}</span>
            <span className="nba-team-record">{game.homeTeam.record}</span>
          </div>
          <span className="nba-team-score">{game.homeTeam.score}</span>
        </div>
      </div>
    </div>
  )
}
