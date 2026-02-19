const sdk = require('pg-sdk-node');
console.log('SDK Keys:', Object.keys(sdk));
if (sdk.StandardCheckoutPayRequest) {
    console.log('StandardCheckoutPayRequest Keys:', Object.keys(sdk.StandardCheckoutPayRequest));
    console.log('StandardCheckoutPayRequest.builder type:', typeof sdk.StandardCheckoutPayRequest.builder);
}
