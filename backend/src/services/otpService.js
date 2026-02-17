const axios = require('axios');

const MSG91_API_URL = 'https://control.msg91.com/api/v5/otp';

class OtpService {

    // Generate 6-digit OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Send OTP via MSG91
    async sendOTP(phone, otp) {
        try {
            const response = await axios.post(
                `${MSG91_API_URL}?authkey=${process.env.MSG91_AUTH_KEY}&mobile=${phone.replace('+', '')}&otp=${otp}&sender=${process.env.MSG91_SENDER_ID}&template_id=${process.env.MSG91_TEMPLATE_ID}`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.type === 'success';
        } catch (error) {
            console.error('MSG91 OTP send error:', error.response?.data || error.message);

            // For development, log OTP to console
            if (process.env.NODE_ENV === 'development') {
                console.log(`📱 OTP for ${phone}: ${otp}`);
                return true; // Simulate success in development
            }

            throw new Error('Failed to send OTP');
        }
    }

    // Verify OTP expiration (5 minutes)
    isOTPExpired(createdAt) {
        const expiryTime = 5 * 60 * 1000; // 5 minutes
        return Date.now() - new Date(createdAt).getTime() > expiryTime;
    }
}

module.exports = new OtpService();
