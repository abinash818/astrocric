const apiBaseUrl = process.env.API_BASE_URL || 'https://astrocric.onrender.com';

module.exports = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    saltKey: process.env.PHONEPE_SALT_KEY,
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    apiUrl: process.env.PHONEPE_API_URL || 'https://api.phonepe.com/apis/hermes',
    redirectUrl: apiBaseUrl + '/api/payment/callback',
    callbackUrl: apiBaseUrl + '/api/payment/webhook'
};
