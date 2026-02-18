const sdk = require('pg-sdk-node');
console.log('SDK Exports:', Object.keys(sdk));

try {
    const { StandardCheckoutPayRequest, CreateSdkOrderRequest } = sdk;
    console.log('StandardCheckoutPayRequest:', typeof StandardCheckoutPayRequest);
    console.log('CreateSdkOrderRequest:', typeof CreateSdkOrderRequest);
} catch (e) {
    console.error('Error accessing SDK classes:', e);
}
