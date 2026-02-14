import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import StarField from '../components/StarField'
import Navbar from '../components/Navbar'
import {
  fetchMlbScoreboard,
  searchMlbPlayers,
  fetchMlbGameSummary,
  extractMlbPlayerStats,
  loadMlbGroups,
  saveMlbGroups,
  isMlbGameLive,
  getMlbGameStatusText,
  findMlbPlayerGames,
  type MlbGame,
  type MlbPlayer,
  type MlbPlayerGroup,
} from '../lib/utils/espnMlbApi'
import {
  getOddsApiKey,
  setOddsApiKey,
  fetchPlayerProps,
  fetchOddsEvents,
  oddsToConfidence,
  getPropMarkets,
  SPORT_KEY_MLB,
  type PlayerProp,
} from '../lib/utils/oddsApi'
import '../styles/MLBCommandCenter.css'

const REFRESH_INTERVAL = 30_000

export default function MLBCommandCenter() {
  const [games, setGames] = useState<MlbGame[]>([])
  const [groups, setGroups] = useState<MlbPlayerGroup[]>(loadMlbGroups)
  const [activeView, setActiveView] = useState<'scoreboard' | 'groups' | 'group-detail'>('scoreboard')
  const [selectedGroup, setSelectedGroup] = useState<MlbPlayerGroup | null>(null)
  const [playerStats, setPlayerStats] = useState<Record<string, Record<string, string>>>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MlbPlayer[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupPlayers, setNewGroupPlayers] = useState<MlbPlayer[]>([])

  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [propsModalPlayer, setPropsModalPlayer] = useState<MlbPlayer | null>(null)
  const [playerPropsData, setPlayerPropsData] = useState<PlayerProp[]>([])
  const [propsLoading, setPropsLoading] = useState(false)
  const [propsError, setPropsError] = useState('')

  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyDraft, setApiKeyDraft] = useState(getOddsApiKey())
  const [oddsEvents, setOddsEvents] = useState<{ id: string; homeTeam: string; awayTeam: string }[]>([])

  const refreshData = useCallback(async () => {
    try {
      const data = await fetchMlbScoreboard()
      setGames(data)
      setLastUpdated(new Date())
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
    intervalRef.current = setInterval(refreshData, REFRESH_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [refreshData])

  useEffect(() => {
    if (!getOddsApiKey()) return
    fetchOddsEvents(SPORT_KEY_MLB)
      .then(setOddsEvents)
      .catch(() => {})
  }, [])

  useEffect(() => { saveMlbGroups(groups) }, [groups])

  useEffect(() => {
    if (activeView !== 'group-detail' || !selectedGroup || games.length === 0) return
    const loadStats = async () => {
      const statsMap: Record<string, Record<string, string>> = {}
      for (const player of selectedGroup.players) {
        const playerGames = findMlbPlayerGames(games, player)
        for (const game of playerGames) {
          try {
            const summary = await fetchMlbGameSummary(game.id)
            const stats = extractMlbPlayerStats(summary, player.id)
            if (stats) { statsMap[player.id] = stats; break }
          } catch { /* skip */ }
        }
      }
      setPlayerStats(statsMap)
    }
    loadStats()
  }, [activeView, selectedGroup, games])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchMlbPlayers(query)
        setSearchResults(results)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 400)
  }, [])

  const addPlayerToNewGroup = (player: MlbPlayer) => {
    if (newGroupPlayers.find(p => p.id === player.id)) return
    setNewGroupPlayers(prev => [...prev, player])
  }

  const removePlayerFromNewGroup = (playerId: string) => {
    setNewGroupPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  const saveNewGroup = () => {
    if (!newGroupName.trim() || newGroupPlayers.length === 0) return
    const group: MlbPlayerGroup = {
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

  const openGroupDetail = (group: MlbPlayerGroup) => {
    setSelectedGroup(group)
    setPlayerStats({})
    setActiveView('group-detail')
  }

  const manualRefresh = () => {
    setLoading(true)
    refreshData()
  }

  const saveApiKey = () => {
    setOddsApiKey(apiKeyDraft)
    setShowApiKeyInput(false)
    fetchOddsEvents(SPORT_KEY_MLB)
      .then(setOddsEvents)
      .catch(() => {})
  }

  const openPlayerProps = async (player: MlbPlayer) => {
    setPropsModalPlayer(player)
    setPlayerPropsData([])
    setPropsError('')

    if (!getOddsApiKey()) {
      setPropsError('Set your Odds API key to view player props.')
      return
    }

    setPropsLoading(true)
    try {
      const playerGames = findMlbPlayerGames(games, player)
      if (playerGames.length === 0) {
        setPropsError('No game found for this player today.')
        setPropsLoading(false)
        return
      }

      const game = playerGames[0]
      const oddsEvent = oddsEvents.find(e =>
        game.homeTeam.name.includes(e.homeTeam.split(' ').pop() || '') ||
        e.homeTeam.includes(game.homeTeam.name.split(' ').pop() || '') ||
        game.awayTeam.name.includes(e.awayTeam.split(' ').pop() || '') ||
        e.awayTeam.includes(game.awayTeam.name.split(' ').pop() || '')
      )

      if (!oddsEvent) {
        setPropsError('Could not match game to odds provider. Props may not be available yet.')
        setPropsLoading(false)
        return
      }

      const props = await fetchPlayerProps(SPORT_KEY_MLB, oddsEvent.id, getPropMarkets(SPORT_KEY_MLB))
      const playerName = player.fullName.toLowerCase()
      const filtered = props.filter(p => p.playerName.toLowerCase().includes(playerName) || playerName.includes(p.playerName.toLowerCase()))

      if (filtered.length === 0) {
        setPropsError(`No props available for ${player.fullName}.`)
      }
      setPlayerPropsData(filtered)
    } catch {
      setPropsError('Failed to load player props.')
    } finally {
      setPropsLoading(false)
    }
  }

  const liveGames = games.filter(isMlbGameLive)
  const scheduledGames = games.filter(g => !isMlbGameLive(g) && !g.status.type.completed)
  const completedGames = games.filter(g => g.status.type.completed)
  const hasApiKey = !!getOddsApiKey()

  return (
    <>
    <SEO title="MLB Command Center" description="Live MLB scores, odds, player props, and group stats" />
    <StarField shootingStars nebulaOrbs />
    <Navbar />
    <div className="mlb-page">
      <div className="mlb-top-bar">
        <Link to="/tools" className="mlb-back-link">&larr; Tools</Link>
        <h1 className="mlb-title">MLB Command Center</h1>
      </div>

      <div className="mlb-refresh-bar">
        <div className="mlb-last-updated">
          {lastUpdated && <>Updated {lastUpdated.toLocaleTimeString()}</>}
          <span className="mlb-auto-label">Auto-refresh 30s</span>
        </div>
        <div className="mlb-refresh-actions">
          <button className="mlb-api-key-btn" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
            {hasApiKey ? '🔑 API Key Set' : '🔑 Set Odds API Key'}
          </button>
          <button className="mlb-refresh-btn" onClick={manualRefresh} disabled={loading}>
            <span className={`mlb-refresh-icon ${loading ? 'spinning' : ''}`}>&#x21bb;</span>
            Refresh
          </button>
        </div>
      </div>

      {showApiKeyInput && (
        <div className="mlb-api-key-panel">
          <p className="mlb-api-key-info">
            Enter your <a href="https://the-odds-api.com" target="_blank" rel="noreferrer">The Odds API</a> key for player props and betting odds. Free tier: 500 requests/month.
          </p>
          <div className="mlb-api-key-row">
            <input
              type="password"
              className="mlb-api-key-input"
              placeholder="Paste API key..."
              value={apiKeyDraft}
              onChange={e => setApiKeyDraft(e.target.value)}
            />
            <button className="mlb-save-btn" onClick={saveApiKey}>Save</button>
            <button className="mlb-cancel-btn" onClick={() => setShowApiKeyInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="mlb-tabs">
        <button className={`mlb-tab ${activeView === 'scoreboard' ? 'active' : ''}`} onClick={() => setActiveView('scoreboard')}>
          Scoreboard {liveGames.length > 0 && <span className="mlb-live-badge">{liveGames.length} LIVE</span>}
        </button>
        <button className={`mlb-tab ${activeView === 'groups' || activeView === 'group-detail' ? 'active' : ''}`} onClick={() => setActiveView('groups')}>
          My Groups ({groups.length})
        </button>
      </div>

      {/* ========== SCOREBOARD VIEW ========== */}
      {activeView === 'scoreboard' && (
        <div className="mlb-scoreboard">
          {loading && games.length === 0 && (
            <div className="mlb-games-grid">
              {[1,2,3,4].map(i => (
                <div key={i} className="mlb-game-card mlb-skeleton-card" aria-hidden="true">
                  <div className="mlb-skeleton-bar" />
                  <div style={{ padding: '12px 14px' }}>
                    <div className="mlb-skeleton-team"><div className="mlb-skeleton-circle" /><div className="mlb-skeleton-line" /><div className="mlb-skeleton-score" /></div>
                    <div className="mlb-skeleton-team"><div className="mlb-skeleton-circle" /><div className="mlb-skeleton-line" /><div className="mlb-skeleton-score" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && games.length === 0 && (
            <div className="mlb-empty">
              <p>No games scheduled for today.</p>
            </div>
          )}

          {liveGames.length > 0 && (
            <div className="mlb-section">
              <h2 className="mlb-section-title">
                <span className="mlb-pulse-dot" />Live Now
              </h2>
              <div className="mlb-games-grid">
                {liveGames.map(game => <MlbGameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}

          {scheduledGames.length > 0 && (
            <div className="mlb-section">
              <h2 className="mlb-section-title">Upcoming</h2>
              <div className="mlb-games-grid">
                {scheduledGames.map(game => <MlbGameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}

          {completedGames.length > 0 && (
            <div className="mlb-section">
              <h2 className="mlb-section-title">Completed</h2>
              <div className="mlb-games-grid">
                {completedGames.map(game => <MlbGameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== GROUPS VIEW ========== */}
      {activeView === 'groups' && (
        <div className="mlb-groups">
          <div className="mlb-groups-header">
            <h2>Player Groups</h2>
            <button className="mlb-create-btn" onClick={() => { setCreatingGroup(true); setShowSearch(true) }}>
              + New Group
            </button>
          </div>

          {creatingGroup && (
            <div className="mlb-create-group-panel">
              <div className="mlb-create-group-top">
                <input
                  className="mlb-group-name-input"
                  placeholder="Group name..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  autoFocus
                />
                <div className="mlb-create-actions">
                  <button className="mlb-save-btn" onClick={saveNewGroup} disabled={!newGroupName.trim() || newGroupPlayers.length === 0}>
                    Save Group
                  </button>
                  <button className="mlb-cancel-btn" onClick={() => { setCreatingGroup(false); setShowSearch(false); setNewGroupPlayers([]); setNewGroupName(''); setSearchQuery(''); setSearchResults([]) }}>
                    Cancel
                  </button>
                </div>
              </div>

              {newGroupPlayers.length > 0 && (
                <div className="mlb-selected-players">
                  {newGroupPlayers.map(p => (
                    <div key={p.id} className="mlb-selected-chip">
                      {p.headshot && <img src={p.headshot} alt="" className="mlb-chip-avatar" />}
                      <span>{p.fullName}</span>
                      <button className="mlb-chip-remove" onClick={() => removePlayerFromNewGroup(p.id)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {showSearch && (
                <div className="mlb-search-panel">
                  <input
                    className="mlb-search-input"
                    placeholder="Search MLB players..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                  />
                  {searching && <div className="mlb-search-loading">Searching...</div>}
                  {searchResults.length > 0 && (
                    <div className="mlb-search-results">
                      {searchResults.map(player => (
                        <button
                          key={player.id}
                          className={`mlb-search-result ${newGroupPlayers.find(p => p.id === player.id) ? 'added' : ''}`}
                          onClick={() => addPlayerToNewGroup(player)}
                          disabled={!!newGroupPlayers.find(p => p.id === player.id)}
                        >
                          <div className="mlb-result-avatar">
                            {player.headshot
                              ? <img src={player.headshot} alt="" />
                              : <div className="mlb-avatar-placeholder">{player.fullName.charAt(0)}</div>}
                          </div>
                          <div className="mlb-result-info">
                            <div className="mlb-result-name">{player.fullName}</div>
                            <div className="mlb-result-meta">
                              {player.position && <span>{player.position}</span>}
                              {player.team.abbreviation && <span> · {player.team.abbreviation}</span>}
                              {player.jersey && <span> #{player.jersey}</span>}
                            </div>
                          </div>
                          {newGroupPlayers.find(p => p.id === player.id)
                            ? <span className="mlb-result-added">Added</span>
                            : <span className="mlb-result-add">+ Add</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && searchQuery && searchResults.length === 0 && (
                    <div className="mlb-search-empty">No players found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          )}

          {groups.length === 0 && !creatingGroup && (
            <div className="mlb-empty">
              <p>No groups yet. Create one to start tracking players!</p>
            </div>
          )}

          <div className="mlb-groups-list">
            {groups.map(group => (
              <div key={group.id} className="mlb-group-card" onClick={() => openGroupDetail(group)}>
                <div className="mlb-group-card-top">
                  <h3>{group.name}</h3>
                  <button className="mlb-group-delete" onClick={e => { e.stopPropagation(); deleteGroup(group.id) }}>&times;</button>
                </div>
                <div className="mlb-group-players-preview">
                  {group.players.slice(0, 5).map(p => (
                    <div key={p.id} className="mlb-group-player-mini">
                      {p.headshot
                        ? <img src={p.headshot} alt="" className="mlb-mini-avatar" />
                        : <div className="mlb-mini-placeholder">{p.fullName.charAt(0)}</div>}
                    </div>
                  ))}
                  {group.players.length > 5 && (
                    <div className="mlb-group-more">+{group.players.length - 5}</div>
                  )}
                </div>
                <div className="mlb-group-count">{group.players.length} player{group.players.length !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== GROUP DETAIL VIEW ========== */}
      {activeView === 'group-detail' && selectedGroup && (
        <div className="mlb-group-detail">
          <button className="mlb-detail-back" onClick={() => setActiveView('groups')}>&larr; Back to Groups</button>
          <h2 className="mlb-detail-title">{selectedGroup.name}</h2>

          <div className="mlb-detail-players">
            {selectedGroup.players.map(player => {
              const playerGames = findMlbPlayerGames(games, player)
              const liveGame = playerGames.find(isMlbGameLive)
              const nextGame = playerGames.find(g => !isMlbGameLive(g) && !g.status.type.completed)
              const stats = playerStats[player.id]
              const displayGame = liveGame || nextGame || playerGames.find(g => g.status.type.completed)

              return (
                <div key={player.id} className={`mlb-detail-card ${liveGame ? 'is-live' : ''}`}>
                  <div className="mlb-detail-card-header">
                    <div className="mlb-detail-player-info" onClick={() => openPlayerProps(player)} style={{ cursor: 'pointer' }}>
                      <div className="mlb-detail-avatar">
                        {player.headshot
                          ? <img src={player.headshot} alt="" />
                          : <div className="mlb-avatar-placeholder-lg">{player.fullName.charAt(0)}</div>}
                      </div>
                      <div>
                        <div className="mlb-detail-player-name">
                          {player.fullName}
                          <span className="mlb-props-hint">View Props →</span>
                        </div>
                        <div className="mlb-detail-player-meta">
                          {player.position} · {player.team.abbreviation}
                          {player.jersey && ` #${player.jersey}`}
                        </div>
                      </div>
                    </div>

                    {liveGame && (
                      <div className="mlb-live-indicator">
                        <span className="mlb-pulse-dot" />
                        <span className="mlb-live-text">LIVE</span>
                        <span className="mlb-live-clock">{getMlbGameStatusText(liveGame)}</span>
                      </div>
                    )}
                  </div>

                  {liveGame && (
                    <div className="mlb-detail-game-score">
                      <div className="mlb-score-team">
                        {liveGame.awayTeam.logo && <img src={liveGame.awayTeam.logo} alt="" className="mlb-score-logo" />}
                        <span className="mlb-score-abbr">{liveGame.awayTeam.abbreviation}</span>
                        <span className="mlb-score-val">{liveGame.awayTeam.score}</span>
                      </div>
                      <span className="mlb-score-vs">vs</span>
                      <div className="mlb-score-team">
                        {liveGame.homeTeam.logo && <img src={liveGame.homeTeam.logo} alt="" className="mlb-score-logo" />}
                        <span className="mlb-score-abbr">{liveGame.homeTeam.abbreviation}</span>
                        <span className="mlb-score-val">{liveGame.homeTeam.score}</span>
                      </div>
                    </div>
                  )}

                  {displayGame?.odds && (
                    <MlbOddsDisplay odds={displayGame.odds} homeAbbr={displayGame.homeTeam.abbreviation} awayAbbr={displayGame.awayTeam.abbreviation} />
                  )}

                  {stats && (
                    <div className="mlb-detail-stats">
                      <h4>Stat Line</h4>
                      <div className="mlb-stats-grid">
                        {Object.entries(stats).map(([label, value]) => (
                          <div key={label} className="mlb-stat-item">
                            <span className="mlb-stat-label">{label}</span>
                            <span className="mlb-stat-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!liveGame && nextGame && (
                    <div className="mlb-detail-next-game">
                      <h4>Next Game</h4>
                      <div className="mlb-next-matchup">
                        <span>{nextGame.awayTeam.abbreviation}</span>
                        <span className="mlb-next-at">@</span>
                        <span>{nextGame.homeTeam.abbreviation}</span>
                        <span className="mlb-next-time">{getMlbGameStatusText(nextGame)}</span>
                      </div>
                    </div>
                  )}

                  {!liveGame && !nextGame && !stats && (
                    <div className="mlb-detail-no-game">No game data available today</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========== PLAYER PROPS MODAL ========== */}
      {propsModalPlayer && (
        <div className="mlb-modal-overlay" onClick={() => setPropsModalPlayer(null)}>
          <div className="mlb-modal" onClick={e => e.stopPropagation()}>
            <div className="mlb-modal-header">
              <div className="mlb-modal-player-info">
                {propsModalPlayer.headshot && <img src={propsModalPlayer.headshot} alt="" className="mlb-modal-avatar" />}
                <div>
                  <div className="mlb-modal-player-name">{propsModalPlayer.fullName}</div>
                  <div className="mlb-modal-player-meta">
                    {propsModalPlayer.position} · {propsModalPlayer.team.abbreviation}
                    {propsModalPlayer.jersey && ` #${propsModalPlayer.jersey}`}
                  </div>
                </div>
              </div>
              <button className="mlb-modal-close" onClick={() => setPropsModalPlayer(null)}>&times;</button>
            </div>

            <h3 className="mlb-modal-section-title">Player Props</h3>

            {propsLoading && (
              <div className="mlb-loading">
                <div className="mlb-spinner" />
                <p>Loading props...</p>
              </div>
            )}

            {propsError && (
              <div className="mlb-props-error">
                <p>{propsError}</p>
                {!hasApiKey && (
                  <button className="mlb-save-btn" onClick={() => { setPropsModalPlayer(null); setShowApiKeyInput(true) }}>
                    Set API Key
                  </button>
                )}
              </div>
            )}

            {!propsLoading && playerPropsData.length > 0 && (
              <div className="mlb-props-list">
                {playerPropsData.map((prop, i) => (
                  <div key={i} className="mlb-prop-card">
                    <div className="mlb-prop-header">
                      <span className="mlb-prop-market">{prop.description}</span>
                      <span className="mlb-prop-line">Line: {prop.line}</span>
                    </div>
                    <div className="mlb-prop-odds-row">
                      <div className={`mlb-prop-side ${prop.overConfidence >= 50 ? 'favored' : ''}`}>
                        <span className="mlb-prop-direction">OVER</span>
                        <span className="mlb-prop-odds-value">{prop.overOdds > 0 ? '+' : ''}{prop.overOdds}</span>
                        <div className="mlb-confidence-bar">
                          <div className="mlb-confidence-fill over" style={{ width: `${prop.overConfidence}%` }} />
                        </div>
                        <span className="mlb-confidence-pct">{prop.overConfidence}%</span>
                      </div>
                      <div className={`mlb-prop-side ${prop.underConfidence >= 50 ? 'favored' : ''}`}>
                        <span className="mlb-prop-direction">UNDER</span>
                        <span className="mlb-prop-odds-value">{prop.underOdds > 0 ? '+' : ''}{prop.underOdds}</span>
                        <div className="mlb-confidence-bar">
                          <div className="mlb-confidence-fill under" style={{ width: `${prop.underConfidence}%` }} />
                        </div>
                        <span className="mlb-confidence-pct">{prop.underConfidence}%</span>
                      </div>
                    </div>
                    <div className="mlb-prop-bookmaker">via {prop.bookmaker}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  )
}

function MlbOddsDisplay({ odds, homeAbbr, awayAbbr }: { odds: MlbGame['odds']; homeAbbr: string; awayAbbr: string }) {
  if (!odds) return null
  return (
    <div className="mlb-odds-display">
      <h4>Odds</h4>
      <div className="mlb-odds-grid">
        {odds.spread && (
          <div className="mlb-odds-item">
            <span className="mlb-odds-label">Spread</span>
            <span className="mlb-odds-value">{odds.spread.team} {Number(odds.spread.line) > 0 ? '+' : ''}{odds.spread.line}</span>
          </div>
        )}
        {odds.moneyLine && (
          <>
            <div className="mlb-odds-item">
              <span className="mlb-odds-label">{awayAbbr} ML</span>
              <span className="mlb-odds-value">
                {Number(odds.moneyLine.away) > 0 ? '+' : ''}{odds.moneyLine.away}
                <span className="mlb-odds-conf">{oddsToConfidence(Number(odds.moneyLine.away))}%</span>
              </span>
            </div>
            <div className="mlb-odds-item">
              <span className="mlb-odds-label">{homeAbbr} ML</span>
              <span className="mlb-odds-value">
                {Number(odds.moneyLine.home) > 0 ? '+' : ''}{odds.moneyLine.home}
                <span className="mlb-odds-conf">{oddsToConfidence(Number(odds.moneyLine.home))}%</span>
              </span>
            </div>
          </>
        )}
        {odds.overUnder && (
          <div className="mlb-odds-item">
            <span className="mlb-odds-label">O/U</span>
            <span className="mlb-odds-value">{odds.overUnder}</span>
          </div>
        )}
      </div>
      {odds.provider && <div className="mlb-odds-provider">via {odds.provider}</div>}
    </div>
  )
}

function MlbGameCard({ game }: { game: MlbGame }) {
  const live = isMlbGameLive(game)
  return (
    <div className={`mlb-game-card ${live ? 'is-live' : ''} ${game.status.type.completed ? 'is-final' : ''}`}>
      {live && (
        <div className="mlb-game-live-bar">
          <span className="mlb-pulse-dot" />
          <span>{getMlbGameStatusText(game)}</span>
        </div>
      )}
      {!live && (
        <div className="mlb-game-status-bar">{getMlbGameStatusText(game)}</div>
      )}
      <div className="mlb-game-teams">
        <div className="mlb-game-team">
          {game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="mlb-team-logo" />}
          <div className="mlb-team-info">
            <span className="mlb-team-name">{game.awayTeam.abbreviation}</span>
            <span className="mlb-team-record">{game.awayTeam.record}</span>
          </div>
          <span className="mlb-team-score">{game.awayTeam.score}</span>
        </div>
        <div className="mlb-game-team">
          {game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="mlb-team-logo" />}
          <div className="mlb-team-info">
            <span className="mlb-team-name">{game.homeTeam.abbreviation}</span>
            <span className="mlb-team-record">{game.homeTeam.record}</span>
          </div>
          <span className="mlb-team-score">{game.homeTeam.score}</span>
        </div>
      </div>
      {game.odds && (
        <div className="mlb-game-odds-bar">
          {game.odds.spread && (
            <span className="mlb-game-odds-chip">
              {game.odds.spread.team} {Number(game.odds.spread.line) > 0 ? '+' : ''}{game.odds.spread.line}
            </span>
          )}
          {game.odds.moneyLine && (
            <span className="mlb-game-odds-chip">
              ML: {Number(game.odds.moneyLine.away) > 0 ? '+' : ''}{game.odds.moneyLine.away} / {Number(game.odds.moneyLine.home) > 0 ? '+' : ''}{game.odds.moneyLine.home}
            </span>
          )}
          {game.odds.overUnder && (
            <span className="mlb-game-odds-chip">O/U {game.odds.overUnder}</span>
          )}
        </div>
      )}
    </div>
  )
}
