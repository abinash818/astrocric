const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const cricketApiService = require('./src/services/cricketApiService');

async function inspect() {
    const matches = await cricketApiService.getCurrentMatches();
    if (matches.length > 0) {
        console.log('Keys of first match:', Object.keys(matches[0]));
        console.log('Teams field:', matches[0].teams);
        console.log('TeamInfo field:', matches[0].teamInfo);
    }
}
inspect();
