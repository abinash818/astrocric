const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/phonepe');

class PhonePeService {

    // Generate checksum for API requests
    generateChecksum(payload) {
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const string = base64Payload + '/pg/v1/pay' + config.saltKey;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        return sha256 + '###' + config.saltIndex;
    }

    // Create payment request
    async initiatePayment({ amount, userId, predictionId, phone, merchantTransactionId }) {
        const txnId = merchantTransactionId || `MT_${Date.now()}_${predictionId}`;

        const payload = {
            merchantId: config.merchantId,
            merchantTransactionId: txnId,
            merchantUserId: `USER_${userId}`,
            amount: amount * 100, // Convert to paise
            redirectUrl: config.redirectUrl,
            redirectMode: 'POST',
            callbackUrl: config.callbackUrl,
            mobileNumber: phone.replace('+91', '').replace('+', ''),
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        const checksum = this.generateChecksum(payload);
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

        try {
            const response = await axios.post(
                `${config.apiUrl}/pg/v1/pay`,
                {
                    request: base64Payload
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum
                    }
                }
            );

            return {
                success: true,
                merchantTransactionId: txnId,
                redirectUrl: response.data.data.instrumentResponse.redirectInfo.url
            };
        } catch (error) {
            console.error('PhonePe payment initiation error:', error.response?.data || error.message);
            throw new Error('Payment initiation failed');
        }
    }

    // Verify payment status
    async verifyPayment(merchantTransactionId) {
        const string = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}` + config.saltKey;
        const checksum = crypto.createHash('sha256').update(string).digest('hex') + '###' + config.saltIndex;

        try {
            const response = await axios.get(
                `${config.apiUrl}/pg/v1/status/${config.merchantId}/${merchantTransactionId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'X-MERCHANT-ID': config.merchantId
                    }
                }
            );

            return {
                success: response.data.success,
                code: response.data.code,
                transactionId: response.data.data?.transactionId,
                amount: response.data.data?.amount,
                state: response.data.data?.state
            };
        } catch (error) {
            console.error('PhonePe verification error:', error.response?.data || error.message);
            throw new Error('Payment verification failed');
        }
    }

    // Verify webhook signature
    verifyWebhookSignature(base64Response, receivedChecksum) {
        const string = base64Response + config.saltKey;
        const calculatedChecksum = crypto.createHash('sha256').update(string).digest('hex') + '###' + config.saltIndex;
        return calculatedChecksum === receivedChecksum;
    }
}

module.exports = new PhonePeService();
