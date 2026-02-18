const { StandardCheckoutClient, Env, CreateSdkOrderRequest } = require('pg-sdk-node');
const dotenv = require('dotenv');
dotenv.config();

const merchantId = process.env.PHONEPE_MERCHANT_ID;
const saltKey = process.env.PHONEPE_SALT_KEY;
const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
const env = Env.PRODUCTION; // Matches the Render setting

const client = StandardCheckoutClient.getInstance(
    merchantId,
    saltKey,
    saltIndex,
    env
);

async function test() {
    try {
        console.log('Testing CreateSdkOrderRequest...');
        // Let's try to see if CreateSdkOrderRequest has a builder
        // Since I don't have the docs, I'll try common patterns
        console.log('Available keys in CreateSdkOrderRequest:', Object.keys(CreateSdkOrderRequest));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
