import { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import './Dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await apiService.get('/admin/dashboard/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{stats?.total_predictions || 0}</div>
                    <div className="stat-label">Total Predictions</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{stats?.total_users || 0}</div>
                    <div className="stat-label">Total Users</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">₹{stats?.total_revenue || 0}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-value">{stats?.total_purchases || 0}</div>
                    <div className="stat-label">Total Purchases</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🏏</div>
                    <div className="stat-value">{stats?.upcoming_matches || 0}</div>
                    <div className="stat-label">Upcoming Matches</div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
