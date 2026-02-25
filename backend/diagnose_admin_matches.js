const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

async function diagnose() {
    try {
        console.log('Testing /admin/available-matches...');

        // We need a token. Let's try to get one if we know admin credentials, 
        // or just mock the logic if we can't login.
        // Actually, I can just call the service directly in a script.
    } catch (e) {
        console.error(e);
    }
}
