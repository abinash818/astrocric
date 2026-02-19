const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, CreateSdkOrderRequest } = require('pg-sdk-node');
const config = require('../config/phonepe');
const axios = require('axios');
const crypto = require('crypto');

// Initialize Client for Web forwarding
const env = config.apiUrl && config.apiUrl.includes('sandbox') ? Env.SANDBOX : Env.PRODUCTION;
const client = StandardCheckoutClient.getInstance(
    config.merchantId,
    config.saltKey,
    config.saltIndex,
    env
);

class PhonePeService {
    // Web Checkout (Mobile) - Support for Standard MIDs
    async getSdkToken({ amount, userId, merchantTransactionId, phone }) {
        try {
            const txnId = merchantTransactionId || `T${Date.now()}`;

            const request = StandardCheckoutPayRequest.StandardCheckoutBuilder()
                .merchantId(config.merchantId)
                .merchantTransactionId(txnId)
                .amount(Math.round(amount * 100))
                .merchantUserId(`USER_${userId}`)
                .redirectUrl(config.redirectUrl)
                .redirectMode("GET") // GET is safer for browser redirects from mobile
                .callbackUrl(config.callbackUrl)
                .mobileNumber(phone ? phone.replace('+91', '').replace('+', '') : '')
                .paymentInstrument({ type: "PAY_PAGE" })
                .build();

            const response = await client.pay(request);

            return {
                merchantTransactionId: txnId,
                redirectUrl: response.redirectUrl,
                isWebFlow: true
            };
        } catch (error) {
            console.error('PhonePe Web Checkout error:', error);
            throw new Error('Failed to create payment link: ' + error.message);
        }
    }

    // Create payment request
    async initiatePayment({ amount, userId, predictionId, phone, merchantTransactionId }) {
        const txnId = merchantTransactionId || `MT_${Date.now()}_${predictionId}`;

        try {
            const request = StandardCheckoutPayRequest.StandardCheckoutBuilder()
                .merchantId(config.merchantId)
                .merchantTransactionId(txnId)
                .amount(amount * 100) // Convert to paise
                .merchantUserId(`USER_${userId}`)
                .redirectUrl(config.redirectUrl)
                .redirectMode("POST")
                .callbackUrl(config.callbackUrl)
                .mobileNumber(phone.replace('+91', '').replace('+', ''))
                .paymentInstrument({ type: "PAY_PAGE" })
                .build();

            const response = await client.pay(request);

            return {
                success: true,
                merchantTransactionId: txnId,
                redirectUrl: response.redirectUrl
            };

        } catch (error) {
            console.error('PhonePe SDK initiation error:', error);
            throw new Error('Payment initiation failed');
        }
    }

    // Verify payment status
    async verifyPayment(merchantTransactionId) {
        try {
            const response = await client.getOrderStatus(merchantTransactionId);

            return {
                success: response.state === 'COMPLETED',
                code: response.state,
                transactionId: response.transactionId, // SDK might return different field names, need to check response structure
                amount: response.amount,
                state: response.state,
                paymentDetails: response.paymentDetails
            };
        } catch (error) {
            console.error('PhonePe SDK verification error:', error);
            throw new Error('Payment verification failed');
        }
    }

    // Verify webhook signature (Manual implementation retained for reliability)
    verifyWebhookSignature(base64Response, receivedChecksum) {
        const string = base64Response + config.saltKey;
        const calculatedChecksum = crypto.createHash('sha256').update(string).digest('hex') + '###' + config.saltIndex;
        return calculatedChecksum === receivedChecksum;
    }
}

module.exports = new PhonePeService();
