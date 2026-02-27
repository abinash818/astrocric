const axios = require('axios');
require('dotenv').config();

async function testSync() {
    try {
        console.log('--- Testing Sync Auth (Local) ---');
        const payload = {
            email: 'testuser' + Date.now() + '@gmail.com',
            name: 'Test Google User',
            uid: 'google_' + Date.now(),
            photoURL: 'https://example.com/photo.jpg'
            // NO phone number included
        };

        const response = await axios.post('http://localhost:3000/api/auth/sync', payload);
        console.log('Success! Status:', response.status);
        console.log('Data:', response.data);
        console.log('✅ Local test passed: Sync works without phone number.');
    } catch (err) {
        console.error('❌ Local test failed:', err.response ? err.response.data : err.message);
    }
}

// Check if server is running, if not, we might need to test the logic directly or ask user to start it.
// For now, I'll assume I can run the server briefly or just test the logic.
testSync();
