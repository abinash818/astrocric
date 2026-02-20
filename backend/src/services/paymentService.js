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
                request.paymentFlow.paymentModeConfig = paymentModeConfig;
            }

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

    // Create Standard Web Checkout Request
    async initiatePayment({ amount, userId, predictionId, phone, merchantTransactionId }) {
        const txnId = merchantTransactionId || `MT_${Date.now()}_${predictionId}`;
        return this.getSdkToken({ amount, userId, merchantTransactionId: txnId, phone });
    }

    // New: Get UPI Intent Deep Link (For Native Apps)
    async getUpiIntent({ amount, userId, merchantTransactionId, phone }) {
        try {
            const txnId = merchantTransactionId || `T${Date.now()}`;

            // Construct Payload
            const payload = {
                merchantId: config.merchantId,
                merchantTransactionId: txnId,
                merchantUserId: String(userId),
                amount: Math.round(amount * 100),
                redirectUrl: config.redirectUrl,
                redirectMode: "POST",
                callbackUrl: config.callbackUrl,
                mobileNumber: phone,
                paymentInstrument: {
                    type: "UPI_INTENT",
                    targetApp: "com.phonepe.app" // Optional: Omit for generic intent, or specific if needed. 
                    // PhonePe doc says: type: UPI_INTENT returns intentUrl.
                }
            };

            // Base64 Encode
            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

            // Sign Request
            const stringToSign = base64Payload + "/pg/v1/pay" + config.saltKey;
            const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
            const checksum = sha256 + "###" + config.saltIndex;

            // API Call
            const options = {
                method: 'post',
                url: `${config.apiUrl}/pg/v1/pay`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum
                },
                data: {
                    request: base64Payload
                }
            };

            console.log('--- Requesting UPI Intent ---');
            const response = await axios(options);

            if (response.data.success) {
                // The intent is usually in response.data.data.instrumentResponse.intentUrl
                return {
                    merchantTransactionId: txnId,
                    intentUrl: response.data.data.instrumentResponse.intentUrl,
                    isNativeFlow: true
                };
            } else {
                throw new Error(response.data.message || 'Payment initiation failed');
            }

        } catch (error) {
            console.error('PhonePe UPI Intent Error:', error.response ? error.response.data : error.message);
            throw new Error('Failed to get UPI Intent');
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
