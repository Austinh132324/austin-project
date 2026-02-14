import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import StarField from '../components/StarField'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import {
  fetchNflScoreboard,
  searchNflPlayers,
  fetchNflGameSummary,
  extractNflPlayerStats,
  loadNflGroups,
  saveNflGroups,
  isNflGameLive,
  getNflGameStatusText,
  findNflPlayerGames,
  type NflGame,
  type NflPlayer,
  type NflPlayerGroup,
} from '../lib/utils/espnNflApi'
import {
  getOddsApiKey,
  setOddsApiKey,
  fetchPlayerProps,
  fetchOddsEvents,
  oddsToConfidence,
  getPropMarkets,
  type PlayerProp,
} from '../lib/utils/oddsApi'
import '../styles/NFLCommandCenter.css'

const REFRESH_INTERVAL = 30_000
const SPORT_KEY_NFL = 'americanfootball_nfl'

export default function NFLCommandCenter() {
  const [games, setGames] = useState<NflGame[]>([])
  const [groups, setGroups] = useState<NflPlayerGroup[]>(loadNflGroups)
  const [activeView, setActiveView] = useState<'scoreboard' | 'groups' | 'group-detail'>('scoreboard')
  const [selectedGroup, setSelectedGroup] = useState<NflPlayerGroup | null>(null)
  const [playerStats, setPlayerStats] = useState<Record<string, Record<string, string>>>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NflPlayer[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupPlayers, setNewGroupPlayers] = useState<NflPlayer[]>([])

  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [propsModalPlayer, setPropsModalPlayer] = useState<NflPlayer | null>(null)
  const [playerPropsData, setPlayerPropsData] = useState<PlayerProp[]>([])
  const [propsLoading, setPropsLoading] = useState(false)
  const [propsError, setPropsError] = useState('')

  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyDraft, setApiKeyDraft] = useState(getOddsApiKey())
  const [oddsEvents, setOddsEvents] = useState<{ id: string; homeTeam: string; awayTeam: string }[]>([])

  const refreshData = useCallback(async () => {
    try {
      const data = await fetchNflScoreboard()
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
    fetchOddsEvents(SPORT_KEY_NFL)
      .then(setOddsEvents)
      .catch(() => {})
  }, [])

  useEffect(() => { saveNflGroups(groups) }, [groups])

  useEffect(() => {
    if (activeView !== 'group-detail' || !selectedGroup || games.length === 0) return
    const loadStats = async () => {
      const statsMap: Record<string, Record<string, string>> = {}
      for (const player of selectedGroup.players) {
        const playerGames = findNflPlayerGames(games, player)
        for (const game of playerGames) {
          try {
            const summary = await fetchNflGameSummary(game.id)
            const stats = extractNflPlayerStats(summary, player.id)
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
        const results = await searchNflPlayers(query)
        setSearchResults(results)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 400)
  }, [])

  const addPlayerToNewGroup = (player: NflPlayer) => {
    if (newGroupPlayers.find(p => p.id === player.id)) return
    setNewGroupPlayers(prev => [...prev, player])
  }

  const removePlayerFromNewGroup = (playerId: string) => {
    setNewGroupPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  const saveNewGroup = () => {
    if (!newGroupName.trim() || newGroupPlayers.length === 0) return
    const group: NflPlayerGroup = {
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

  const openGroupDetail = (group: NflPlayerGroup) => {
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
    fetchOddsEvents(SPORT_KEY_NFL)
      .then(setOddsEvents)
      .catch(() => {})
  }

  const openPlayerProps = async (player: NflPlayer) => {
    setPropsModalPlayer(player)
    setPlayerPropsData([])
    setPropsError('')

    if (!getOddsApiKey()) {
      setPropsError('Set your Odds API key to view player props.')
      return
    }

    setPropsLoading(true)
    try {
      const playerGames = findNflPlayerGames(games, player)
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

      const props = await fetchPlayerProps(SPORT_KEY_NFL, oddsEvent.id, getPropMarkets(SPORT_KEY_NFL))
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

  const liveGames = games.filter(isNflGameLive)
  const scheduledGames = games.filter(g => !isNflGameLive(g) && !g.status.type.completed)
  const completedGames = games.filter(g => g.status.type.completed)
  const hasApiKey = !!getOddsApiKey()

  return (
    <>
    <SEO title="NFL Command Center" description="Live NFL scores, odds, player props, and group stats" />
    <StarField shootingStars nebulaOrbs />
    <Navbar />
    <div className="nfl-page">
      <div className="nfl-top-bar">
        <Link to="/tools" className="nfl-back-link">&larr; Tools</Link>
        <h1 className="nfl-title">NFL Command Center</h1>
      </div>

      <div className="nfl-refresh-bar">
        <div className="nfl-last-updated">
          {lastUpdated && <>Updated {lastUpdated.toLocaleTimeString()}</>}
          <span className="nfl-auto-label">Auto-refresh 30s</span>
        </div>
        <div className="nfl-refresh-actions">
          <button className="nfl-api-key-btn" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
            {hasApiKey ? 'API Key Set' : 'Set Odds API Key'}
          </button>
          <button className="nfl-refresh-btn" onClick={manualRefresh} disabled={loading}>
            <span className={`nfl-refresh-icon ${loading ? 'spinning' : ''}`}>&#x21bb;</span>
            Refresh
          </button>
        </div>
      </div>

      {showApiKeyInput && (
        <div className="nfl-api-key-panel">
          <p className="nfl-api-key-info">
            Enter your <a href="https://the-odds-api.com" target="_blank" rel="noreferrer">The Odds API</a> key for player props and betting odds. Free tier: 500 requests/month.
          </p>
          <div className="nfl-api-key-row">
            <input
              type="password"
              className="nfl-api-key-input"
              placeholder="Paste API key..."
              value={apiKeyDraft}
              onChange={e => setApiKeyDraft(e.target.value)}
            />
            <button className="nfl-save-btn" onClick={saveApiKey}>Save</button>
            <button className="nfl-cancel-btn" onClick={() => setShowApiKeyInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="nfl-tabs">
        <button className={`nfl-tab ${activeView === 'scoreboard' ? 'active' : ''}`} onClick={() => setActiveView('scoreboard')}>
          Scoreboard {liveGames.length > 0 && <span className="nfl-live-badge">{liveGames.length} LIVE</span>}
        </button>
        <button className={`nfl-tab ${activeView === 'groups' || activeView === 'group-detail' ? 'active' : ''}`} onClick={() => setActiveView('groups')}>
          My Groups ({groups.length})
        </button>
      </div>

      {activeView === 'scoreboard' && (
        <div className="nfl-scoreboard">
          {loading && games.length === 0 && (
            <div className="nfl-loading">
              <div className="nfl-spinner" />
              <p>Loading games...</p>
            </div>
          )}

          {!loading && games.length === 0 && (
            <div className="nfl-empty">
              <p>No games scheduled for today.</p>
            </div>
          )}

          {liveGames.length > 0 && (
            <div className="nfl-section">
              <h2 className="nfl-section-title">
                <span className="nfl-pulse-dot" />Live Now
              </h2>
              <div className="nfl-games-grid">
                {liveGames.map(game => <NflGameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}

          {scheduledGames.length > 0 && (
            <div className="nfl-section">
              <h2 className="nfl-section-title">Upcoming</h2>
              <div className="nfl-games-grid">
                {scheduledGames.map(game => <NflGameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}

          {completedGames.length > 0 && (
            <div className="nfl-section">
              <h2 className="nfl-section-title">Completed</h2>
              <div className="nfl-games-grid">
                {completedGames.map(game => <NflGameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'groups' && (
        <div className="nfl-groups">
          <div className="nfl-groups-header">
            <h2>Player Groups</h2>
            <button className="nfl-create-btn" onClick={() => { setCreatingGroup(true); setShowSearch(true) }}>
              + New Group
            </button>
          </div>

          {creatingGroup && (
            <div className="nfl-create-group-panel">
              <div className="nfl-create-group-top">
                <input
                  className="nfl-group-name-input"
                  placeholder="Group name..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  autoFocus
                />
                <div className="nfl-create-actions">
                  <button className="nfl-save-btn" onClick={saveNewGroup} disabled={!newGroupName.trim() || newGroupPlayers.length === 0}>
                    Save Group
                  </button>
                  <button className="nfl-cancel-btn" onClick={() => { setCreatingGroup(false); setShowSearch(false); setNewGroupPlayers([]); setNewGroupName(''); setSearchQuery(''); setSearchResults([]) }}>
                    Cancel
                  </button>
                </div>
              </div>

              {newGroupPlayers.length > 0 && (
                <div className="nfl-selected-players">
                  {newGroupPlayers.map(p => (
                    <div key={p.id} className="nfl-selected-chip">
                      {p.headshot && <img src={p.headshot} alt="" className="nfl-chip-avatar" />}
                      <span>{p.fullName}</span>
                      <button className="nfl-chip-remove" onClick={() => removePlayerFromNewGroup(p.id)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {showSearch && (
                <div className="nfl-search-panel">
                  <input
                    className="nfl-search-input"
                    placeholder="Search NFL players..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                  />
                  {searching && <div className="nfl-search-loading">Searching...</div>}
                  {searchResults.length > 0 && (
                    <div className="nfl-search-results">
                      {searchResults.map(player => (
                        <button
                          key={player.id}
                          className={`nfl-search-result ${newGroupPlayers.find(p => p.id === player.id) ? 'added' : ''}`}
                          onClick={() => addPlayerToNewGroup(player)}
                          disabled={!!newGroupPlayers.find(p => p.id === player.id)}
                        >
                          <div className="nfl-result-avatar">
                            {player.headshot
                              ? <img src={player.headshot} alt="" />
                              : <div className="nfl-avatar-placeholder">{player.fullName.charAt(0)}</div>}
                          </div>
                          <div className="nfl-result-info">
                            <div className="nfl-result-name">{player.fullName}</div>
                            <div className="nfl-result-meta">
                              {player.position && <span>{player.position}</span>}
                              {player.team.abbreviation && <span> · {player.team.abbreviation}</span>}
                              {player.jersey && <span> #{player.jersey}</span>}
                            </div>
                          </div>
                          {newGroupPlayers.find(p => p.id === player.id)
                            ? <span className="nfl-result-added">Added</span>
                            : <span className="nfl-result-add">+ Add</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && searchQuery && searchResults.length === 0 && (
                    <div className="nfl-search-empty">No players found for &quot;{searchQuery}&quot;</div>
                  )}
                </div>
              )}
            </div>
          )}

          {groups.length === 0 && !creatingGroup && (
            <div className="nfl-empty">
              <p>No groups yet. Create one to start tracking players!</p>
            </div>
          )}

          <div className="nfl-groups-list">
            {groups.map(group => (
              <div key={group.id} className="nfl-group-card" onClick={() => openGroupDetail(group)}>
                <div className="nfl-group-card-top">
                  <h3>{group.name}</h3>
                  <button className="nfl-group-delete" onClick={e => { e.stopPropagation(); deleteGroup(group.id) }}>&times;</button>
                </div>
                <div className="nfl-group-players-preview">
                  {group.players.slice(0, 5).map(p => (
                    <div key={p.id} className="nfl-group-player-mini">
                      {p.headshot
                        ? <img src={p.headshot} alt="" className="nfl-mini-avatar" />
                        : <div className="nfl-mini-placeholder">{p.fullName.charAt(0)}</div>}
                    </div>
                  ))}
                  {group.players.length > 5 && (
                    <div className="nfl-group-more">+{group.players.length - 5}</div>
                  )}
                </div>
                <div className="nfl-group-count">{group.players.length} player{group.players.length !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'group-detail' && selectedGroup && (
        <div className="nfl-group-detail">
          <button className="nfl-detail-back" onClick={() => setActiveView('groups')}>&larr; Back to Groups</button>
          <h2 className="nfl-detail-title">{selectedGroup.name}</h2>

          <div className="nfl-detail-players">
            {selectedGroup.players.map(player => {
              const playerGames = findNflPlayerGames(games, player)
              const liveGame = playerGames.find(isNflGameLive)
              const nextGame = playerGames.find(g => !isNflGameLive(g) && !g.status.type.completed)
              const stats = playerStats[player.id]
              const displayGame = liveGame || nextGame || playerGames.find(g => g.status.type.completed)

              return (
                <div key={player.id} className={`nfl-detail-card ${liveGame ? 'is-live' : ''}`}>
                  <div className="nfl-detail-card-header">
                    <div className="nfl-detail-player-info" onClick={() => openPlayerProps(player)} style={{ cursor: 'pointer' }}>
                      <div className="nfl-detail-avatar">
                        {player.headshot
                          ? <img src={player.headshot} alt="" />
                          : <div className="nfl-avatar-placeholder-lg">{player.fullName.charAt(0)}</div>}
                      </div>
                      <div>
                        <div className="nfl-detail-player-name">
                          {player.fullName}
                          <span className="nfl-props-hint">View Props</span>
                        </div>
                        <div className="nfl-detail-player-meta">
                          {player.position} · {player.team.abbreviation}
                          {player.jersey && ` #${player.jersey}`}
                        </div>
                      </div>
                    </div>

                    {liveGame && (
                      <div className="nfl-live-indicator">
                        <span className="nfl-pulse-dot" />
                        <span className="nfl-live-text">LIVE</span>
                        <span className="nfl-live-clock">{getNflGameStatusText(liveGame)}</span>
                      </div>
                    )}
                  </div>

                  {liveGame && (
                    <div className="nfl-detail-game-score">
                      <div className="nfl-score-team">
                        {liveGame.awayTeam.logo && <img src={liveGame.awayTeam.logo} alt="" className="nfl-score-logo" />}
                        <span className="nfl-score-abbr">{liveGame.awayTeam.abbreviation}</span>
                        <span className="nfl-score-val">{liveGame.awayTeam.score}</span>
                      </div>
                      <span className="nfl-score-vs">vs</span>
                      <div className="nfl-score-team">
                        {liveGame.homeTeam.logo && <img src={liveGame.homeTeam.logo} alt="" className="nfl-score-logo" />}
                        <span className="nfl-score-abbr">{liveGame.homeTeam.abbreviation}</span>
                        <span className="nfl-score-val">{liveGame.homeTeam.score}</span>
                      </div>
                    </div>
                  )}

                  {displayGame?.odds && (
                    <NflOddsDisplay odds={displayGame.odds} homeAbbr={displayGame.homeTeam.abbreviation} awayAbbr={displayGame.awayTeam.abbreviation} />
                  )}

                  {stats && (
                    <div className="nfl-detail-stats">
                      <h4>Stat Line</h4>
                      <div className="nfl-stats-grid">
                        {Object.entries(stats).map(([label, value]) => (
                          <div key={label} className="nfl-stat-item">
                            <span className="nfl-stat-label">{label}</span>
                            <span className="nfl-stat-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!liveGame && nextGame && (
                    <div className="nfl-detail-next-game">
                      <h4>Next Game</h4>
                      <div className="nfl-next-matchup">
                        <span>{nextGame.awayTeam.abbreviation}</span>
                        <span className="nfl-next-at">@</span>
                        <span>{nextGame.homeTeam.abbreviation}</span>
                        <span className="nfl-next-time">{getNflGameStatusText(nextGame)}</span>
                      </div>
                    </div>
                  )}

                  {!liveGame && !nextGame && !stats && (
                    <div className="nfl-detail-no-game">No game data available today</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {propsModalPlayer && (
        <div className="nfl-modal-overlay" onClick={() => setPropsModalPlayer(null)}>
          <div className="nfl-modal" onClick={e => e.stopPropagation()}>
            <div className="nfl-modal-header">
              <div className="nfl-modal-player-info">
                {propsModalPlayer.headshot && <img src={propsModalPlayer.headshot} alt="" className="nfl-modal-avatar" />}
                <div>
                  <div className="nfl-modal-player-name">{propsModalPlayer.fullName}</div>
                  <div className="nfl-modal-player-meta">
                    {propsModalPlayer.position} · {propsModalPlayer.team.abbreviation}
                    {propsModalPlayer.jersey && ` #${propsModalPlayer.jersey}`}
                  </div>
                </div>
              </div>
              <button className="nfl-modal-close" onClick={() => setPropsModalPlayer(null)}>&times;</button>
            </div>

            <h3 className="nfl-modal-section-title">Player Props</h3>

            {propsLoading && (
              <div className="nfl-loading">
                <div className="nfl-spinner" />
                <p>Loading props...</p>
              </div>
            )}

            {propsError && (
              <div className="nfl-props-error">
                <p>{propsError}</p>
                {!hasApiKey && (
                  <button className="nfl-save-btn" onClick={() => { setPropsModalPlayer(null); setShowApiKeyInput(true) }}>
                    Set API Key
                  </button>
                )}
              </div>
            )}

            {!propsLoading && playerPropsData.length > 0 && (
              <div className="nfl-props-list">
                {playerPropsData.map((prop, i) => (
                  <div key={i} className="nfl-prop-card">
                    <div className="nfl-prop-header">
                      <span className="nfl-prop-market">{prop.description}</span>
                      <span className="nfl-prop-line">Line: {prop.line}</span>
                    </div>
                    <div className="nfl-prop-odds-row">
                      <div className={`nfl-prop-side ${prop.overConfidence >= 50 ? 'favored' : ''}`}>
                        <span className="nfl-prop-direction">OVER</span>
                        <span className="nfl-prop-odds-value">{prop.overOdds > 0 ? '+' : ''}{prop.overOdds}</span>
                        <div className="nfl-confidence-bar">
                          <div className="nfl-confidence-fill over" style={{ width: `${prop.overConfidence}%` }} />
                        </div>
                        <span className="nfl-confidence-pct">{prop.overConfidence}%</span>
                      </div>
                      <div className={`nfl-prop-side ${prop.underConfidence >= 50 ? 'favored' : ''}`}>
                        <span className="nfl-prop-direction">UNDER</span>
                        <span className="nfl-prop-odds-value">{prop.underOdds > 0 ? '+' : ''}{prop.underOdds}</span>
                        <div className="nfl-confidence-bar">
                          <div className="nfl-confidence-fill under" style={{ width: `${prop.underConfidence}%` }} />
                        </div>
                        <span className="nfl-confidence-pct">{prop.underConfidence}%</span>
                      </div>
                    </div>
                    <div className="nfl-prop-bookmaker">via {prop.bookmaker}</div>
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

function NflOddsDisplay({ odds, homeAbbr, awayAbbr }: { odds: NflGame['odds']; homeAbbr: string; awayAbbr: string }) {
  if (!odds) return null
  return (
    <div className="nfl-odds-display">
      <h4>Odds</h4>
      <div className="nfl-odds-grid">
        {odds.spread && (
          <div className="nfl-odds-item">
            <span className="nfl-odds-label">Spread</span>
            <span className="nfl-odds-value">{odds.spread.team} {Number(odds.spread.line) > 0 ? '+' : ''}{odds.spread.line}</span>
          </div>
        )}
        {odds.moneyLine && (
          <>
            <div className="nfl-odds-item">
              <span className="nfl-odds-label">{awayAbbr} ML</span>
              <span className="nfl-odds-value">
                {Number(odds.moneyLine.away) > 0 ? '+' : ''}{odds.moneyLine.away}
                <span className="nfl-odds-conf">{oddsToConfidence(Number(odds.moneyLine.away))}%</span>
              </span>
            </div>
            <div className="nfl-odds-item">
              <span className="nfl-odds-label">{homeAbbr} ML</span>
              <span className="nfl-odds-value">
                {Number(odds.moneyLine.home) > 0 ? '+' : ''}{odds.moneyLine.home}
                <span className="nfl-odds-conf">{oddsToConfidence(Number(odds.moneyLine.home))}%</span>
              </span>
            </div>
          </>
        )}
        {odds.overUnder && (
          <div className="nfl-odds-item">
            <span className="nfl-odds-label">O/U</span>
            <span className="nfl-odds-value">{odds.overUnder}</span>
          </div>
        )}
      </div>
      {odds.provider && <div className="nfl-odds-provider">via {odds.provider}</div>}
    </div>
  )
}

function NflGameCard({ game }: { game: NflGame }) {
  const live = isNflGameLive(game)
  return (
    <div className={`nfl-game-card ${live ? 'is-live' : ''} ${game.status.type.completed ? 'is-final' : ''}`}>
      {live && (
        <div className="nfl-game-live-bar">
          <span className="nfl-pulse-dot" />
          <span>{getNflGameStatusText(game)}</span>
        </div>
      )}
      {!live && (
        <div className="nfl-game-status-bar">{getNflGameStatusText(game)}</div>
      )}
      <div className="nfl-game-teams">
        <div className="nfl-game-team">
          {game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="nfl-team-logo" />}
          <div className="nfl-team-info">
            <span className="nfl-team-name">{game.awayTeam.abbreviation}</span>
            <span className="nfl-team-record">{game.awayTeam.record}</span>
          </div>
          <span className="nfl-team-score">{game.awayTeam.score}</span>
        </div>
        <div className="nfl-game-team">
          {game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="nfl-team-logo" />}
          <div className="nfl-team-info">
            <span className="nfl-team-name">{game.homeTeam.abbreviation}</span>
            <span className="nfl-team-record">{game.homeTeam.record}</span>
          </div>
          <span className="nfl-team-score">{game.homeTeam.score}</span>
        </div>
      </div>
      {game.odds && (
        <div className="nfl-game-odds-bar">
          {game.odds.spread && (
            <span className="nfl-game-odds-chip">
              {game.odds.spread.team} {Number(game.odds.spread.line) > 0 ? '+' : ''}{game.odds.spread.line}
            </span>
          )}
          {game.odds.moneyLine && (
            <span className="nfl-game-odds-chip">
              ML: {Number(game.odds.moneyLine.away) > 0 ? '+' : ''}{game.odds.moneyLine.away} / {Number(game.odds.moneyLine.home) > 0 ? '+' : ''}{game.odds.moneyLine.home}
            </span>
          )}
          {game.odds.overUnder && (
            <span className="nfl-game-odds-chip">O/U {game.odds.overUnder}</span>
          )}
        </div>
      )}
    </div>
  )
}
