const axios = require('axios');

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_URL = process.env.CRICKET_API_URL;

class CricketApiService {

    // Get current matches
    async getCurrentMatches() {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/currentMatches`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    offset: 0
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Cricket API - Get current matches error:', error.response?.data || error.message);
            throw new Error('Failed to fetch current matches');
        }
    }

    // Get match details by ID
    async getMatchDetails(matchId) {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/match_info`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    id: matchId
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Cricket API - Get match details error:', error.response?.data || error.message);
            throw new Error('Failed to fetch match details');
        }
    }

    // Get upcoming matches
    async getUpcomingMatches() {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/matches`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    offset: 0
                }
            });

            if (response.data && response.data.data) {
                // Filter for upcoming matches
                return response.data.data.filter(match =>
                    match.matchStarted === false && match.matchEnded === false
                );
            }
            return [];
        } catch (error) {
            console.error('Cricket API - Get upcoming matches error:', error.response?.data || error.message);
            throw new Error('Failed to fetch upcoming matches');
        }
    }

    // Get match score
    async getMatchScore(matchId) {
        try {
            const response = await axios.get(`${CRICKET_API_URL}/match_scorecard`, {
                params: {
                    apikey: CRICKET_API_KEY,
                    id: matchId
                }
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Cricket API - Get match score error:', error.response?.data || error.message);
            return null;
        }
    }

    // Transform API match data to our database format
    transformMatchData(apiMatch) {
        return {
            api_match_id: apiMatch.id,
            team1: apiMatch.teams?.[0] || apiMatch.teamInfo?.[0]?.name || 'Team 1',
            team2: apiMatch.teams?.[1] || apiMatch.teamInfo?.[1]?.name || 'Team 2',
            team1_flag_url: apiMatch.teamInfo?.[0]?.img || null,
            team2_flag_url: apiMatch.teamInfo?.[1]?.img || null,
            match_date: new Date(apiMatch.dateTimeGMT),
            match_type: apiMatch.matchType || 'Unknown',
            venue: apiMatch.venue || 'TBD',
            status: this.determineMatchStatus(apiMatch),
            result: apiMatch.status || null
        };
    }

    // Determine match status
    determineMatchStatus(apiMatch) {
        if (apiMatch.matchEnded) {
            return 'finished';
        } else if (apiMatch.matchStarted) {
            return 'live';
        } else {
            return 'upcoming';
        }
    }
}

module.exports = new CricketApiService();
