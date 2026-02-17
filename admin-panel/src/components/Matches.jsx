import { useState } from 'react';
import apiService from '../services/apiService';
import './Matches.css';

function Matches() {
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState('');

    const handleSync = async () => {
        setSyncing(true);
        setMessage('');

        try {
            const response = await apiService.post('/admin/matches/sync', {});

            if (response.success) {
                setMessage(`✅ Synced ${response.stats.new} new matches, updated ${response.stats.updated} matches`);
            } else {
                setMessage('❌ Sync failed');
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
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="sync-button"
                >
                    {syncing ? '🔄 Syncing...' : '🔄 Sync Matches from API'}
                </button>
            </div>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="info-card">
                <h3>Match Sync</h3>
                <p>
                    Click the "Sync Matches" button to fetch the latest matches from the Cricket API.
                    This will update existing matches and add new upcoming matches.
                </p>
                <ul>
                    <li>Fetches current and upcoming matches</li>
                    <li>Updates match status automatically</li>
                    <li>Adds team flags and venue information</li>
                </ul>
            </div>
        </div>
    );
}

export default Matches;
