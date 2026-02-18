const sdk = require('pg-sdk-node');
console.log('SDK Exports:', Object.keys(sdk));

try {
    const { StandardCheckoutPayRequest } = sdk;
    console.log('StandardCheckoutPayRequest type:', typeof StandardCheckoutPayRequest);
} catch (e) {
    console.error('Error accessing StandardCheckoutPayRequest:', e);
}
