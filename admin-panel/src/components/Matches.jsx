import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './Matches.css';

function Matches() {
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [seriesList, setSeriesList] = useState([]);
    const [availableMatches, setAvailableMatches] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [syncingSeriesId, setSyncingSeriesId] = useState(null);
    const [syncingMatchId, setSyncingMatchId] = useState(null);
    const [activeTab, setActiveTab] = useState('current'); // 'current' or 'series'

    // Initial load: Fetch current series and available matches
    useEffect(() => {
        handleSearchSeries();
        fetchAvailableMatches();
    }, []);

    const fetchAvailableMatches = async () => {
        setLoadingAvailable(true);
        try {
            const response = await apiService.get('/admin/available-matches');
            if (response.matches) {
                setAvailableMatches(response.matches);
            }
        } catch (error) {
            console.error('Fetch available matches error:', error);
        } finally {
            setLoadingAvailable(false);
        }
    };

    const handleSearchSeries = async () => {
        setSearching(true);
        try {
            const response = await apiService.get(`/admin/series?search=${searchTerm}`);
            if (response.series) {
                setSeriesList(response.series);
            }
        } catch (error) {
            console.error('Search series error:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleMatchSync = async (apiMatchId) => {
        setSyncingMatchId(apiMatchId);
        setMessage('');

        try {
            const response = await apiService.post(`/admin/matches/sync/${apiMatchId}`, {});

            if (response.success) {
                setMessage(`✅ Match Synced Successfully`);
                // Update local state to show synced
                setAvailableMatches(prev => prev.map(m =>
                    m.id === apiMatchId ? { ...m, isSynced: true } : m
                ));
            } else {
                setMessage('❌ Match sync failed');
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setSyncingMatchId(null);
        }
    };

    const handleSeriesSync = async (seriesId) => {
        setSyncingSeriesId(seriesId);
        setMessage('');

        try {
            const response = await apiService.post(`/admin/series/${seriesId}/sync`, {});

            if (response.success) {
                setMessage(`✅ Series Synced: ${response.stats.new} new, ${response.stats.updated} updated`);
            } else {
                setMessage('❌ Series sync failed');
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setSyncingSeriesId(null);
        }
    };

    const handleGlobalSync = async () => {
        setSyncing(true);
        setMessage('');

        try {
            const response = await apiService.post('/admin/matches/sync', {});

            if (response.success) {
                setMessage(`✅ Global Sync complete: ${response.stats.new} new, ${response.stats.updated} updated`);
            } else {
                setMessage('❌ Global sync failed');
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="matches">
            <div className="page-header">
                <h1>Match Management</h1>
                <div className="header-actions">
                    <button onClick={fetchAvailableMatches} className="refresh-btn">🔄 Refresh List</button>
                    <button
                        onClick={handleGlobalSync}
                        disabled={syncing}
                        className="sync-button"
                    >
                        {syncing ? '🔄 Syncing...' : '🔄 Sync All Active'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'current' ? 'active' : ''}`}
                    onClick={() => setActiveTab('current')}
                >
                    Current Matches
                </button>
                <button
                    className={`tab ${activeTab === 'series' ? 'active' : ''}`}
                    onClick={() => setActiveTab('series')}
                >
                    Series Search
                </button>
            </div>

            {activeTab === 'current' && (
                <div className="current-matches-section card">
                    <div className="section-header">
                        <h3>Live & Upcoming Matches (Available in API)</h3>
                        <p className="subtitle">Only current matches are shown here. Old matches are filtered out.</p>
                    </div>

                    <div className="matches-grid">
                        {loadingAvailable ? (
                            <div className="loading-text">Fetching current matches...</div>
                        ) : availableMatches.length > 0 ? (
                            availableMatches.map((match) => (
                                <div key={match.id} className={`match-card ${match.status.toLowerCase().includes('won') ? 'finished' : ''}`}>
                                    <div className="match-time">
                                        <span>{new Date(match.dateTimeGMT).toLocaleDateString()}</span>
                                        <span>{new Date(match.dateTimeGMT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="match-teams">
                                        <div className="team">{match.teams[0]}</div>
                                        <div className="vs">VS</div>
                                        <div className="team">{match.teams[1]}</div>
                                    </div>
                                    <div className="match-info-mini">
                                        <span className="type">{match.matchType.toUpperCase()}</span>
                                        <span className="venue">{match.venue}</span>
                                    </div>
                                    <div className="match-footer">
                                        <span className={`sync-status ${match.isSynced ? 'synced' : ''}`}>
                                            {match.isSynced ? '✓ Synced' : 'Not Synced'}
                                        </span>
                                        <button
                                            onClick={() => handleMatchSync(match.id)}
                                            disabled={syncingMatchId !== null}
                                            className={`match-sync-btn ${syncingMatchId === match.id ? 'syncing' : ''}`}
                                        >
                                            {syncingMatchId === match.id ? '🔄' : (match.isSynced ? 'Update' : 'Sync Match')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-text">No active matches found in the API right now.</div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'series' && (
                <div className="series-section card">
                    <div className="section-header">
                        <h3>Series Search</h3>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search series (e.g. IPL, Big Bash)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearchSeries()}
                            />
                            <button onClick={handleSearchSeries} disabled={searching} className="search-btn">
                                {searching ? '...' : '🔍'}
                            </button>
                        </div>
                    </div>

                    <div className="series-list">
                        {searching ? (
                            <div className="loading-text">Loading series...</div>
                        ) : seriesList.length > 0 ? (
                            <div className="series-grid">
                                {seriesList.map((series) => (
                                    <div key={series.id} className="series-item">
                                        <div className="series-info">
                                            <h4>{series.name}</h4>
                                            <p>{series.startDate} - {series.endDate}</p>
                                            <div className="series-stats">
                                                <span>🏏 {series.matches} Matches</span>
                                                {series.t20 > 0 && <span>• T20</span>}
                                                {series.odi > 0 && <span>• ODI</span>}
                                                {series.test > 0 && <span>• TEST</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSeriesSync(series.id)}
                                            disabled={syncingSeriesId !== null}
                                            className={`series-sync-btn ${syncingSeriesId === series.id ? 'syncing' : ''}`}
                                        >
                                            {syncingSeriesId === series.id ? '🔄' : 'Sync Series'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-text">No series found. Try a different search.</div>
                        )}
                    </div>
                </div>
            )}

            <div className="info-card mt-4">
                <h3>Sync Information</h3>
                <p>
                    <strong>Current Matches:</strong> Sync specific live or upcoming matches individually.
                    <strong>Series Search:</strong> Sync all matches for a major tournament.
                </p>
                <ul>
                    <li>Predicted Old Matches: Only matches with predictions are shown in history.</li>
                    <li>Global Sync: Automatically updates all active international matches.</li>
                </ul>
            </div>
        </div>
    );
}

export default Matches;
