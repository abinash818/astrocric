import { useState } from 'react';
import apiService from '../services/apiService';
import './Login.css';

function Login({ onLogin }) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiService.post('/auth/admin/login', { phone });

            if (response.success) {
                apiService.setToken(response.token);
                onLogin(response.user);
            } else {
                setError('Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Astrocric Admin</h1>
                <p className="subtitle">Cricket Prediction Platform</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Admin Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+919999999999"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="note">
                    Development mode: Login with admin phone number
                </p>
            </div>
        </div>
    );
}

export default Login;
