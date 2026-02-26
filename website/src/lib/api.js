const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'sbastro.com'
    ? 'https://sbastro.com'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!res.ok) {
            console.error(`API error ${res.status} at ${endpoint}`);
            return null;
        }

        return res.json();
    } catch (error) {
        console.error(`API fetch failed for ${endpoint}:`, error.message);
        return null;
    }
}

// Matches
export async function getUpcomingMatches(page = 1, limit = 20) {
    return fetchAPI(`/api/matches/upcoming?page=${page}&limit=${limit}`, { next: { revalidate: 60 } });
}

export async function getLiveMatches() {
    return fetchAPI('/api/matches/live', { cache: 'no-store' });
}

export async function getFinishedMatches(page = 1, limit = 20) {
    return fetchAPI(`/api/matches/finished?page=${page}&limit=${limit}`, { next: { revalidate: 300 } });
}

export async function getMatchById(matchId) {
    return fetchAPI(`/api/matches/${matchId}`, { next: { revalidate: 60 } });
}

export async function getMatchScorecard(matchId) {
    return fetchAPI(`/api/matches/${matchId}/scorecard`, { cache: 'no-store' });
}

// Predictions (auth required)
export async function getPredictionForMatch(matchId, token) {
    return fetchAPI(`/api/predictions/match/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function getPurchasedPredictions(token) {
    return fetchAPI('/api/predictions/purchased', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

// Auth
export async function sendOTP(phone) {
    return fetchAPI('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
}

export async function verifyOTP(phone, otp) {
    return fetchAPI('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
    });
}

// Payment
export async function rechargeWallet(amount, token) {
    return fetchAPI('/api/payment/recharge', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
    });
}

export async function purchasePrediction(matchId, token) {
    return fetchAPI(`/api/payment/purchase/${matchId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
}
