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
    // Unified SDK (Mobile) - Get Order ID and Token
    async getSdkToken({ amount, userId, merchantTransactionId, phone }) {
        try {
            const env = config.apiUrl && config.apiUrl.includes('sandbox') ? Env.SANDBOX : Env.PRODUCTION;
            const mobileClient = StandardCheckoutClient.getInstance(
                config.merchantId,
                config.saltKey,
                config.saltIndex,
                env
            );

            const request = CreateSdkOrderRequest.CreateSdkOrderRequestBuilder()
                .merchantId(config.merchantId)
                .merchantTransactionId(merchantTransactionId)
                .amount(Math.round(amount * 100))
                .merchantUserId(`USER_${userId}`)
                .callbackUrl(config.callbackUrl)
                .mobileNumber(phone ? phone.replace('+91', '').replace('+', '') : '')
                .paymentInstrument({ type: "PAY_PAGE" })
                .build();

            // Check if method exists (Runtime check for robustness)
            if (typeof mobileClient.createSdkOrder === 'function') {
                const response = await mobileClient.createSdkOrder(request);
                return {
                    orderId: response.orderId,
                    token: response.token,
                    merchantTransactionId: merchantTransactionId
                };
            } else if (typeof mobileClient.pay === 'function') {
                // Fallback to pay method if it's an older unified version
                const response = await mobileClient.pay(request);
                return {
                    orderId: merchantTransactionId,
                    token: response.token || merchantTransactionId,
                    merchantTransactionId: merchantTransactionId,
                    redirectUrl: response.redirectUrl
                };
            } else {
                throw new Error('PhonePe SDK client missing required methods');
            }
        } catch (error) {
            console.error('PhonePe SDK Create Order failed, falling back to legacy format:', error.message);
            // Legacy/Direct integration fallback for emergency
            const payload = {
                merchantId: config.merchantId,
                merchantTransactionId: merchantTransactionId,
                merchantUserId: `USER_${userId}`,
                amount: Math.round(amount * 100),
                mobileNumber: phone ? phone.replace('+91', '').replace('+', '') : '',
                callbackUrl: config.callbackUrl,
                paymentInstrument: { type: "PAY_PAGE" }
            };
            const base64Body = Buffer.from(JSON.stringify(payload)).toString('base64');
            const stringToHash = base64Body + "/pg/v1/pay" + config.saltKey;
            const checksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + "###" + config.saltIndex;

            return {
                base64Body,
                checksum,
                merchantTransactionId,
                isLegacy: true
            };
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
