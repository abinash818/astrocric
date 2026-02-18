require('dotenv').config();
const { syncMatches } = require('./src/controllers/adminController');
const db = require('./src/config/database');

// Mock req, res
const req = {};
const res = {
    json: (data) => console.log('Response:', data),
    status: (code) => ({ json: (data) => console.log('Error:', code, data) })
};

(async () => {
    console.log('Running sync...');
    // We need to call syncMatches but it's exported as part of module.
    // Actually, adminController.js likely exports an object or functions.
    // Let's check how it's required.
    // In server.js: app.use('/api/admin', require('./src/routes/admin'));
    // In routes/admin.js: const adminController = require('../controllers/adminController');
    // router.post('/sync-matches', ... adminController.syncMatches);

    // So we can require it.
    // But we need to make sure DB is connected.
    // `db` module handles connection pool.

    try {
        const adminController = require('./src/controllers/adminController');
        await adminController.syncMatches(req, res);
    } catch (e) {
        console.error(e);
    }

    // Allow time for logic to finish then exit (db pool might keep open)
    setTimeout(() => process.exit(), 5000);
})();
