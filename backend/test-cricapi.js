require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.CRICKET_API_KEY;
const API_URL = process.env.CRICKET_API_URL;

(async () => {
    try {
        console.log(`Fetching from ${API_URL}/currentMatches...`);
        const response = await axios.get(`${API_URL}/currentMatches`, {
            params: { apikey: API_KEY, offset: 0 }
        });

        console.log('Status:', response.status);
        if (response.data && response.data.data && response.data.data.length > 0) {
            console.log('First Match Data (Score):');
            const match = response.data.data[0];
            console.log('Score:', JSON.stringify(match.score, null, 2));
            console.log('Status:', match.status);

            // Debug Logic
            if (match.score && Array.isArray(match.score)) {
                const team1Name = match.teams?.[0] || match.teamInfo?.[0]?.name;
                const team2Name = match.teams?.[1] || match.teamInfo?.[1]?.name;
                console.log(`Team1: "${team1Name}", Team2: "${team2Name}"`);

                match.score.forEach(s => {
                    console.log(`Checking inning: "${s.inning}"`);
                    if (s.inning.includes(team1Name)) {
                        console.log(`-> MATCHES Team1! Score: ${s.r}/${s.w} (${s.o})`);
                    } else if (s.inning.includes(team2Name)) {
                        console.log(`-> MATCHES Team2! Score: ${s.r}/${s.w} (${s.o})`);
                    } else {
                        console.log('-> NO MATCH');
                    }
                });
            } else {
                console.log('No score array found.');
            }
        } else {
            console.log('No matches found or invalid format.');
            console.log(response.data);
        }
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) console.error(e.response.data);
    }
})();
