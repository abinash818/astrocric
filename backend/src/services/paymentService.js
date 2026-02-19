const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, CreateSdkOrderRequest } = require('pg-sdk-node');
const config = require('../config/phonepe');
const axios = require('axios');
const crypto = require('crypto');

// Initialize Client for Web forwarding (Unified SDK/Hermes)
const env = config.apiUrl && config.apiUrl.includes('sandbox') ? Env.SANDBOX : Env.PRODUCTION;
const client = StandardCheckoutClient.getInstance(
    config.clientId,
    config.clientSecret,
    config.clientVersion,
    env
);

class PhonePeService {
    // Web Checkout (Mobile) - Support for Standard MIDs
    async getSdkToken({ amount, userId, merchantTransactionId, phone }) {
        try {
            const txnId = merchantTransactionId || `T${Date.now()}`;

            // Ensure we use the correct merchantId from config
            const request = StandardCheckoutPayRequest.builder()
                .merchantOrderId(txnId)
                .amount(Math.round(amount * 100))
                .redirectUrl(config.redirectUrl)
                .message(`Payment for User ${userId}`)
                .build();

            // Explicitly set merchantId as required by PhonePe Backend
            request.merchantId = config.merchantId;

            console.log('--- Initiating PhonePe Pay ---');
            console.log('MID:', config.merchantId);
            console.log('Transaction:', txnId);

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
        return this.getSdkToken({ amount, userId, merchantTransactionId: txnId, phone });
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
