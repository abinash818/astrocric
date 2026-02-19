const apiBaseUrl = process.env.API_BASE_URL || 'https://astrocric.onrender.com';

module.exports = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    saltKey: process.env.PHONEPE_SALT_KEY,
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
    apiUrl: process.env.PHONEPE_API_URL || 'https://api.phonepe.com/apis/hermes',
    redirectUrl: apiBaseUrl + '/api/payment/callback',
    callbackUrl: apiBaseUrl + '/api/payment/webhook'
};
