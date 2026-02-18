require('dotenv').config();
const adminController = require('./src/controllers/adminController');

const req = {};
const res = {
    json: (data) => console.log('Success:', JSON.stringify(data, null, 2)),
    status: (code) => ({
        json: (error) => console.error('Error:', code, error)
    })
};

(async () => {
    console.log('Running syncMatches...');
    try {
        await adminController.syncMatches(req, res);
    } catch (e) {
        console.error('Script error:', e);
    }
    console.log('Done.');
    process.exit();
})();
