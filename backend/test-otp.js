require('dotenv').config();
const otpService = require('./src/services/otpService');

async function testOTP() {
    console.log('Testing OTP Service...');
    console.log('MSG91 Config:');
    console.log('- Auth Key:', process.env.MSG91_AUTH_KEY ? 'Set' : 'Missing');
    console.log('- Sender ID:', process.env.MSG91_SENDER_ID);
    console.log('- Template ID:', process.env.MSG91_TEMPLATE_ID);

    const phone = '919876543210'; // Dummy number, replace with real one for actual test
    const otp = otpService.generateOTP();
    console.log(`Generated OTP: ${otp} (Length: ${otp.length})`);

    try {
        console.log(`Sending OTP to ${phone}...`);
        const result = await otpService.sendOTP(phone, otp);
        console.log('Result:', result ? 'Success' : 'Failed');
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testOTP();
