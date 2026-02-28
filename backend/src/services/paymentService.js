const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, CreateSdkOrderRequest } = require('pg-sdk-node');
const config = require('../config/phonepe');
const axios = require('axios');
const crypto = require('crypto');

// Initialize Client for Web forwarding (Unified SDK/Hermes)
// Detect Sandbox vs Production based on URL
const isSandbox = config.apiUrl && (config.apiUrl.includes('sandbox') || config.apiUrl.includes('preprod'));
const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;

// Production Checklist: Disable logging for live (Force enabled for debugging)
const enableLogging = true;

console.log(`[PhonePe] Initializing in ${isSandbox ? 'SANDBOX' : 'PRODUCTION'} mode`);
console.log(`[PhonePe] API URL: ${config.apiUrl}`);
console.log(`[PhonePe] Logging: ${enableLogging}`);

const client = StandardCheckoutClient.getInstance(
    config.clientId,
    config.clientSecret,
    config.clientVersion,
    env
);

class PhonePeService {
    // Web Checkout (Mobile) - Support for Standard MIDs
    // Web Checkout (Mobile) - Support for Standard MIDs
    async getSdkToken({ amount, userId, merchantTransactionId, phone, paymentModeConfig }) {
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

            // Inject paymentModeConfig if provided (e.g. to restrict to UPI)
            if (paymentModeConfig) {
                request.paymentFlow = {
                    ...request.paymentFlow,
                    paymentModeConfig: paymentModeConfig
                };
            }

            if (enableLogging) {
                console.log('--- Initiating PhonePe Pay ---');
                console.log('MID:', config.merchantId);
                console.log('Transaction:', txnId);
                console.log('Amount (paise):', Math.round(amount * 100));
                console.log('Env:', env);
            }

            const response = await client.pay(request);

            if (enableLogging) {
                console.log('[PhonePe] Pay Response Success:', response.redirectUrl);
            }

            return {
                merchantTransactionId: txnId,
                redirectUrl: response.redirectUrl,
                isWebFlow: true
            };
        } catch (error) {
            console.error('PhonePe Web Checkout error:', error);
            if (error.response) {
                console.error('PhonePe error response:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error('Failed to create payment link: ' + error.message);
        }
    }

    // Create Standard Web Checkout Request
    async initiatePayment({ amount, userId, predictionId, phone, merchantTransactionId, paymentModeConfig }) {
        const txnId = merchantTransactionId || `MT_${Date.now()}_${predictionId}`;
        return this.getSdkToken({ amount, userId, merchantTransactionId: txnId, phone, paymentModeConfig });
    }

    // New: Get UPI Intent Deep Link (For Native Apps)
    async getUpiIntent({ amount, userId, merchantTransactionId, phone }) {
        try {
            console.log('[PhonePe] Standard account detected. Falling back to SDK Flow for UPI Intent.');

            // Standard MIDs often cannot use Direct V1 Intent API.
            // We use the SDK flow but with UPI restriction.
            const sdkResult = await this.getSdkToken({
                amount,
                userId,
                merchantTransactionId,
                phone,
                paymentModeConfig: { "enabledPaymentModes": [{ "type": "UPI" }] }
            });

            return {
                ...sdkResult,
                intentUrl: sdkResult.redirectUrl, // Fallback for app compatibility
                isNativeFlow: false,
                isWebFallback: true
            };
        } catch (error) {
            console.error('PhonePe UPI Intent Fallback Error:', error.message);
            throw new Error('Failed to initiate UPI payment: ' + error.message);
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
