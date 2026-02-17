import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Matches from './components/Matches';
import Predictions from './components/Predictions';
import apiService from './services/apiService';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');

    useEffect(() => {
        // Check if already logged in
        const token = localStorage.getItem('admin_token');
        if (token) {
            // Auto-login (in production, verify token)
            setUser({ name: 'Admin' });
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        apiService.clearToken();
        setUser(null);
        setCurrentPage('dashboard');
    };

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="app">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <h2>🏏 Astrocric</h2>
                    <p>Admin Panel</p>
                </div>

                <ul className="nav-menu">
                    <li
                        className={currentPage === 'dashboard' ? 'active' : ''}
                        onClick={() => setCurrentPage('dashboard')}
                    >
                        📊 Dashboard
                    </li>
                    <li
                        className={currentPage === 'matches' ? 'active' : ''}
                        onClick={() => setCurrentPage('matches')}
                    >
                        🏏 Matches
                    </li>
                    <li
                        className={currentPage === 'predictions' ? 'active' : ''}
                        onClick={() => setCurrentPage('predictions')}
                    >
                        📝 Predictions
                    </li>
                </ul>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-name">{user.name || 'Admin'}</div>
                        <div className="user-phone">{user.phone}</div>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </nav>

            <main className="main-content">
                {currentPage === 'dashboard' && <Dashboard />}
                {currentPage === 'matches' && <Matches />}
                {currentPage === 'predictions' && <Predictions />}
            </main>
        </div>
    );
}

export default App;
