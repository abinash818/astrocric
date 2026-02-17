module.exports = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    saltKey: process.env.PHONEPE_SALT_KEY,
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    apiUrl: process.env.PHONEPE_API_URL || 'https://api.phonepe.com/apis/hermes',
    redirectUrl: process.env.API_BASE_URL + '/api/payment/callback',
    callbackUrl: process.env.API_BASE_URL + '/api/payment/webhook'
};
