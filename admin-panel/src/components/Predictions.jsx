import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './Predictions.css';

function Predictions() {
    const [matches, setMatches] = useState({ live: [], upcoming: [] });
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedMatchTeams, setSelectedMatchTeams] = useState({ team1: '', team2: '' });

    // Squad State
    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerTeam, setNewPlayerTeam] = useState('');

    const [formData, setFormData] = useState({
        matchId: '',
        title: '',
        previewText: '',
        fullPrediction: '',
        predictedWinner: '',
        confidencePercentage: '',
        price: '',
        player_prediction_price: '',
        combo_price: '',
        key_players: [], // Array of { name, team, role: 'player' | 'c' | 'vc', selected: boolean }
        isPublished: true,
    });

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        setLoadingMatches(true);
        try {
            const liveRes = await apiService.get('/matches/live');
            const upcomingRes = await apiService.get('/matches/upcoming?limit=20');

            setMatches({
                live: liveRes.matches || [],
                upcoming: upcomingRes.matches || []
            });
        } catch (error) {
            console.error('Failed to load matches:', error);
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleAddPrediction = async (match) => {
        resetForm();
        setFormData(prev => ({ ...prev, matchId: match.id }));
        setSelectedMatchTeams({ team1: match.team1, team2: match.team2 });
        setNewPlayerTeam(match.team1); // Default team for manual adding
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Try to fetch players if they aren't already fetched
        fetchSquad(match.id);
    };

    const fetchSquad = async (matchId) => {
        setLoadingPlayers(true);
        try {
            const res = await apiService.get(`/admin/matches/${matchId}/squad`);
            if (res.success && res.squad && Array.isArray(res.squad)) {
                const allPlayers = [];
                res.squad.forEach(team => {
                    if (team.players && Array.isArray(team.players)) {
                        team.players.forEach(p => {
                            allPlayers.push({
                                id: p.id || Math.random().toString(36).substr(2, 9),
                                name: p.name,
                                team: team.teamName,
                                role: 'player',
                                selected: false
                            });
                        });
                    }
                });
                setPlayers(allPlayers);
            } else {
                setPlayers([]);
            }
        } catch (error) {
            console.error('Failed to fetch squad:', error);
            setPlayers([]);
        } finally {
            setLoadingPlayers(false);
        }
    };

    const handleAddManualPlayer = () => {
        if (!newPlayerName.trim()) return;

        const player = {
            id: Date.now(),
            name: newPlayerName.trim(),
            team: newPlayerTeam,
            role: 'player',
            selected: false
        };

        setPlayers(prev => [...prev, player]);
        setNewPlayerName('');
    };

    const togglePlayerSelection = (playerId) => {
        setPlayers(prev => prev.map(p => {
            if (p.id === playerId) {
                // Check if already 11 players selected
                const selectedCount = prev.filter(x => x.selected).length;
                if (!p.selected && selectedCount >= 11) {
                    alert('You can only select 11 players for the Dream Team');
                    return p;
                }
                return { ...p, selected: !p.selected, role: !p.selected ? p.role : 'player' };
            }
            return p;
        }));
    };

    const setPlayerRole = (playerId, role) => {
        setPlayers(prev => prev.map(p => {
            if (p.id === playerId) {
                return { ...p, role: p.role === role ? 'player' : role };
            }
            // Ensure only one C and one VC
            if (p.role === role) {
                return { ...p, role: 'player' };
            }
            return p;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedPlayers = players.filter(p => p.selected);

        // Final validation
        if (!formData.predictedWinner) {
            alert('Please select a predicted winner');
            return;
        }

        const finalData = {
            ...formData,
            key_players: selectedPlayers.map(p => ({
                name: p.name,
                team: p.team,
                role: p.role
            }))
        };

        try {
            await apiService.post('/admin/predictions', finalData);
            alert('Prediction created successfully!');
            resetForm();
            loadMatches();
        } catch (error) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    const resetForm = () => {
        setFormData({
            matchId: '',
            title: '',
            previewText: '',
            fullPrediction: '',
            predictedWinner: '',
            confidencePercentage: '',
            price: '',
            player_prediction_price: '',
            combo_price: '',
            key_players: [],
            isPublished: true,
        });
        setPlayers([]);
        setSelectedMatchTeams({ team1: '', team2: '' });
        setShowForm(false);
    };

    const renderMatchCard = (match) => (
        <div key={match.id} className="match-card">
            <div className={`match-status ${match.status || 'unknown'}`}>{(match.status || 'Unknown').toUpperCase()}</div>
            <div className="match-teams">
                {match.team1} vs {match.team2}
            </div>
            <div className="match-details">
                <span>{match.match_type || 'Unknown'}</span> • <span>{match.match_date ? new Date(match.match_date).toLocaleDateString() : 'TBD'}</span>
            </div>
            <div className="match-actions">
                <button
                    onClick={() => handleAddPrediction(match)}
                    className={match.has_prediction ? "secondary-button" : "primary-button"}
                    disabled={match.has_prediction}
                >
                    {match.has_prediction ? 'Prediction Added' : '+ Add Prediction'}
                </button>
            </div>
            {match.has_prediction && <div className="prediction-badge">Has Prediction</div>}
        </div>
    );

    return (
        <div className="predictions">
            <div className="page-header">
                <h1>Prediction Management</h1>
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="primary-button">
                        + Custom Prediction
                    </button>
                )}
            </div>

            {showForm ? (
                <div className="prediction-form">
                    <h2>Create New Prediction</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Match ID *</label>
                                <input
                                    type="number"
                                    value={formData.matchId}
                                    onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                                    required
                                    disabled={!!formData.matchId}
                                />
                            </div>

                            <div className="form-group flex-1">
                                <label>Match prediction Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    placeholder="e.g., 500"
                                />
                            </div>
                        </div>

                        <div className="form-row mt-3">
                            <div className="form-group flex-1">
                                <label>Player Prediction Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.player_prediction_price}
                                    onChange={(e) => setFormData({ ...formData, player_prediction_price: e.target.value })}
                                    placeholder="e.g., 200"
                                />
                            </div>

                            <div className="form-group flex-1">
                                <label>Combo Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.combo_price}
                                    onChange={(e) => setFormData({ ...formData, combo_price: e.target.value })}
                                    placeholder="e.g., 600"
                                />
                            </div>
                        </div>

                        <div className="form-group mt-3">
                            <label>Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Expert Analysis: India vs Australia"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Preview Text *</label>
                            <textarea
                                value={formData.previewText}
                                onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                                placeholder="Short preview visible to all users..."
                                rows="3"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Full Prediction *</label>
                            <textarea
                                value={formData.fullPrediction}
                                onChange={(e) => setFormData({ ...formData, fullPrediction: e.target.value })}
                                placeholder="Detailed analysis visible after purchase..."
                                rows="8"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Predict Winner *</label>
                                {selectedMatchTeams.team1 ? (
                                    <div className="team-selection">
                                        <button
                                            type="button"
                                            className={`team-btn ${formData.predictedWinner === selectedMatchTeams.team1 ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, predictedWinner: selectedMatchTeams.team1 })}
                                        >
                                            {selectedMatchTeams.team1}
                                        </button>
                                        <div className="vs-divider">VS</div>
                                        <button
                                            type="button"
                                            className={`team-btn ${formData.predictedWinner === selectedMatchTeams.team2 ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, predictedWinner: selectedMatchTeams.team2 })}
                                        >
                                            {selectedMatchTeams.team2}
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.predictedWinner}
                                        onChange={(e) => setFormData({ ...formData, predictedWinner: e.target.value })}
                                        placeholder="e.g., India"
                                        required
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label>Confidence %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.confidencePercentage}
                                    onChange={(e) => setFormData({ ...formData, confidencePercentage: e.target.value })}
                                    placeholder="e.g., 85"
                                />
                            </div>
                        </div>

                        {/* KEY PLAYERS / SQUAD SECTION */}
                        <div className="squad-section mt-4">
                            <h3>Key Players / Squad Prediction</h3>
                            <div className="squad-controls">
                                <div className="manual-add">
                                    <input
                                        type="text"
                                        placeholder="Player Name"
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualPlayer())}
                                    />
                                    <select value={newPlayerTeam} onChange={(e) => setNewPlayerTeam(e.target.value)}>
                                        <option value={selectedMatchTeams.team1}>{selectedMatchTeams.team1}</option>
                                        <option value={selectedMatchTeams.team2}>{selectedMatchTeams.team2}</option>
                                    </select>
                                    <button type="button" onClick={handleAddManualPlayer} className="secondary-button">Add</button>
                                </div>
                                <div className="auto-fetch">
                                    <button
                                        type="button"
                                        onClick={() => fetchSquad(formData.matchId)}
                                        className="fetch-btn"
                                        disabled={loadingPlayers}
                                    >
                                        {loadingPlayers ? 'Fetching...' : '🔄 Fetch Playing XI'}
                                    </button>
                                </div>
                            </div>

                            <div className="squad-grid-container mt-3">
                                <div className="squad-header-info">
                                    <span>Selected: {players.filter(p => p.selected).length} / 11</span>
                                    {players.filter(p => p.role === 'c').length === 0 && <span className="warning-text">Select Captain (C)</span>}
                                    {players.filter(p => p.role === 'vc').length === 0 && <span className="warning-text">Select Vice-Captain (VC)</span>}
                                </div>

                                <div className="squad-lists-wrapper">
                                    <div className="team-squad">
                                        <h4>{selectedMatchTeams.team1}</h4>
                                        <div className="player-list">
                                            {players.filter(p => p.team === selectedMatchTeams.team1).map(player => (
                                                <div key={player.id} className={`player-item ${player.selected ? 'selected' : ''}`}>
                                                    <div className="player-info" onClick={() => togglePlayerSelection(player.id)}>
                                                        <span className="player-name">{player.name}</span>
                                                    </div>
                                                    {player.selected && (
                                                        <div className="player-roles">
                                                            <button
                                                                type="button"
                                                                className={`role-btn ${player.role === 'c' ? 'active c' : ''}`}
                                                                onClick={() => setPlayerRole(player.id, 'c')}
                                                            >C</button>
                                                            <button
                                                                type="button"
                                                                className={`role-btn ${player.role === 'vc' ? 'active vc' : ''}`}
                                                                onClick={() => setPlayerRole(player.id, 'vc')}
                                                            >VC</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="team-squad">
                                        <h4>{selectedMatchTeams.team2}</h4>
                                        <div className="player-list">
                                            {players.filter(p => p.team === selectedMatchTeams.team2).map(player => (
                                                <div key={player.id} className={`player-item ${player.selected ? 'selected' : ''}`}>
                                                    <div className="player-info" onClick={() => togglePlayerSelection(player.id)}>
                                                        <span className="player-name">{player.name}</span>
                                                    </div>
                                                    {player.selected && (
                                                        <div className="player-roles">
                                                            <button
                                                                type="button"
                                                                className={`role-btn ${player.role === 'c' ? 'active c' : ''}`}
                                                                onClick={() => setPlayerRole(player.id, 'c')}
                                                            >C</button>
                                                            <button
                                                                type="button"
                                                                className={`role-btn ${player.role === 'vc' ? 'active vc' : ''}`}
                                                                onClick={() => setPlayerRole(player.id, 'vc')}
                                                            >VC</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {loadingPlayers && (
                                    <div className="squad-loading-overlay">
                                        <div className="spinner"></div>
                                        <span>Fetching official squad...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group mt-4">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                />
                                Publish immediately
                            </label>
                        </div>

                        <div className="form-actions mt-4">
                            <button type="submit" className="primary-button">
                                Create Prediction
                            </button>
                            <button type="button" onClick={resetForm} className="secondary-button">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="matches-list-container">
                    {loadingMatches ? (
                        <div className="loading">Loading matches...</div>
                    ) : (
                        <>
                            <div className="matches-section">
                                <h2>Live Matches</h2>
                                {matches.live.length === 0 ? <p className="no-matches">No live matches currently.</p> : (
                                    <div className="matches-grid">
                                        {matches.live.map(renderMatchCard)}
                                    </div>
                                )}
                            </div>

                            <div className="matches-section mt-4">
                                <h2>Upcoming Matches</h2>
                                {matches.upcoming.length === 0 ? <p className="no-matches">No upcoming matches.</p> : (
                                    <div className="matches-grid">
                                        {matches.upcoming.map(renderMatchCard)}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Predictions;
